import { Card, Rank, Suit } from './types';

const suits: Suit[] = ['makk', 'tok', 'zold', 'piros'];
const ranks: Rank[] = ['A', '10', 'K', 'Felső', 'Alsó', '9', '8', '7'];

export const createDeck32 = (): Card[] => {
  const deck: Card[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
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

export const shuffle = (seed?: number): Card[] => {
  const deck = createDeck32();
  const random = seed === undefined ? Math.random : mulberry32(seed);
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};
