import { shuffle } from './deck';
import { GameState } from './types';

export const newState = (seed?: number): GameState => {
  const deck = shuffle(seed);
  return {
    gameType: 'TRUMP',
    trumpSuit: undefined,
    hands: {
      0: [],
      1: [],
      2: []
    },
    trick: { leader: 0, plays: [] },
    leader: 0,
    currentPlayer: 0,
    deck
  };
};
