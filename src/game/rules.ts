import { Card, GameState, GameType, PlayerId, Suit } from './types';

const trumpRankOrder: Record<GameType, string[]> = {
  TRUMP: ['A', '10', 'K', 'Felső', 'Alsó', '9', '8', '7'],
  NO_TRUMP: ['A', 'K', 'Felső', 'Alsó', '10', '9', '8', '7']
};

const rankValue = (rank: Card['rank'], gameType: GameType): number =>
  trumpRankOrder[gameType].length - (trumpRankOrder[gameType].indexOf(rank) + 1);

const suitPriority = (card: Card, gameType: GameType, trumpSuit: Suit | undefined, ledSuit: Suit): number => {
  if (gameType === 'TRUMP' && card.suit === trumpSuit) return 2;
  if (card.suit === ledSuit) return 1;
  return 0;
};

export const cardOrderValue = (card: Card, gameType: GameType, trumpSuit: Suit | undefined, ledSuit: Suit): number => {
  const priority = suitPriority(card, gameType, trumpSuit, ledSuit);
  const value = rankValue(card.rank, gameType);
  return priority * 100 + value;
};

const compareCards = (a: Card, b: Card, gameType: GameType, trumpSuit: Suit | undefined, ledSuit: Suit): number => {
  const aScore = cardOrderValue(a, gameType, trumpSuit, ledSuit);
  const bScore = cardOrderValue(b, gameType, trumpSuit, ledSuit);
  return Math.sign(aScore - bScore);
};

const currentWinningPlay = (state: GameState): { play: { player: PlayerId; card: Card }; ledSuit: Suit } => {
  const ledSuit = state.trick.plays[0].card.suit;
  let winner = state.trick.plays[0];

  for (const play of state.trick.plays.slice(1)) {
    if (compareCards(play.card, winner.card, state.gameType, state.trumpSuit, ledSuit) > 0) {
      winner = play;
    }
  }

  return { play: winner, ledSuit };
};

export const legalMoves = (state: GameState, player: PlayerId): Card[] => {
  const hand = state.hands[player] ?? [];
  if (hand.length === 0) return [];

  const plays = state.trick.plays;
  if (plays.length === 0 || state.trick.leader === player) {
    return [...hand];
  }

  const ledSuit = plays[0].card.suit;
  const followSuit = hand.filter((card) => card.suit === ledSuit);
  if (followSuit.length) {
    const { play: winner } = currentWinningPlay(state);
    const beating = followSuit.filter(
      (card) => compareCards(card, winner.card, state.gameType, state.trumpSuit, ledSuit) > 0
    );
    return beating.length ? beating : followSuit;
  }

  if (state.gameType === 'TRUMP' && state.trumpSuit) {
    const trumpCards = hand.filter((card) => card.suit === state.trumpSuit);
    if (trumpCards.length) {
      const trumpInTrick = plays.some((p) => p.card.suit === state.trumpSuit);
      if (!trumpInTrick) return trumpCards;

      const winningTrump = currentWinningPlay({
        ...state,
        trick: { ...state.trick, plays: plays.filter((p) => p.card.suit === state.trumpSuit) }
      }).play;

      const beatingTrumps = trumpCards.filter(
        (card) =>
          compareCards(card, winningTrump.card, state.gameType, state.trumpSuit, ledSuit) > 0
      );
      return beatingTrumps.length ? beatingTrumps : trumpCards;
    }
  }

  return [...hand];
};

export const trickWinner = (state: GameState): PlayerId => {
  if (state.trick.plays.length !== 3) {
    throw new Error('Trick is incomplete');
  }
  const { play } = currentWinningPlay(state);
  return play.player;
};
