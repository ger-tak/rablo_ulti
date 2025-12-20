import { shuffle } from './deck';
import { getBidById } from './bids';
import { legalMoves as rulesLegalMoves, trickWinner as rulesTrickWinner } from './rules';
import { assertEngineInvariants } from './invariants';
import { scoreRoundMVP } from './scoring';
import type { BidDefinition } from './bids';
import type { ScoreBreakdown } from './scoring';
import type { Card, GameState, GameType, PlayerId, Suit, TrickPlay, TrickState } from './types';

export type GamePhase =
  | 'DEAL'
  | 'BID'
  | 'DECLARE_TRUMP'
  | 'PLAY'
  | 'SCORING'
  | 'PAYMENT'
  | 'ROUND_END';

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
  trickIndex: number;
  belaAnnouncements: Array<{ player: PlayerId; suit: Suit; value: 20 | 40 }>;
  lastTrick: { winner: PlayerId; plays: TrickPlay[] } | null;
  kontraLevel: number;
  kontraTurn: 'DEFENDERS' | 'BIDDER' | null;
  kontraLocked: boolean;
  lastScore?: ScoreBreakdown | undefined;
  balances: Record<PlayerId, number>;
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

const initializeKontraForPlay = (state: EngineState): EngineState => ({
  ...state,
  kontraLevel: 0,
  kontraTurn: 'DEFENDERS',
  kontraLocked: false
});

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
    log: ['New game created'],
    trickIndex: 0,
    belaAnnouncements: [],
    lastTrick: null,
    kontraLevel: 0,
    kontraTurn: null,
    kontraLocked: false,
    lastScore: undefined,
    balances: { 0: 0, 1: 0, 2: 0 }
  };

  const nextState = deal(baseState, false);
  assertEngineInvariants(nextState);
  return nextState;
};

const assertPlayFirstTrick = (state: EngineState) => {
  if (state.phase !== 'PLAY') throw new Error('Not in PLAY phase');
  if (state.trickIndex !== 0) throw new Error('Only allowed before first trick completes');
};

const playerHasCard = (state: EngineState, player: PlayerId, suit: Suit, rank: Card['rank']): boolean =>
  !!state.hands[player].find((c) => c.suit === suit && c.rank === rank);

export const announceBela = (state: EngineState, player: PlayerId, suit: Suit): EngineState => {
  assertPlayFirstTrick(state);
  if (state.gameType !== 'TRUMP') throw new Error('Béla only in TRUMP games');
  if (player !== state.currentPlayer) throw new Error('Only current player may announce Béla');
  if (!playerHasCard(state, player, suit, 'K') || !playerHasCard(state, player, suit, 'Felső')) {
    throw new Error('Player does not have Béla in hand');
  }

  const already = state.belaAnnouncements.some((ann) => ann.player === player && ann.suit === suit);
  if (already) return state;

  const value = suit === state.trumpSuit ? 40 : 20;
  const next: EngineState = {
    ...state,
    belaAnnouncements: [...state.belaAnnouncements, { player, suit, value }],
    log: [...state.log, `P${player} announces Béla (${suit}) for ${value}`]
  };
  assertEngineInvariants(next);
  return next;
};

export const callKontra = (state: EngineState, player: PlayerId): EngineState => {
  assertPlayFirstTrick(state);
  if (state.kontraLocked) throw new Error('Kontra is locked for this round');
  if (state.trick.plays.length > 0) throw new Error('Kontra only before first card is played');
  const bidder = state.highestBidder;
  if (bidder === undefined) throw new Error('No bidder to kontra');

  if (state.kontraLevel >= 3) throw new Error('Maximum kontra level reached');

  const expectedTurn: 'DEFENDERS' | 'BIDDER' =
    state.kontraLevel === 0 ? 'DEFENDERS' : state.kontraLevel === 1 ? 'BIDDER' : 'DEFENDERS';

  if (state.kontraTurn !== expectedTurn) {
    throw new Error('Not the correct side to call kontra');
  }

  if ((expectedTurn === 'DEFENDERS' && player === bidder) || (expectedTurn === 'BIDDER' && player !== bidder)) {
    throw new Error('Invalid player for kontra turn');
  }

  const nextLevel = state.kontraLevel + 1;
  const nextTurn: 'DEFENDERS' | 'BIDDER' = expectedTurn === 'DEFENDERS' ? 'BIDDER' : 'DEFENDERS';
  const label = nextLevel === 1 ? 'Kontra' : nextLevel === 2 ? 'Rekontra' : 'Szubkontra';

  const next: EngineState = {
    ...state,
    kontraLevel: nextLevel,
    kontraTurn: nextTurn,
    log: [...state.log, `P${player} calls ${label}`]
  };
  assertEngineInvariants(next);
  return next;
};

export const nextRound = (state: EngineState): EngineState => {
  if (state.phase !== 'ROUND_END') throw new Error('Round not finished');
  const dealer = nextPlayer(state.dealer);
  const deck = shuffle();
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
    log: [...state.log, 'Next round started'],
    trickIndex: 0,
    belaAnnouncements: [],
    lastTrick: null,
    kontraLevel: 0,
    kontraTurn: null,
    kontraLocked: false,
    lastScore: undefined,
    balances: { ...state.balances }
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
    highestBidId: 'passz',
    highestBidder: bidder,
    consecutivePasses: 0,
    hasNonPassBid: false,
    bidNeedsDiscard: true,
    bidAwaitingTalonDecision: false,
    requireRaiseAfterTake: false,
    log: [...state.log, 'Cards dealt (12/10/10, talon later via discard)'],
    trickIndex: 0,
    belaAnnouncements: [],
    lastTrick: null,
    kontraLevel: 0,
    kontraTurn: null,
    kontraLocked: false,
    lastScore: undefined
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

export const discardToTalon = (state: EngineState, player: PlayerId, cards: Card[]): EngineState => {
  ensureBiddingTurn(state, player);
  if (!state.bidNeedsDiscard) {
    throw new Error('No discard required right now');
  }

  if (state.hands[player].length !== 12) {
    throw new Error('Discarder must have 12 cards');
  }

  if (cards.length !== 2) {
    throw new Error('Must discard exactly 2 cards');
  }

  const uniqueKeys = new Set(cards.map((c) => `${c.suit}-${c.rank}`));
  if (uniqueKeys.size !== 2) {
    throw new Error('Discarded cards must be distinct');
  }

  const updatedHand = [...state.hands[player]];
  for (const card of cards) {
    const index = updatedHand.findIndex((c) => c.suit === card.suit && c.rank === card.rank);
    if (index === -1) {
      throw new Error('Cannot discard card not in hand');
    }
    updatedHand.splice(index, 1);
  }

  const hands = { ...state.hands, [player]: updatedHand } as Record<PlayerId, Card[]>;
  const nextState: EngineState = {
    ...state,
    hands,
    talon: [...cards],
    bidNeedsDiscard: false,
    log: [...state.log, `P${player} discards to talon`]
  };

  assertEngineInvariants(nextState);
  return nextState;
};

export const bid = (state: EngineState, player: PlayerId, bidId: string): EngineState => {
  ensureBiddingTurn(state, player);
  if (bidId === 'passz') {
    throw new Error('Use passBid for passing');
  }
  if (state.bidNeedsDiscard) {
    throw new Error('Must discard 2 cards to talon before bidding');
  }
  if (state.requireRaiseAfterTake && player === state.highestBidder) {
    const currentRank = bidRank(state.highestBidId);
    const nextBid = getBidById(bidId);
    if (!nextBid) throw new Error('Unknown bid');
    if (nextBid.rank <= currentRank) {
      throw new Error('Highest bidder must raise after taking talon');
    }
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
    requireRaiseAfterTake: player === state.highestBidder ? false : state.requireRaiseAfterTake,
    consecutivePasses: 0,
    currentPlayer: nextPlayerTurn,
    log: [...state.log, `P${player} bids ${nextBid.name}`]
  };

  assertEngineInvariants(nextState);
  return nextState;
};

const finalizeBid = (state: EngineState, bidId: string, contractBidder: PlayerId): EngineState => {
  const bid = getBidById(bidId);
  if (!bid) return state;

  if (state.bidNeedsDiscard) {
    throw new Error('Cannot finalize bidding while discard to talon is still required');
  }

  const handSizes = [state.hands[0].length, state.hands[1].length, state.hands[2].length];
  handSizes.forEach((size, idx) => {
    if (size !== 10) {
      throw new Error(`Player ${idx} must have 10 cards to start play (got ${size})`);
    }
  });

  const bidder = state.highestBidder ?? state.currentPlayer;
  const { gameType, trumpSuit } = deriveGameType(bid, state.trumpSuit);
  if (bid.trump.kind === 'bidder') {
    return {
      ...state,
      highestBidId: bidId,
      selectedBidId: bidId,
      bidAwaitingTalonDecision: false,
      bidNeedsDiscard: false,
      consecutivePasses: 0,
      currentPlayer: contractBidder,
      leader: contractBidder,
      phase: 'DECLARE_TRUMP',
      gameType,
      trickIndex: 0,
      belaAnnouncements: [],
      kontraLevel: 0,
      kontraTurn: null,
      kontraLocked: false,
      lastTrick: null,
      lastScore: undefined,
      log: [...state.log, `Bidding won by P${contractBidder} with ${bid.name}`]
    };
  }

  const prepared = prepareForPlay({
    ...state,
    highestBidId: bidId,
    selectedBidId: bidId,
    bidAwaitingTalonDecision: false,
    bidNeedsDiscard: false,
    consecutivePasses: 0,
    currentPlayer: contractBidder,
    leader: contractBidder,
    phase: 'PLAY',
    gameType,
    trumpSuit,
    trick: { leader: contractBidder, plays: [] },
    trickIndex: 0,
    belaAnnouncements: [],
    kontraLevel: 0,
    kontraTurn: null,
    kontraLocked: false,
    lastTrick: null,
    lastScore: undefined,
    log: [...state.log, `Bidding won by P${contractBidder} with ${bid.name}`]
  });

  return initializeKontraForPlay(prepared);
};

export const passBid = (state: EngineState, player: PlayerId): EngineState => {
  ensureBiddingTurn(state, player);
  if (state.bidNeedsDiscard) {
    throw new Error('Must discard 2 cards to talon before bidding');
  }

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

  if (!nextState.hasNonPassBid) {
    const finalized = finalizeBid(nextState, 'passz', nextState.highestBidder ?? nextState.currentPlayer);
    assertEngineInvariants(finalized);
    return finalized;
  }

  const pausedState: EngineState = {
    ...nextState,
    bidAwaitingTalonDecision: true,
    consecutivePasses: 0,
    currentPlayer: nextState.highestBidder ?? nextState.currentPlayer,
    leader: nextState.highestBidder ?? nextState.leader,
    log: [...nextState.log, 'Awaiting talon decision']
  };

  assertEngineInvariants(pausedState);
  return pausedState;
};

export const takeTalon = (state: EngineState, player: PlayerId): EngineState => {
  if (!state.bidAwaitingTalonDecision) throw new Error('Not awaiting talon decision');
  if (player !== state.highestBidder) throw new Error('Only the highest bidder may take the talon');

  const newHand = [...state.hands[player], ...state.talon];
  const hands = { ...state.hands, [player]: newHand } as Record<PlayerId, Card[]>;

  const nextState: EngineState = {
    ...state,
    hands,
    talon: [],
    bidNeedsDiscard: true,
    requireRaiseAfterTake: true,
    bidAwaitingTalonDecision: false,
    consecutivePasses: 0,
    currentPlayer: player
  };

  assertEngineInvariants(nextState);
  return nextState;
};

export const declineTalon = (state: EngineState, player: PlayerId): EngineState => {
  if (!state.bidAwaitingTalonDecision) throw new Error('Not awaiting talon decision');
  if (player !== state.highestBidder) throw new Error('Only the highest bidder may decline the talon');
  if (!state.highestBidId) throw new Error('No highest bid to finalize');

  const finalized = finalizeBid(state, state.highestBidId, player);
  assertEngineInvariants(finalized);
  return finalized;
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
    kontraLevel: 0,
    kontraTurn: null,
    kontraLocked: false,
    log: [...state.log, `Trump declared as ${suit}`]
  });

  const initialized = initializeKontraForPlay(preparedState);
  assertEngineInvariants(initialized);
  return initialized;
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

  const preparedState = prepareForPlay({
    ...state,
    selectedBidId: bidId,
    gameType,
    trumpSuit: derivedTrump,
    phase: 'PLAY',
    leader,
    currentPlayer: leader,
    trick,
    trickIndex: 0,
    belaAnnouncements: [],
    kontraLevel: 0,
    kontraTurn: null,
    kontraLocked: false,
    lastTrick: null,
    lastScore: undefined,
    log: [...state.log, `Play started with bid ${bid.name}`]
  });

  const nextState = initializeKontraForPlay(preparedState);
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
  const kontraLocked = state.kontraLocked || (state.trickIndex === 0 && state.trick.plays.length === 0);

  if (updatedPlays.length < 3) {
    const nextState = {
      ...state,
      hands: updatedHands,
      trick: updatedTrick,
      kontraLocked,
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
  const completedTrickIndex = state.trickIndex + 1;
  const isRoundEnd = remainingCards === 0;
  const nextTrickIndex = isRoundEnd ? 10 : completedTrickIndex;

  const baseNextState: EngineState = {
    ...state,
    hands: updatedHands,
    trick: { leader: winner, plays: [] },
    leader: winner,
    currentPlayer: winner,
    tricksWon: updatedTricksWon,
    trickIndex: nextTrickIndex,
    lastTrick: { winner, plays: updatedPlays },
    kontraLocked,
    log: [...state.log, `Trick won by Player ${winner}`]
  };

  if (isRoundEnd) {
    const scored = scoreRoundMVP(baseNextState);
    const balances = { ...baseNextState.balances };
    Object.entries(scored.payouts).forEach(([pid, amount]) => {
      const player = Number.parseInt(pid, 10) as PlayerId;
      balances[player] = (balances[player] ?? 0) + amount;
    });

    const nextState: EngineState = {
      ...baseNextState,
      phase: 'ROUND_END',
      lastScore: scored,
      balances
    };
    assertEngineInvariants(nextState);
    return nextState;
  }

  const nextState = {
    ...baseNextState,
    phase: state.phase
  };

  assertEngineInvariants(nextState);
  return nextState;
};
