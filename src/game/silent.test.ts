import { describe, expect, it } from 'vitest';
import { scoreRoundMVP } from './scoring';
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
  hands: { 0: [], 1: [], 2: [] },
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
  kontraTurn: undefined,
  lastScore: undefined,
  balances: { 0: 0, 1: 0, 2: 0 },
  ...overrides
});

describe('silent bonuses', () => {
  it('marks silent 100 achieved and awards eligible points', () => {
    const state = makeState({
      tricksWon: {
        0: Array(10).fill(card('makk', 'A')),
        1: [card('makk', '7'), card('tok', '8'), card('zold', '9')],
        2: []
      },
      lastTrick: null
    });

    const result = scoreRoundMVP(state);
    expect(result.silent.achieved.silent100).toBe(true);
    expect(result.silent.eligible.silent100).toBe(2);
    expect(result.silent.pointsBidder).toBe(2);
  });

  it('marks silent durchmarsch when defenders take no tricks', () => {
    const state = makeState({
      tricksWon: { 0: Array(30).fill(card('makk', '7')), 1: [], 2: [] },
      lastTrick: { winner: 0, plays: [play(0, 'makk', '7'), play(1, 'zold', '8'), play(2, 'tok', '9')] }
    });

    const result = scoreRoundMVP(state);
    expect(result.silent.achieved.silentDurchmarsch).toBe(true);
    expect(result.silent.eligible.silentDurchmarsch).toBe(3);
    expect(result.silent.pointsBidder).toBe(3);
  });

  it('marks silent ulti when bidder wins last trick with trump seven', () => {
    const state = makeState({
      tricksWon: { 0: Array(15).fill(card('tok', '10')), 1: [], 2: [] },
      lastTrick: {
        winner: 0,
        plays: [play(0, 'piros', '7'), play(1, 'zold', '8'), play(2, 'tok', '9')]
      }
    });

    const result = scoreRoundMVP(state);
    expect(result.silent.achieved.silentUlti).toBe(true);
    expect(result.silent.eligible.silentUlti).toBe(3);
    expect(result.silent.pointsBidder).toBeGreaterThanOrEqual(3);
  });

  it('does not award points if eligibility is null even when achieved', () => {
    const state = makeState({
      gameType: 'NO_TRUMP',
      selectedBidId: 'betli',
      highestBidId: 'betli',
      tricksWon: { 0: Array(30).fill(card('makk', '7')), 1: [], 2: [] },
      lastTrick: { winner: 0, plays: [play(0, 'makk', '7'), play(1, 'zold', '8'), play(2, 'tok', '9')] }
    });

    const result = scoreRoundMVP(state);
    expect(result.silent.achieved.silentDurchmarsch).toBe(true);
    expect(result.silent.eligible.silentDurchmarsch).toBeNull();
    expect(result.silent.pointsBidder).toBe(0);
  });
});
