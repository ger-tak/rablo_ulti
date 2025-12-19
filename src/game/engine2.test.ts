import { describe, expect, it } from 'vitest';
import { bid, discardToTalon, newGame, passBid, playCard } from './engine2';
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
  ...overrides
});

describe('engine2 deal', () => {
  it('deals 12/10/10 and leaves talon empty', () => {
    const state = newGame(1);

    const handSizes = [state.hands[0].length, state.hands[1].length, state.hands[2].length];
    expect(handSizes.sort((a, b) => b - a)).toEqual([12, 10, 10]);
    expect(state.talon).toHaveLength(0);
    expect(state.phase).toBe('BID');
    expect(state.currentPlayer).toBe(1); // next after dealer = bidder
  });
});

describe('engine2 playCard', () => {
  it('enforces turn order and legality', () => {
    const state = makeState({
      gameType: 'TRUMP',
      trumpSuit: 'piros',
      hands: {
        0: [card('makk', 'A'), card('piros', '7')],
        1: [card('makk', 'K'), card('piros', 'A')],
        2: [card('piros', 'K'), card('tok', '7')]
      },
      leader: 0,
      currentPlayer: 0,
      trick: { leader: 0, plays: [] }
    });

    expect(() => playCard(state, 1, card('makk', 'K'))).toThrowError(/Not player/);
    const afterLead = playCard(state, 0, card('makk', 'A'));
    expect(() => playCard(afterLead, 1, card('piros', 'A'))).toThrowError(/Illegal card/);
  });

  it('resolves trick, moves cards, and advances leader/currentPlayer', () => {
    const state = makeState({
      gameType: 'TRUMP',
      trumpSuit: 'piros',
      hands: {
        0: [card('makk', 'A')],
        1: [card('makk', 'K')],
        2: [card('piros', 'A')]
      },
      leader: 0,
      currentPlayer: 0,
      trick: { leader: 0, plays: [] }
    });

    const afterFirst = playCard(state, 0, card('makk', 'A'));
    const afterSecond = playCard(afterFirst, 1, card('makk', 'K'));
    const afterThird = playCard(afterSecond, 2, card('piros', 'A'));

    expect(afterThird.tricksWon[2]).toHaveLength(3);
    expect(afterThird.leader).toBe(2);
    expect(afterThird.currentPlayer).toBe(2);
    expect(afterThird.trick.plays).toHaveLength(0);
    expect(afterThird.phase).toBe('SCORING');
  });
});

const twelveCardHand: Card[] = [
  card('makk', 'A'),
  card('makk', '10'),
  card('makk', 'K'),
  card('makk', 'Felső'),
  card('tok', 'A'),
  card('tok', '10'),
  card('tok', 'K'),
  card('tok', 'Felső'),
  card('zold', 'A'),
  card('zold', '10'),
  card('piros', 'A'),
  card('piros', '10')
];

describe('engine2 bidding discard requirement', () => {
  it('blocks bidding and passing until talon discard is done', () => {
    const state = makeState({
      phase: 'BID',
      leader: 1,
      currentPlayer: 1,
      bidNeedsDiscard: true,
      hands: {
        0: twelveCardHand.slice(0, 10),
        1: twelveCardHand,
        2: twelveCardHand.slice(2, 12)
      },
      talon: []
    });

    expect(() => bid(state, 1, 'negyvenszaz_40_100')).toThrow(/discard/);
    expect(() => passBid(state, 1)).toThrow(/discard/);
  });

  it('discards exactly two cards into the talon', () => {
    const state = makeState({
      phase: 'BID',
      leader: 1,
      currentPlayer: 1,
      bidNeedsDiscard: true,
      hands: {
        0: twelveCardHand.slice(0, 10),
        1: twelveCardHand,
        2: twelveCardHand.slice(2, 12)
      },
      talon: []
    });

    const cardsToDiscard = [state.hands[1][0], state.hands[1][1]];
    const afterDiscard = discardToTalon(state, 1, cardsToDiscard);

    expect(afterDiscard.hands[1]).toHaveLength(10);
    expect(afterDiscard.talon).toEqual(cardsToDiscard);
    expect(afterDiscard.bidNeedsDiscard).toBe(false);
  });
});
