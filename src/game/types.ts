export type Suit = 'makk' | 'tok' | 'zold' | 'piros';
export type Rank = 'A' | '10' | 'K' | 'Felső' | 'Alsó' | '9' | '8' | '7';
export type PlayerId = 0 | 1 | 2;

export type GameType = 'TRUMP' | 'NO_TRUMP';

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
  gameType: GameType;
  trumpSuit?: Suit;
  hands: Record<PlayerId, Card[]>;
  trick: TrickState;
  leader: PlayerId;
  currentPlayer: PlayerId;
  deck: Card[];
}
