import { describe, expect, it } from 'vitest';
import { computeTrickPoints, evaluateContractMVP, scoreRoundMVP } from './scoring';
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

describe('computeTrickPoints', () => {
  it('counts zsír, last trick, and Béla', () => {
    const state = makeState({
      tricksWon: {
        0: [card('makk', 'A'), card('tok', '10')],
        1: [],
        2: []
      },
      lastTrick: { winner: 0, plays: [play(0, 'makk', 'A'), play(1, 'tok', '10'), play(2, 'zold', 'K')] },
      belaAnnouncements: [{ player: 0, suit: 'piros', value: 40 }]
    });

    const points = computeTrickPoints(state);
    expect(points.bidderTeam).toBe(30 + 40); // 2 zsír + last trick + Béla
    expect(points.defenders).toBe(0);
    expect(points.belaBidder).toBe(40);
    expect(points.belaDefenders).toBe(0);
  });

  it('tracks Béla points separately for defenders', () => {
    const state = makeState({
      highestBidder: 0,
      belaAnnouncements: [
        { player: 1, suit: 'tok', value: 20 },
        { player: 0, suit: 'piros', value: 40 }
      ]
    });

    const points = computeTrickPoints(state);
    expect(points.belaBidder).toBe(40);
    expect(points.belaDefenders).toBe(20);
  });
});

describe('evaluateContractMVP', () => {
  it('evaluates passz success at >50 trick points', () => {
    const successState = makeState({
      tricksWon: {
        0: Array(6).fill(card('makk', 'A')),
        1: [],
        2: []
      }
    });
    const failState = makeState({
      tricksWon: {
        0: Array(5).fill(card('makk', 'A')),
        1: [],
        2: []
      }
    });

    expect(evaluateContractMVP(successState).success).toBe(true);
    expect(evaluateContractMVP(failState).success).toBe(false);
  });

  it('betli and durchmarsch in NO_TRUMP', () => {
    const betli = makeState({
      gameType: 'NO_TRUMP',
      selectedBidId: 'betli',
      highestBidId: 'betli',
      highestBidder: 0,
      tricksWon: { 0: [], 1: [], 2: [] }
    });

    const durch = makeState({
      gameType: 'NO_TRUMP',
      selectedBidId: 'durchmarsch',
      highestBidId: 'durchmarsch',
      highestBidder: 0,
      tricksWon: { 0: Array(30).fill(card('makk', '7')), 1: [], 2: [] }
    });

    expect(evaluateContractMVP(betli).success).toBe(true);
    expect(evaluateContractMVP(durch).success).toBe(true);
  });
});

describe('scoreRoundMVP silent bonuses', () => {
  it('awards silent bonuses', () => {
    const state = makeState({
      tricksWon: {
        0: Array(10).fill(card('makk', 'A')),
        1: [],
        2: []
      },
      lastTrick: {
        winner: 0,
        plays: [play(0, 'piros', '7'), play(1, 'zold', '8'), play(2, 'tok', '9')]
      },
      highestBidId: 'passz',
      selectedBidId: 'passz',
      highestBidder: 0,
      belaAnnouncements: [],
      gameType: 'TRUMP',
      trumpSuit: 'piros'
    });

    const result = scoreRoundMVP(state);
    expect(result.silent.achieved.silent100).toBe(true);
    expect(result.silent.achieved.silentUlti).toBe(true);
    expect(result.silent.pointsBidder).toBeGreaterThan(0);
    expect(result.contractSuccess).toBe(true);
  });

  it('surface Béla points in breakdown', () => {
    const state = makeState({
      highestBidder: 0,
      belaAnnouncements: [
        { player: 0, suit: 'piros', value: 40 },
        { player: 1, suit: 'makk', value: 20 }
      ],
      selectedBidId: 'passz',
      highestBidId: 'passz',
      tricksWon: { 0: [], 1: [], 2: [] }
    });

    const result = scoreRoundMVP(state);
    expect(result.belaPointsBidder).toBe(40);
    expect(result.belaPointsDefenders).toBe(20);
    expect(result.trickPointsBidder).toBe(40);
    expect(result.trickPointsDefenders).toBe(20);
  });
});
