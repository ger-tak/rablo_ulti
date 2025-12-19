import { describe, expect, it } from 'vitest';
import { cardOrderValue, legalMoves, trickWinner } from './rules';
import { Card, GameState } from './types';

const card = (suit: Card['suit'], rank: Card['rank']): Card => ({ suit, rank });

const makeState = (overrides: Partial<GameState>): GameState => ({
  gameType: 'TRUMP',
  trumpSuit: 'zold',
  hands: { 0: [], 1: [], 2: [] },
  trick: { leader: 0, plays: [] },
  leader: 0,
  currentPlayer: 0,
  deck: [],
  ...overrides
});

describe('legalMoves', () => {
  it('enforces following suit when possible', () => {
    const state = makeState({
      trick: { leader: 0, plays: [{ player: 0, card: card('makk', 'K') }] },
      hands: { 0: [], 1: [card('makk', '9'), card('piros', 'A')], 2: [] }
    });

    expect(legalMoves(state, 1)).toEqual([card('makk', '9')]);
  });

  it('must trump if cannot follow suit in a trump game', () => {
    const state = makeState({
      trick: { leader: 0, plays: [{ player: 0, card: card('piros', '10') }] },
      hands: { 0: [], 1: [card('zold', '9'), card('tok', 'A')], 2: [] }
    });

    expect(legalMoves(state, 1)).toEqual([card('zold', '9')]);
  });

  it('must overtake when possible while following suit', () => {
    const state = makeState({
      gameType: 'NO_TRUMP',
      trumpSuit: undefined,
      trick: { leader: 0, plays: [{ player: 0, card: card('tok', '10') }] },
      hands: { 0: [], 1: [card('tok', 'K'), card('tok', '8')], 2: [] }
    });

    expect(legalMoves(state, 1)).toEqual([card('tok', 'K')]);
  });
});

describe('trickWinner', () => {
  it('prefers highest trump in trump game', () => {
    const state = makeState({
      trick: {
        leader: 0,
        plays: [
          { player: 0, card: card('piros', 'A') },
          { player: 1, card: card('zold', '9') },
          { player: 2, card: card('makk', 'A') }
        ]
      }
    });

    expect(trickWinner(state)).toBe(1);
  });

  it('selects highest in led suit when no trumps are played', () => {
    const state = makeState({
      gameType: 'NO_TRUMP',
      trumpSuit: undefined,
      trick: {
        leader: 0,
        plays: [
          { player: 0, card: card('tok', 'A') },
          { player: 1, card: card('tok', 'K') },
          { player: 2, card: card('piros', 'A') }
        ]
      }
    });

    expect(trickWinner(state)).toBe(0);
  });
});

describe('cardOrderValue', () => {
  it('ranks trump over non-trump in trump game', () => {
    const ledSuit: Card['suit'] = 'makk';
    const trump: Card['suit'] = 'piros';
    const nonTrumpCard = card('makk', 'K');
    const trumpCard = card('piros', '7');

    expect(cardOrderValue(trumpCard, 'TRUMP', trump, ledSuit)).toBeGreaterThan(
      cardOrderValue(nonTrumpCard, 'TRUMP', trump, ledSuit)
    );
  });
});
