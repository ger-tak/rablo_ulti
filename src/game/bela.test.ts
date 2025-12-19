import { describe, expect, it } from 'vitest';
import { announceBela } from './engine2';
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
  hands: {
    0: [
      card('piros', 'K'),
      card('piros', 'Felső'),
      card('makk', 'K'),
      card('makk', 'Felső'),
      ...Array(6).fill(card('zold', '7'))
    ],
    1: Array(10).fill(card('tok', '8')),
    2: Array(10).fill(card('zold', '9'))
  },
  talon: [],
  trick: { leader: 0, plays: [] },
  tricksWon: { 0: [], 1: [], 2: [] },
  deck: [],
  selectedBidId: 'passz',
  highestBidId: 'passz',
  highestBidder: 0,
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

describe('announceBela', () => {
  it('rejects when not allowed', () => {
    const notrump = makeState({ gameType: 'NO_TRUMP' });
    expect(() => announceBela(notrump, 0, 'piros')).toThrow();

    const laterTrick = makeState({ trickIndex: 1 });
    expect(() => announceBela(laterTrick, 0, 'piros')).toThrow();

    const notCurrent = makeState({ currentPlayer: 1 });
    expect(() => announceBela(notCurrent, 0, 'piros')).toThrow();
  });

  it('records trump and non-trump values', () => {
    const state = makeState({});
    const withTrump = announceBela(state, 0, 'piros');
    expect(withTrump.belaAnnouncements[0]?.value).toBe(40);

    const withOffSuit = announceBela(withTrump, 0, 'makk');
    expect(withOffSuit.belaAnnouncements.find((b) => b.suit === 'makk')?.value).toBe(20);
  });
});
