import { describe, expect, it } from 'vitest';
import { Card, GameState, legalMoves, playCard, PlayerId, Suit, trickWinner } from './engine';

const makeState = (overrides: Partial<GameState>): GameState => ({
  phase: 'PLAY',
  dealer: 0,
  leader: 0,
  currentPlayer: 0,
  hands: { 0: [], 1: [], 2: [] },
  talon: [],
  contract: null,
  trumpSuit: undefined,
  isRedPrefix: false,
  trick: { leader: 0 as PlayerId, plays: [] },
  tricksWon: { 0: [], 1: [], 2: [] },
  log: [],
  deck: [],
  ...overrides
});

const card = (suit: Suit, rank: Card['rank']): Card => ({ suit, rank });

describe('legalMoves', () => {
  it('enforces following lead suit when available', () => {
    const state = makeState({
      trick: {
        leader: 0,
        plays: [
          { player: 0, card: card('piros', 'K') }
        ]
      },
      hands: {
        0: [],
        1: [card('piros', 'A'), card('zold', '9')],
        2: []
      }
    });

    expect(legalMoves(state, 1)).toEqual([card('piros', 'A')]);
  });

  it('forces trump when void in lead suit and trump is declared', () => {
    const state = makeState({
      trick: {
        leader: 2,
        plays: [
          { player: 2, card: card('tok', '9') }
        ]
      },
      trumpSuit: 'zold',
      hands: {
        0: [],
        1: [card('zold', '10'), card('piros', 'A')],
        2: []
      }
    });

    expect(legalMoves(state, 1)).toEqual([card('zold', '10')]);
  });
});

describe('trickWinner', () => {
  it('returns trump winner when trump is played', () => {
    const state = makeState({
      trumpSuit: 'zold',
      trick: {
        leader: 0,
        plays: [
          { player: 0, card: card('piros', 'K') },
          { player: 1, card: card('piros', '10') },
          { player: 2, card: card('zold', 'A') }
        ]
      }
    });

    expect(trickWinner(state)).toBe(2);
  });

  it('returns highest lead-suit card when no trump is played', () => {
    const state = makeState({
      trick: {
        leader: 1,
        plays: [
          { player: 1, card: card('makk', '9') },
          { player: 2, card: card('makk', '10') },
          { player: 0, card: card('tok', 'A') }
        ]
      }
    });

    expect(trickWinner(state)).toBe(2);
  });
});

// Sanity check for playCard to ensure trick resolution wiring works together with trickWinner.
describe('playCard integration', () => {
  it('advances to scoring after final trick', () => {
    const state = makeState({
      hands: {
        0: [card('piros', 'A')],
        1: [card('piros', '10')],
        2: [card('piros', 'K')]
      },
      trick: { leader: 0, plays: [] },
      currentPlayer: 0
    });

    const afterFirst = playCard(state, 0, card('piros', 'A'));
    const afterSecond = playCard(afterFirst, 1, card('piros', '10'));
    const afterThird = playCard(afterSecond, 2, card('piros', 'K'));

    expect(afterThird.phase).toBe('SCORING');
    expect(afterThird.trick.plays).toEqual([]);
    expect(afterThird.tricksWon[0].length + afterThird.tricksWon[1].length + afterThird.tricksWon[2].length).toBe(3);
  });
});
