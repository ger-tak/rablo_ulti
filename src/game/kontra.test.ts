import { describe, expect, it } from 'vitest';
import { callKontra, playCard } from './engine2';
import { scoreRoundMVP } from './scoring';
import { getBidById } from './bids';
import type { EngineState } from './engine2';
import type { Card, TrickPlay } from './types';

const card = (suit: Card['suit'], rank: Card['rank']): Card => ({ suit, rank });
const play = (player: number, suit: Card['suit'], rank: Card['rank']): TrickPlay => ({
  player: player as 0 | 1 | 2,
  card: card(suit, rank)
});

const makeState = (overrides: Partial<EngineState>): EngineState => ({
  phase: 'PLAY',
  dealer: 0,
  leader: 0,
  currentPlayer: 0,
  gameType: 'TRUMP',
  trumpSuit: 'piros',
  hands: {
    0: Array(10).fill(card('makk', 'A')),
    1: Array(10).fill(card('tok', 'K')),
    2: Array(10).fill(card('zold', 'Felső'))
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
  lastTrick: null,
  kontraLevel: 0,
  kontraTurn: 'DEFENDERS',
  kontraLocked: false,
  lastScore: undefined,
  balances: { 0: 0, 1: 0, 2: 0 },
  ...overrides
});

describe('kontra flow', () => {
  it('allows defenders to call kontra first', () => {
    const state = makeState({});
    const afterKontra = callKontra(state, 1);
    expect(afterKontra.kontraLevel).toBe(1);
    expect(afterKontra.kontraTurn).toBe('BIDDER');
  });

  it('lets bidder rekontra second', () => {
    const state = makeState({});
    const afterKontra = callKontra(state, 1);
    const afterRekontra = callKontra(afterKontra, 0);
    expect(afterRekontra.kontraLevel).toBe(2);
    expect(afterRekontra.kontraTurn).toBe('DEFENDERS');
  });

  it('lets defenders szubkontra third', () => {
    const state = makeState({});
    const afterKontra = callKontra(state, 1);
    const afterRekontra = callKontra(afterKontra, 0);
    const afterSzub = callKontra(afterRekontra, 2);
    expect(afterSzub.kontraLevel).toBe(3);
    expect(afterSzub.kontraTurn).toBe('BIDDER');
  });

  it('throws once the first card of the first trick is played', () => {
    const state = makeState({});

    const afterPlay = playCard(state, 0, card('makk', 'A'));
    expect(afterPlay.kontraLocked).toBe(true);
    expect(() => callKontra(afterPlay, 1)).toThrow();
  });

  it('applies multiplier as 2^kontraLevel in scoring', () => {
    const bid = getBidById('passz');
    const base = makeState({
      tricksWon: {
        0: Array(15).fill(card('makk', 'A')),
        1: [],
        2: []
      },
      lastTrick: { winner: 0, plays: [play(0, 'makk', 'A'), play(1, 'tok', 'K'), play(2, 'zold', 'Felső')] },
      kontraLevel: 2
    });

    const score = scoreRoundMVP(base);
    expect(score.kontraLevel).toBe(2);
    expect(score.kontraMultiplier).toBe(4);
    expect(score.basePoints).toBe((bid?.basePoints ?? 0) * 4);
  });
});
