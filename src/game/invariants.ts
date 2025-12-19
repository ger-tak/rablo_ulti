import type { EngineState } from './engine2';

const formatHandSizes = (sizes: number[]): string => sizes.join('/');

export const assertEngineInvariants = (state: EngineState): void => {
  const handSizes = [state.hands[0].length, state.hands[1].length, state.hands[2].length];

  if (state.phase === 'PLAY') {
    const maxSize = Math.max(...handSizes);
    const minSize = Math.min(...handSizes);
    const handSpread = maxSize - minSize;
    if (handSpread > 1) {
      throw new Error(
        `PLAY invariant violated: hand sizes cannot differ by more than 1 (got ${formatHandSizes(handSizes)})`
      );
    }

    const [firstSize, ...rest] = handSizes;
    const equalHandSizes = rest.every((size) => size === firstSize);
    if (state.trick.plays.length === 0 && !equalHandSizes) {
      throw new Error(
        `PLAY invariant violated: hands must be equal between tricks (got ${formatHandSizes(handSizes)})`
      );
    }

    const tricksTaken =
      state.tricksWon[0].length + state.tricksWon[1].length + state.tricksWon[2].length;
    const isStartOfPlay = tricksTaken === 0 && state.trick.plays.length === 0;
    if (isStartOfPlay && firstSize !== 10) {
      throw new Error(
        `PLAY invariant violated: hands must start with 10 cards (got ${firstSize})`
      );
    }
  }

  if (state.phase === 'BID') {
    const twelveCardHands = handSizes.filter((size) => size === 12).length;
    if (state.bidNeedsDiscard) {
      if (twelveCardHands !== 1) {
        throw new Error(
          `BID invariant violated: expected exactly one 12-card hand (got ${formatHandSizes(handSizes)})`
        );
      }
    } else if (twelveCardHands !== 0) {
      throw new Error(
        `BID invariant violated: expected discarder to have shed to 10 cards (got ${formatHandSizes(handSizes)})`
      );
    }
  }

  if (state.talon.length !== 0 && state.talon.length !== 2) {
    throw new Error(`Talon must have 0 or 2 cards (got ${state.talon.length})`);
  }

  if (![0, 1, 2].includes(state.currentPlayer)) {
    throw new Error(`currentPlayer must be 0, 1, or 2 (got ${state.currentPlayer})`);
  }
};
