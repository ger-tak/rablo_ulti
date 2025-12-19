import { shuffle } from './deck';
import { getBidById } from './bids';
import { legalMoves as rulesLegalMoves, trickWinner as rulesTrickWinner } from './rules';
import { assertEngineInvariants } from './invariants';
import type { BidDefinition } from './bids';
import type { Card, GameState, GameType, PlayerId, Suit, TrickState } from './types';

export type GamePhase = 'DEAL' | 'BID' | 'DECLARE_TRUMP' | 'PLAY' | 'SCORING' | 'PAYMENT';

export interface EngineState extends GameState {
  phase: GamePhase;
  dealer: PlayerId;
  talon: Card[];
  tricksWon: Record<PlayerId, Card[]>;
  selectedBidId?: string | undefined;
  highestBidId?: string | undefined;
  highestBidder?: PlayerId | undefined;
  consecutivePasses: number;
  hasNonPassBid: boolean;
  bidNeedsDiscard: boolean;
  bidAwaitingTalonDecision: boolean;
  requireRaiseAfterTake: boolean;
  log: string[];
}

export const nextPlayer = (player: PlayerId): PlayerId => ((player + 1) % 3) as PlayerId;

const toRulesState = (state: EngineState): GameState => ({
  gameType: state.gameType,
  trumpSuit: state.trumpSuit,
  hands: state.hands,
  trick: state.trick,
  leader: state.leader,
  currentPlayer: state.currentPlayer,
  deck: state.deck
});

const emptyTricksWon = (): Record<PlayerId, Card[]> => ({ 0: [], 1: [], 2: [] });

const prepareForPlay = (state: EngineState): EngineState => {
  const handSizes = [state.hands[0].length, state.hands[1].length, state.hands[2].length];
  const maxSize = Math.max(...handSizes);
  const minSize = Math.min(...handSizes);
  if (maxSize === minSize) return state;

  const playerWithExtra =
    ([0, 1, 2] as PlayerId[]).find((player) => state.hands[player].length === maxSize) ?? state.dealer;
  const discardCount = maxSize - minSize;
  const discardPile = state.hands[playerWithExtra].slice(0, discardCount);
  const talon = [...state.talon, ...discardPile];

  const hands = {
    ...state.hands,
    [playerWithExtra]: state.hands[playerWithExtra].slice(discardCount)
  } as Record<PlayerId, Card[]>;

  return { ...state, hands, talon };
};

export const newGame = (seed?: number): EngineState => {
  const deck = shuffle(seed);
  const dealer: PlayerId = 0;
  const baseState: EngineState = {
    phase: 'DEAL',
    dealer,
    leader: nextPlayer(dealer),
    currentPlayer: nextPlayer(dealer),
    gameType: 'TRUMP',
    trumpSuit: undefined,
    hands: { 0: [], 1: [], 2: [] },
    talon: [],
    trick: { leader: nextPlayer(dealer), plays: [] },
    tricksWon: emptyTricksWon(),
    deck,
    selectedBidId: undefined,
    highestBidId: undefined,
    highestBidder: undefined,
    consecutivePasses: 0,
    hasNonPassBid: false,
    bidNeedsDiscard: false,
    bidAwaitingTalonDecision: false,
    requireRaiseAfterTake: false,
    log: ['New game created']
  };

  const nextState = deal(baseState, false);
  assertEngineInvariants(nextState);
  return nextState;
};

export const deal = (state: EngineState, cut: boolean): EngineState => {
  const deck = [...state.deck];

  // TODO: implement true cut order (7/5/5) later.
  if (cut) {
    // keep deterministic outcome for now
    const top = deck.shift();
    if (top) deck.push(top);
  }

  const first = nextPlayer(state.dealer);
  const second = nextPlayer(first);
  const hands: Record<PlayerId, Card[]> = { 0: [], 1: [], 2: [] };
  hands[first] = deck.slice(0, 12);
  hands[second] = deck.slice(12, 22);
  hands[state.dealer] = deck.slice(22, 32);

  const bidder = first;

  const nextState: EngineState = {
    ...state,
    phase: 'BID',
    hands,
    talon: [],
    deck: [],
    leader: bidder,
    currentPlayer: bidder,
    trick: { leader: bidder, plays: [] },
    tricksWon: emptyTricksWon(),
    highestBidId: undefined,
    highestBidder: undefined,
    consecutivePasses: 0,
    hasNonPassBid: false,
    bidNeedsDiscard: false,
    bidAwaitingTalonDecision: false,
    requireRaiseAfterTake: false,
    log: [...state.log, 'Cards dealt (12/10/10, talon later via discard)']
  };

  assertEngineInvariants(nextState);
  return nextState;
};

const bidRank = (bidId?: string): number => {
  if (!bidId) return -1;
  const bid = getBidById(bidId);
  return bid ? bid.rank : -1;
};

const ensureBiddingTurn = (state: EngineState, player: PlayerId) => {
  if (state.phase !== 'BID') throw new Error('Not in bidding phase');
  if (player !== state.currentPlayer) throw new Error('Not this player’s bidding turn');
};

export const bid = (state: EngineState, player: PlayerId, bidId: string): EngineState => {
  ensureBiddingTurn(state, player);
  if (bidId === 'passz') {
    throw new Error('Use passBid for passing');
  }

  const currentRank = bidRank(state.highestBidId);
  const nextBid = getBidById(bidId);
  if (!nextBid) throw new Error('Unknown bid');
  if (nextBid.rank <= currentRank) {
    throw new Error('Bid must be higher than current highest');
  }

  const nextPlayerTurn = nextPlayer(player);

  const nextState = {
    ...state,
    highestBidId: bidId,
    highestBidder: player,
    hasNonPassBid: true,
    consecutivePasses: 0,
    currentPlayer: nextPlayerTurn,
    log: [...state.log, `P${player} bids ${nextBid.name}`]
  };

  assertEngineInvariants(nextState);
  return nextState;
};

const advanceAfterPasses = (state: EngineState): EngineState => {
  if (!state.highestBidId || state.consecutivePasses < 2) {
    return state;
  }

  const bid = getBidById(state.highestBidId);
  if (!bid || state.highestBidder === undefined) return state;

  const { gameType, trumpSuit } = deriveGameType(bid, state.trumpSuit);
  if (bid.trump.kind === 'bidder') {
    return {
      ...state,
      selectedBidId: state.highestBidId,
      currentPlayer: state.highestBidder,
      leader: state.highestBidder,
      phase: 'DECLARE_TRUMP',
      gameType,
      log: [...state.log, `Bidding won by P${state.highestBidder} with ${bid.name}`]
    };
  }

  const prepared = prepareForPlay({
    ...state,
    selectedBidId: state.highestBidId,
    currentPlayer: state.highestBidder,
    leader: state.highestBidder,
    phase: 'PLAY',
    gameType,
    trumpSuit,
    trick: { leader: state.highestBidder, plays: [] },
    log: [...state.log, `Bidding won by P${state.highestBidder} with ${bid.name}`]
  });

  return prepared;
};

export const passBid = (state: EngineState, player: PlayerId): EngineState => {
  ensureBiddingTurn(state, player);

  const nextState: EngineState = {
    ...state,
    consecutivePasses: (state.consecutivePasses ?? 0) + 1,
    currentPlayer: nextPlayer(player),
    log: [...state.log, `P${player} passes`]
  };

  if (!nextState.highestBidId || nextState.consecutivePasses < 2) {
    assertEngineInvariants(nextState);
    return nextState;
  }

  const advancedState = advanceAfterPasses(nextState);
  assertEngineInvariants(advancedState);
  return advancedState;
};

export const declareTrump = (state: EngineState, player: PlayerId, suit: Suit): EngineState => {
  if (state.phase !== 'DECLARE_TRUMP') throw new Error('Not declaring trump right now');
  if (player !== state.currentPlayer) throw new Error('Not this player’s turn');

  const preparedState = prepareForPlay({
    ...state,
    trumpSuit: suit,
    gameType: 'TRUMP',
    phase: 'PLAY',
    trick: { leader: state.leader, plays: [] },
    log: [...state.log, `Trump declared as ${suit}`]
  });

  assertEngineInvariants(preparedState);
  return preparedState;
};
const deriveGameType = (
  bid: BidDefinition,
  trumpSuit?: Suit
): { gameType: GameType; trumpSuit?: Suit } => {
  if (bid.trump.kind === 'none') {
    return { gameType: 'NO_TRUMP' };
  }
  if (bid.trump.kind === 'piros') {
    return { gameType: 'TRUMP', trumpSuit: 'piros' };
  }
  return trumpSuit ? { gameType: 'TRUMP', trumpSuit } : { gameType: 'TRUMP' };
};

export const startPlay = (state: EngineState, bidId: string, trumpSuit?: Suit): EngineState => {
  const bid = getBidById(bidId);
  if (!bid) {
    throw new Error(`Unknown bid: ${bidId}`);
  }

  const { gameType, trumpSuit: derivedTrump } = deriveGameType(bid, trumpSuit);
  const leader = state.currentPlayer;
  const trick: TrickState = { leader, plays: [] };

  const nextState = prepareForPlay({
    ...state,
    selectedBidId: bidId,
    gameType,
    trumpSuit: derivedTrump,
    phase: 'PLAY',
    leader,
    currentPlayer: leader,
    trick,
    log: [...state.log, `Play started with bid ${bid.name}`]
  });

  assertEngineInvariants(nextState);
  return nextState;
};

export const engineLegalMoves = (state: EngineState, player: PlayerId): Card[] =>
  rulesLegalMoves(toRulesState(state), player);

export const playCard = (state: EngineState, player: PlayerId, card: Card): EngineState => {
  if (player !== state.currentPlayer) {
    throw new Error(`Not player ${player}'s turn`);
  }
  if (state.phase !== 'PLAY') {
    throw new Error('Cannot play a card outside of PLAY phase');
  }

  const hand = state.hands[player] ?? [];
  const cardIndex = hand.findIndex((c) => c.suit === card.suit && c.rank === card.rank);
  if (cardIndex === -1) {
    throw new Error('Card not in hand');
  }

  const legal = engineLegalMoves(state, player);
  const isLegal = legal.some((c) => c.suit === card.suit && c.rank === card.rank);
  if (!isLegal) {
    throw new Error('Illegal card for this trick');
  }

  const updatedHand = hand.filter((_, idx) => idx !== cardIndex);
  const updatedHands = {
    ...state.hands,
    [player]: updatedHand
  } as Record<PlayerId, Card[]>;

  const updatedPlays = [...state.trick.plays, { player, card }];
  const updatedTrick: TrickState = { leader: state.trick.leader, plays: updatedPlays };

  if (updatedPlays.length < 3) {
    const nextState = {
      ...state,
      hands: updatedHands,
      trick: updatedTrick,
      currentPlayer: nextPlayer(player)
    };
    assertEngineInvariants(nextState);
    return nextState;
  }

  const winner = rulesTrickWinner(toRulesState({ ...state, hands: updatedHands, trick: updatedTrick }));
  const trickCards = updatedPlays.map((p) => p.card);
  const updatedTricksWon: Record<PlayerId, Card[]> = {
    0: winner === 0 ? [...state.tricksWon[0], ...trickCards] : [...state.tricksWon[0]],
    1: winner === 1 ? [...state.tricksWon[1], ...trickCards] : [...state.tricksWon[1]],
    2: winner === 2 ? [...state.tricksWon[2], ...trickCards] : [...state.tricksWon[2]]
  };

  const remainingCards =
    updatedHands[0].length + updatedHands[1].length + updatedHands[2].length;

  const nextState = {
    ...state,
    hands: updatedHands,
    trick: { leader: winner, plays: [] },
    leader: winner,
    currentPlayer: winner,
    tricksWon: updatedTricksWon,
    phase: remainingCards === 0 ? 'SCORING' : state.phase,
    log: [...state.log, `Trick won by Player ${winner}`]
  };

  assertEngineInvariants(nextState);
  return nextState;
};
