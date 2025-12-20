import { describe, expect, it } from 'vitest';
import { nextRound, playCard } from './engine2';
import type { EngineState } from './engine2';
import type { Card } from './types';

const card = (suit: Card['suit'], rank: Card['rank']): Card => ({ suit, rank });

const makeState = (overrides: Partial<EngineState>): EngineState => ({
  phase: 'PLAY',
  dealer: 0,
  leader: 0,
  currentPlayer: 0,
  gameType: 'NO_TRUMP',
  trumpSuit: undefined,
  hands: { 0: [], 1: [], 2: [] },
  talon: [],
  trick: { leader: 0, plays: [] },
  tricksWon: { 0: [], 1: [], 2: [] },
  deck: [],
  selectedBidId: 'betli',
  highestBidId: 'betli',
  highestBidder: 0,
  consecutivePasses: 0,
  hasNonPassBid: true,
  bidNeedsDiscard: false,
  bidAwaitingTalonDecision: false,
  requireRaiseAfterTake: false,
  log: [],
  trickIndex: 0,
  belaAnnouncements: [],
  lastTrick: null,
  kontraLevel: 0,
  kontraTurn: 'DEFENDERS',
  kontraLocked: false,
  lastScore: undefined,
  balances: { 0: 0, 1: 0, 2: 0 },
  ...overrides
});

describe('match loop balances', () => {
  it('updates balances when a round ends', () => {
    const state = makeState({
      trickIndex: 9,
      tricksWon: { 0: [], 1: Array(15).fill(card('tok', '8')), 2: Array(12).fill(card('zold', '9')) },
      trick: { leader: 0, plays: [] },
      hands: {
        0: [card('makk', '7')],
        1: [card('makk', 'A')],
        2: [card('makk', 'K')]
      }
    });

    const afterFirst = playCard(state, 0, card('makk', '7'));
    const afterSecond = playCard(afterFirst, 1, card('makk', 'A'));
    const afterThird = playCard(afterSecond, 2, card('makk', 'K'));

    expect(afterThird.phase).toBe('ROUND_END');
    expect(afterThird.lastScore?.payouts[0]).toBeDefined();
    expect(afterThird.balances[0] + afterThird.balances[1] + afterThird.balances[2]).toBe(0);
  });

  it('rotates dealer and preserves balances for next round', () => {
    const state = makeState({
      phase: 'ROUND_END',
      dealer: 0,
      balances: { 0: 12, 1: -6, 2: -6 },
      log: []
    });

    const next = nextRound(state);
    expect(next.phase).toBe('BID');
    expect(next.dealer).toBe(1);
    expect(next.balances).toEqual(state.balances);
    expect(next.trickIndex).toBe(0);
    expect(next.kontraLevel).toBe(0);
    expect(next.kontraTurn).toBeNull();
  });
});
