export type Suit = 'makk' | 'tok' | 'zold' | 'piros';
export type Rank = 'A' | '10' | 'K' | 'Felső' | 'Alsó' | '9' | '8' | '7';
export type PlayerId = 0 | 1 | 2;

export type GamePhase =
  | 'DEAL'
  | 'BID'
  | 'DECLARE_TRUMP'
  | 'PLAY'
  | 'SCORING'
  | 'PAYMENT';

export interface Card {
  suit: Suit;
  rank: Rank;
}

export interface TrickPlay {
  player: PlayerId;
  card: Card;
}

export interface TrickState {
  leader: PlayerId;
  plays: TrickPlay[];
}

export interface GameState {
  phase: GamePhase;
  dealer: PlayerId;
  leader: PlayerId;
  currentPlayer: PlayerId;
  hands: Record<PlayerId, Card[]>;
  talon: Card[];
  contract: string | null;
  trumpSuit?: Suit;
  isRedPrefix: boolean;
  trick: TrickState;
  tricksWon: Record<PlayerId, Card[]>;
  log: string[];
  deck: Card[];
}

const trumpRankOrder: Rank[] = ['A', '10', 'K', 'Felső', 'Alsó', '9', '8', '7'];
const noTrumpRankOrder: Rank[] = ['A', 'K', 'Felső', 'Alsó', '10', '9', '8', '7'];
const trumpRankValue = Object.fromEntries(trumpRankOrder.map((rank, index) => [rank, trumpRankOrder.length - index]));
const noTrumpRankValue = Object.fromEntries(noTrumpRankOrder.map((rank, index) => [rank, noTrumpRankOrder.length - index]));

const suits: Suit[] = ['makk', 'tok', 'zold', 'piros'];

const nextPlayer = (player: PlayerId): PlayerId => ((player + 1) % 3) as PlayerId;

const createDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const suit of suits) {
    for (const rank of trumpRankOrder) {
      deck.push({ suit, rank });
    }
  }
  return deck;
};

const mulberry32 = (seed: number) => {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffle = (cards: Card[], random: () => number): Card[] => {
  const deck = [...cards];
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

const isTrumpGame = (trumpSuit?: Suit): trumpSuit is Suit => Boolean(trumpSuit);

const getRankValue = (rank: Rank, trumpSuit?: Suit): number =>
  isTrumpGame(trumpSuit) ? (trumpRankValue[rank] as number) : (noTrumpRankValue[rank] as number);

const compareCardsForWinning = (a: Card, b: Card, leadSuit: Suit, trumpSuit?: Suit): number => {
  const trumpMode = isTrumpGame(trumpSuit);
  const aIsTrump = trumpMode && a.suit === trumpSuit;
  const bIsTrump = trumpMode && b.suit === trumpSuit;

  if (aIsTrump && !bIsTrump) return 1;
  if (!aIsTrump && bIsTrump) return -1;

  // No trumps, compare within lead suit importance.
  const aIsLead = a.suit === leadSuit;
  const bIsLead = b.suit === leadSuit;

  if (aIsLead && !bIsLead) return 1;
  if (!aIsLead && bIsLead) return -1;

  // Same priority bucket (both trump, both lead, or neither): compare rank according to game type.
  const aValue = getRankValue(a.rank, trumpSuit);
  const bValue = getRankValue(b.rank, trumpSuit);
  return Math.sign(aValue - bValue);
};

const findCurrentWinningPlay = (plays: TrickPlay[], leadSuit: Suit, trumpSuit?: Suit): TrickPlay => {
  let winner = plays[0];
  for (const play of plays.slice(1)) {
    if (compareCardsForWinning(play.card, winner.card, leadSuit, trumpSuit) > 0) {
      winner = play;
    }
  }
  return winner;
};

const cloneState = (state: GameState): GameState => ({
  ...state,
  hands: {
    0: [...state.hands[0]],
    1: [...state.hands[1]],
    2: [...state.hands[2]]
  },
  talon: [...state.talon],
  trick: { leader: state.trick.leader, plays: state.trick.plays.map((p) => ({ player: p.player, card: { ...p.card } })) },
  tricksWon: {
    0: [...state.tricksWon[0]],
    1: [...state.tricksWon[1]],
    2: [...state.tricksWon[2]]
  },
  log: [...state.log],
  deck: [...state.deck]
});

export const newGame = (seed?: number): GameState => {
  const baseDeck = createDeck();
  const random = seed === undefined ? Math.random : mulberry32(seed);
  const deck = shuffle(baseDeck, random);
  const dealer: PlayerId = 0;
  const leader = nextPlayer(dealer);

  return {
    phase: 'DEAL',
    dealer,
    leader,
    currentPlayer: leader,
    hands: {
      0: [],
      1: [],
      2: []
    },
    talon: [],
    contract: null,
    trumpSuit: undefined,
    isRedPrefix: false,
    trick: { leader, plays: [] },
    tricksWon: {
      0: [],
      1: [],
      2: []
    },
    log: ['New game created'],
    deck
  };
};

export const deal = (state: GameState, cut: boolean): GameState => {
  if (state.deck.length < 32) {
    throw new Error('Deck is missing cards');
  }

  const nextState = cloneState(state);
  const deck = [...nextState.deck];

  if (cut) {
    const top = deck.shift();
    if (top) deck.push(top);
    nextState.log.push('Deck was cut');
  }

  const order: PlayerId[] = [nextPlayer(nextState.dealer), nextPlayer(nextPlayer(nextState.dealer)), nextState.dealer];
  const hands: Record<PlayerId, Card[]> = { 0: [], 1: [], 2: [] } as const as Record<PlayerId, Card[]>;

  for (let i = 0; i < 30; i += 1) {
    const card = deck[i];
    const player = order[i % 3];
    hands[player] = [...hands[player], card];
  }

  nextState.hands = hands;
  nextState.talon = deck.slice(30, 32);
  nextState.deck = deck.slice(32);
  nextState.phase = 'BID';
  nextState.leader = order[0];
  nextState.currentPlayer = order[0];
  nextState.trick = { leader: order[0], plays: [] };
  nextState.log.push('Cards dealt');

  return nextState;
};

export const legalMoves = (state: GameState, player: PlayerId): Card[] => {
  const hand = state.hands[player] ?? [];
  if (hand.length === 0) return [];

  const plays = state.trick.plays;
  if (plays.length === 0 || state.trick.leader === player) {
    return [...hand];
  }

  const leadSuit = plays[0].card.suit;
  const trumpSuit = state.trumpSuit;
  const trumpMode = isTrumpGame(trumpSuit);
  const currentWinningPlay = findCurrentWinningPlay(plays, leadSuit, trumpSuit);

  const leadSuitCards = hand.filter((card) => card.suit === leadSuit);
  if (leadSuitCards.length) {
    const trumpInTrick = trumpMode && plays.some((p) => p.card.suit === trumpSuit);
    if (trumpInTrick) return leadSuitCards;

    const beatingCards = leadSuitCards.filter(
      (card) => compareCardsForWinning(card, currentWinningPlay.card, leadSuit, trumpSuit) > 0
    );
    return beatingCards.length > 0 ? beatingCards : leadSuitCards;
  }

  if (trumpMode) {
    const trumpCards = hand.filter((card) => card.suit === trumpSuit);
    if (trumpCards.length) {
      const trumpInTrick = plays.some((p) => p.card.suit === trumpSuit);
      if (!trumpInTrick) {
        return trumpCards;
      }

      const currentWinningTrump = findCurrentWinningPlay(
        plays.filter((p) => p.card.suit === trumpSuit),
        leadSuit,
        trumpSuit
      );
      const beatingTrumps = trumpCards.filter(
        (card) => compareCardsForWinning(card, currentWinningTrump.card, leadSuit, trumpSuit) > 0
      );
      return beatingTrumps.length > 0 ? beatingTrumps : trumpCards;
    }
  }

  return [...hand];
};

export const trickWinner = (state: GameState): PlayerId => {
  const { plays } = state.trick;
  if (plays.length === 0) {
    throw new Error('No cards played in the trick');
  }

  const leadSuit = plays[0].card.suit;
  const winner = findCurrentWinningPlay(plays, leadSuit, state.trumpSuit);
  return winner.player;
};

export const playCard = (state: GameState, player: PlayerId, card: Card): GameState => {
  if (player !== state.currentPlayer) {
    throw new Error('Not this player\'s turn');
  }

  const legal = legalMoves(state, player).some((c) => c.suit === card.suit && c.rank === card.rank);
  if (!legal) {
    throw new Error('Illegal card for this trick');
  }

  const nextState = cloneState(state);
  const hand = nextState.hands[player];
  const cardIndex = hand.findIndex((c) => c.suit === card.suit && c.rank === card.rank);
  if (cardIndex === -1) {
    throw new Error('Card not in hand');
  }

  nextState.hands = {
    ...nextState.hands,
    [player]: [...hand.slice(0, cardIndex), ...hand.slice(cardIndex + 1)]
  } as Record<PlayerId, Card[]>;

  const updatedPlays = [...nextState.trick.plays, { player, card }];
  nextState.trick = { ...nextState.trick, plays: updatedPlays };

  if (updatedPlays.length === 3) {
    const winner = trickWinner({ ...nextState, trick: { ...nextState.trick, plays: updatedPlays } });
    const trickCards = updatedPlays.map((p) => p.card);

    nextState.tricksWon = {
      0: winner === 0 ? [...nextState.tricksWon[0], ...trickCards] : [...nextState.tricksWon[0]],
      1: winner === 1 ? [...nextState.tricksWon[1], ...trickCards] : [...nextState.tricksWon[1]],
      2: winner === 2 ? [...nextState.tricksWon[2], ...trickCards] : [...nextState.tricksWon[2]]
    };

    nextState.trick = { leader: winner, plays: [] };
    nextState.leader = winner;
    nextState.currentPlayer = winner;
    nextState.log.push(`Trick won by Player ${winner}`);

    const remainingCards = nextState.hands[0].length + nextState.hands[1].length + nextState.hands[2].length;
    if (remainingCards === 0) {
      nextState.phase = 'SCORING';
      nextState.log.push('Hand finished');
    }
  } else {
    nextState.currentPlayer = nextPlayer(player);
  }

  return nextState;
};
