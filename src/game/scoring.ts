import { BIDS, getBidById } from './bids';
import type { EngineState } from './engine2';
import type { Card, PlayerId } from './types';

export type ScoreBreakdown = {
  bidder: PlayerId;
  defenders: PlayerId[];
  bidId: string;
  basePoints: number;
  contractSuccess: boolean;
  trickPointsBidder: number;
  trickPointsDefenders: number;
  belaPointsBidder: number;
  belaPointsDefenders: number;
  payouts: Record<PlayerId, number>;
  notes: string[];
  silent: {
    eligible: { silent100: number | null; silentUlti: number | null; silentDurchmarsch: number | null };
    achieved: { silent100: boolean; silentUlti: boolean; silentDurchmarsch: boolean };
    pointsBidder: number;
  };
};

const zsírValue = (card: Card): number => (card.rank === 'A' || card.rank === '10' ? 10 : 0);

const lastTrickBonus = (state: EngineState): Record<PlayerId, number> => {
  if (!state.lastTrick) return { 0: 0, 1: 0, 2: 0 };
  return {
    0: state.lastTrick.winner === 0 ? 10 : 0,
    1: state.lastTrick.winner === 1 ? 10 : 0,
    2: state.lastTrick.winner === 2 ? 10 : 0
  };
};

const belaBonus = (state: EngineState): Record<PlayerId, number> =>
  state.belaAnnouncements.reduce(
    (acc, ann) => ({
      ...acc,
      [ann.player]: (acc[ann.player] ?? 0) + ann.value
    }),
    { 0: 0, 1: 0, 2: 0 } as Record<PlayerId, number>
  );

export const computeTrickPoints = (
  state: EngineState
): { bidderTeam: number; defenders: number; belaBidder: number; belaDefenders: number } => {
  if (state.gameType === 'NO_TRUMP') return { bidderTeam: 0, defenders: 0, belaBidder: 0, belaDefenders: 0 };
  const bidder = state.highestBidder ?? 0;
  const bidderTeam: PlayerId[] = [bidder];
  const defenders: PlayerId[] = ([0, 1, 2] as PlayerId[]).filter((p) => p !== bidder);

  const lastBonus = lastTrickBonus(state);
  const bela = belaBonus(state);

  const playerTotals: Record<PlayerId, number> = { 0: 0, 1: 0, 2: 0 };
  ([0, 1, 2] as PlayerId[]).forEach((player) => {
    const zsírPoints = (state.tricksWon[player] ?? []).reduce((sum, card) => sum + zsírValue(card), 0);
    playerTotals[player] = zsírPoints + lastBonus[player] + bela[player];
  });

  const belaBidder = bidderTeam.reduce((sum, pid) => sum + (bela[pid] ?? 0), 0);
  const belaDefenders = defenders.reduce((sum, pid) => sum + (bela[pid] ?? 0), 0);
  const bidderTotal = bidderTeam.reduce((sum, pid) => sum + (playerTotals[pid] ?? 0), 0);
  const defenderTotal = defenders.reduce((sum, pid) => sum + (playerTotals[pid] ?? 0), 0);

  return { bidderTeam: bidderTotal, defenders: defenderTotal, belaBidder, belaDefenders };
};

export const evaluateContractMVP = (state: EngineState): { success: boolean; notes: string[] } => {
  const { bidderTeam } = computeTrickPoints(state);
  const bidder = state.highestBidder ?? 0;
  const bidderTricks = Math.floor((state.tricksWon[bidder]?.length ?? 0) / 3);
  const notes: string[] = [];

  switch (state.selectedBidId ?? state.highestBidId) {
    case 'passz':
    case 'piros_passz':
      if (state.gameType === 'TRUMP') {
        const success = bidderTeam > 50;
        if (!success) notes.push('passz failed: <= 50 zsír points');
        return { success, notes };
      }
      break;
    case 'betli':
    case 'pirosbetli':
      if (state.gameType === 'NO_TRUMP') {
        const success = bidderTricks === 0;
        if (!success) notes.push('betli failed: bidder took a trick');
        return { success, notes };
      }
      break;
    case 'durchmarsch':
    case 'pirosdurchmarsch':
    case 'teritett_durchmarsch':
      if (state.gameType === 'NO_TRUMP') {
        const success = bidderTricks === 10;
        if (!success) notes.push('durchmarsch failed: bidder did not win all tricks');
        return { success, notes };
      }
      break;
    default:
      break;
  }

  notes.push('TODO not implemented');
  return { success: false, notes };
};

export const getSilentEligibility = (
  bidId: string
): { silent100: number | null; silentUlti: number | null; silentDurchmarsch: number | null } => {
  const bid = getBidById(bidId);
  if (!bid) {
    return { silent100: null, silentUlti: null, silentDurchmarsch: null };
  }
  return {
    silent100: bid.silent100Points ?? null,
    silentUlti: bid.silentUltiPoints ?? null,
    silentDurchmarsch: bid.silentDurchmarschPoints ?? null
  };
};

export const scoreRoundMVP = (state: EngineState): ScoreBreakdown => {
  const bidId = state.selectedBidId ?? state.highestBidId ?? 'passz';
  const bid = getBidById(bidId) ?? BIDS[0];
  const bidder = state.highestBidder ?? 0;
  const defenders: PlayerId[] = ([0, 1, 2] as PlayerId[]).filter((p) => p !== bidder);

  const trickPoints = computeTrickPoints(state);
  const contractResult = evaluateContractMVP(state);
  const silentEligibility = getSilentEligibility(bidId);
  const silentAchieved100 = state.gameType === 'TRUMP' && trickPoints.bidderTeam >= 100; // TODO: handle 80/90 + húsz edge cases
  const defenderTricks = defenders.reduce((sum, pid) => sum + Math.floor((state.tricksWon[pid]?.length ?? 0) / 3), 0);
  const silentAchievedDurchmarsch = defenderTricks === 0;
  const silentAchievedUlti =
    state.gameType === 'TRUMP' &&
    state.lastTrick !== null &&
    state.lastTrick.winner === bidder &&
    state.lastTrick.plays.some((p) => p.player === bidder && p.card.rank === '7' && p.card.suit === state.trumpSuit);

  const silentPoints =
    (silentEligibility.silent100 ?? 0) * (silentAchieved100 ? 1 : 0) +
    (silentEligibility.silentDurchmarsch ?? 0) * (silentAchievedDurchmarsch ? 1 : 0) +
    (silentEligibility.silentUlti ?? 0) * (silentAchievedUlti ? 1 : 0);

  const kontraMultiplier = 2 ** (state.kontraLevel ?? 0);
  const totalContractPoints = bid.basePoints + silentPoints;
  const pointValue = totalContractPoints * kontraMultiplier;
  const defenderDelta = contractResult.success ? -pointValue : pointValue;

  const payouts: Record<PlayerId, number> = {
    [bidder]: -defenderDelta * defenders.length,
    [defenders[0]]: defenderDelta,
    [defenders[1]]: defenderDelta
  };

  const notes = [...contractResult.notes];
  if (silentEligibility.silent100 !== null && silentAchieved100) {
    notes.push(`Achieved Silent 100 (+${silentEligibility.silent100})`);
  }
  if (silentEligibility.silentDurchmarsch !== null && silentAchievedDurchmarsch) {
    notes.push(`Achieved Silent Durchmarsch (+${silentEligibility.silentDurchmarsch})`);
  }
  if (silentEligibility.silentUlti !== null && silentAchievedUlti) {
    notes.push(`Achieved Silent Ulti (+${silentEligibility.silentUlti})`);
  }

  return {
    bidder,
    defenders,
    bidId,
    basePoints: bid.basePoints,
    contractSuccess: contractResult.success,
    trickPointsBidder: trickPoints.bidderTeam,
    trickPointsDefenders: trickPoints.defenders,
    belaPointsBidder: trickPoints.belaBidder,
    belaPointsDefenders: trickPoints.belaDefenders,
    payouts,
    notes,
    silent: {
      eligible: silentEligibility,
      achieved: {
        silent100: silentAchieved100,
        silentUlti: silentAchievedUlti,
        silentDurchmarsch: silentAchievedDurchmarsch
      },
      pointsBidder: silentPoints
    }
  };
};
