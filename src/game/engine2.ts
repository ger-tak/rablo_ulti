import { shuffle } from './deck';
import { getBidById } from './bids';
import { legalMoves as rulesLegalMoves, trickWinner as rulesTrickWinner } from './rules';
import type { BidDefinition } from './bids';
import type { Card, GameState, GameType, PlayerId, Suit, TrickState } from './types';

export type GamePhase = 'DEAL' | 'BID' | 'DECLARE_TRUMP' | 'PLAY' | 'SCORING' | 'PAYMENT';

export interface EngineState extends GameState {
  phase: GamePhase;
  dealer: PlayerId;
  talon: Card[];
  tricksWon: Record<PlayerId, Card[]>;
  selectedBidId?: string;
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
    log: ['New game created']
  };

  return deal(baseState, false);
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
  const order: PlayerId[] = [first, second, state.dealer];

  const hands: Record<PlayerId, Card[]> = { 0: [], 1: [], 2: [] };
  hands[first] = deck.slice(0, 12);
  hands[second] = deck.slice(12, 22);
  hands[state.dealer] = deck.slice(22, 32);

  const bidder = first;

  return {
    ...state,
    phase: 'BID',
    hands,
    talon: [],
    deck: [],
    leader: bidder,
    currentPlayer: bidder,
    trick: { leader: bidder, plays: [] },
    tricksWon: emptyTricksWon(),
    log: [...state.log, 'Cards dealt (12/10/10, talon later via discard)']
  };
};

const deriveGameType = (bid: BidDefinition, trumpSuit?: Suit): { gameType: GameType; trumpSuit?: Suit } => {
  if (bid.trump.kind === 'none') {
    return { gameType: 'NO_TRUMP', trumpSuit: undefined };
  }
  if (bid.trump.kind === 'piros') {
    return { gameType: 'TRUMP', trumpSuit: 'piros' };
  }
  return { gameType: 'TRUMP', trumpSuit };
};

export const startPlay = (state: EngineState, bidId: string, trumpSuit?: Suit): EngineState => {
  const bid = getBidById(bidId);
  if (!bid) {
    throw new Error(`Unknown bid: ${bidId}`);
  }

  const { gameType, trumpSuit: derivedTrump } = deriveGameType(bid, trumpSuit);
  const leader = state.currentPlayer;
  const trick: TrickState = { leader, plays: [] };

  return {
    ...state,
    selectedBidId: bidId,
    gameType,
    trumpSuit: derivedTrump,
    phase: 'PLAY',
    leader,
    currentPlayer: leader,
    trick,
    log: [...state.log, `Play started with bid ${bid.name}`]
  };
};

export const legalMoves = (state: EngineState, player: PlayerId): Card[] =>
  rulesLegalMoves(toRulesState(state), player);

export const playCard = (state: EngineState, player: PlayerId, card: Card): EngineState => {
  if (player !== state.currentPlayer) {
    throw new Error(`Not player ${player}'s turn`);
  }

  const hand = state.hands[player] ?? [];
  const cardInHand = hand.find((c) => c.suit === card.suit && c.rank === card.rank);
  if (!cardInHand) {
    throw new Error('Card not in hand');
  }

  const legal = legalMoves(state, player);
  const isLegal = legal.some((c) => c.suit === card.suit && c.rank === card.rank);
  if (!isLegal) {
    throw new Error('Illegal card for this trick');
  }

  const updatedHand = hand.filter((c, idx) => idx !== hand.indexOf(cardInHand));
  const updatedHands = {
    ...state.hands,
    [player]: updatedHand
  } as Record<PlayerId, Card[]>;

  const updatedPlays = [...state.trick.plays, { player, card }];
  const updatedTrick: TrickState = { leader: state.trick.leader, plays: updatedPlays };

  if (updatedPlays.length < 3) {
    return {
      ...state,
      hands: updatedHands,
      trick: updatedTrick,
      currentPlayer: nextPlayer(player)
    };
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

  return {
    ...state,
    hands: updatedHands,
    trick: { leader: winner, plays: [] },
    leader: winner,
    currentPlayer: winner,
    tricksWon: updatedTricksWon,
    phase: remainingCards === 0 ? 'SCORING' : state.phase,
    log: [...state.log, `Trick won by Player ${winner}`]
  };
};
