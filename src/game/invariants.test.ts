import { describe, expect, it } from 'vitest';
import { assertEngineInvariants } from './invariants';
import type { EngineState } from './engine2';
import type { Card } from './types';

const card = (suit: Card['suit'], rank: Card['rank']): Card => ({ suit, rank });

const makeState = (overrides: Partial<EngineState>): EngineState => ({
  phase: 'PLAY',
  dealer: 0,
  leader: 0,
  currentPlayer: 0,
  gameType: 'TRUMP',
  trumpSuit: 'piros',
  hands: { 0: [], 1: [], 2: [] },
  talon: [],
  trick: { leader: 0, plays: [] },
  tricksWon: { 0: [], 1: [], 2: [] },
  deck: [],
  selectedBidId: undefined,
  highestBidId: undefined,
  highestBidder: undefined,
  consecutivePasses: 0,
  hasNonPassBid: false,
  bidNeedsDiscard: false,
  bidAwaitingTalonDecision: false,
  requireRaiseAfterTake: false,
  log: [],
  trickIndex: 0,
  belaAnnouncements: [],
  lastTrick: undefined,
  kontraLevel: 0,
  kontraTurn: undefined,
  lastScore: undefined,
  balances: { 0: 0, 1: 0, 2: 0 },
  ...overrides
});

const handOf = (count: number): Card[] => Array.from({ length: count }, (_, idx) => card('makk', idx === 0 ? 'A' : '10'));

describe('assertEngineInvariants', () => {
  it('throws when entering PLAY with uneven hands', () => {
    const state = makeState({
      hands: { 0: handOf(12), 1: handOf(10), 2: handOf(10) }
    });

    expect(() => assertEngineInvariants(state)).toThrow(/PLAY invariant/);
  });

  it('passes when PLAY starts with 10/10/10 hands', () => {
    const state = makeState({
      hands: { 0: handOf(10), 1: handOf(10), 2: handOf(10) },
      talon: [card('piros', 'A'), card('piros', '10')]
    });

    expect(() => assertEngineInvariants(state)).not.toThrow();
  });
});
