import { describe, expect, it } from 'vitest';
import { bid, declareTrump, newGame, passBid } from './engine2';

describe('bidding', () => {
  it('requires higher bid than current', () => {
    const state = newGame(1);
    const afterFirst = bid(state, state.currentPlayer, 'negyvenszaz_40_100'); // P1
    expect(afterFirst.highestBidId).toBe('negyvenszaz_40_100');

    expect(() => bid(afterFirst, afterFirst.currentPlayer, 'negyvenszaz_40_100')).toThrow();
  });

  it('advances to declare trump after bid and two passes', () => {
    const state = newGame(2);
    const afterBid = bid(state, state.currentPlayer, 'negyvenszaz_40_100'); // bidder
    const afterPass1 = passBid(afterBid, afterBid.currentPlayer);
    const afterPass2 = passBid(afterPass1, afterPass1.currentPlayer);

    expect(afterPass2.phase).toBe('DECLARE_TRUMP');
    expect(afterPass2.selectedBidId).toBe('negyvenszaz_40_100');
    expect(afterPass2.currentPlayer).toBe(afterPass2.leader);
  });

  it('advances straight to play for fixed-trump/no-trump bids', () => {
    const state = newGame(3);
    const afterBid = bid(state, state.currentPlayer, 'pirosbetli'); // no trump
    const afterPass1 = passBid(afterBid, afterBid.currentPlayer);
    const afterPass2 = passBid(afterPass1, afterPass1.currentPlayer);

    expect(afterPass2.phase).toBe('PLAY');
    expect(afterPass2.gameType).toBe('NO_TRUMP');
    expect(afterPass2.trumpSuit).toBeUndefined();
  });

  it('declareTrump sets suit and enters play', () => {
    const state = newGame(4);
    const afterBid = bid(state, state.currentPlayer, 'negyvenszaz_40_100');
    const afterPass1 = passBid(afterBid, afterBid.currentPlayer);
    const afterPass2 = passBid(afterPass1, afterPass1.currentPlayer);
    const afterDeclare = declareTrump(afterPass2, afterPass2.currentPlayer, 'piros');

    expect(afterDeclare.phase).toBe('PLAY');
    expect(afterDeclare.trumpSuit).toBe('piros');
    expect(afterDeclare.gameType).toBe('TRUMP');
  });
});
