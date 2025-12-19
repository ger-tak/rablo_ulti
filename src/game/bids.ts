import type { GameType } from './types';

export type TrumpChoice =
  | { kind: 'bidder' }
  | { kind: 'piros' }
  | { kind: 'none' };

export type SilentBonuses = {
  csendes100: number | null;
  csendesUlti: number | null;
  csendesDurchmarsch: number | null;
  hasBangBangBangBang?: boolean;
};

export type BidDefinition = {
  id: string;
  name: string;
  basePoints: number;
  rank: number;
  gameType: GameType;
  trump: TrumpChoice;
  tags: Array<'PIROS_PREFIX' | 'TERITETT' | 'ULTI' | 'DURCHMARSCH' | 'BETLI' | '40_100' | '20_100'>;
  silent: SilentBonuses;
};

export const BIDS: BidDefinition[] = [
  {
    id: 'passz',
    name: 'Passz',
    basePoints: 1,
    rank: 0,
    gameType: 'TRUMP',
    trump: { kind: 'bidder' },
    tags: [],
    silent: { csendes100: 2, csendesUlti: 2, csendesDurchmarsch: 3, hasBangBangBangBang: true }
  },
  {
    id: 'piros_passz',
    name: 'Piros Passz',
    basePoints: 2,
    rank: 1,
    gameType: 'TRUMP',
    trump: { kind: 'piros' },
    tags: ['PIROS_PREFIX'],
    silent: { csendes100: 4, csendesUlti: 4, csendesDurchmarsch: 6, hasBangBangBangBang: true }
  },
  {
    id: 'negyvenszaz_40_100',
    name: '40-100',
    basePoints: 4,
    rank: 2,
    gameType: 'TRUMP',
    trump: { kind: 'bidder' },
    tags: ['40_100'],
    silent: { csendes100: null, csendesUlti: 2, csendesDurchmarsch: 3 }
  },
  {
    id: 'ulti',
    name: 'Ulti',
    basePoints: 5,
    rank: 3,
    gameType: 'TRUMP',
    trump: { kind: 'bidder' },
    tags: ['ULTI'],
    silent: { csendes100: 2, csendesUlti: null, csendesDurchmarsch: 3, hasBangBangBangBang: true }
  },
  {
    id: 'betli',
    name: 'Betli',
    basePoints: 5,
    rank: 4,
    gameType: 'NO_TRUMP',
    trump: { kind: 'none' },
    tags: ['BETLI'],
    silent: { csendes100: null, csendesUlti: null, csendesDurchmarsch: null }
  },
  {
    id: 'durchmarsch',
    name: 'Durchmarsch',
    basePoints: 6,
    rank: 5,
    gameType: 'NO_TRUMP',
    trump: { kind: 'none' },
    tags: ['DURCHMARSCH'],
    silent: { csendes100: null, csendesUlti: null, csendesDurchmarsch: null }
  },
  {
    id: '40_100_ulti',
    name: '40-100 Ulti',
    basePoints: 8,
    rank: 6,
    gameType: 'TRUMP',
    trump: { kind: 'bidder' },
    tags: ['40_100', 'ULTI'],
    silent: { csendes100: null, csendesUlti: null, csendesDurchmarsch: 3 }
  },
  {
    id: 'piros_40_100',
    name: 'Piros 40-100',
    basePoints: 8,
    rank: 7,
    gameType: 'TRUMP',
    trump: { kind: 'piros' },
    tags: ['PIROS_PREFIX', '40_100'],
    silent: { csendes100: null, csendesUlti: 4, csendesDurchmarsch: 6 }
  },
  {
    id: '20_100',
    name: '20-100',
    basePoints: 8,
    rank: 8,
    gameType: 'TRUMP',
    trump: { kind: 'bidder' },
    tags: ['20_100'],
    silent: { csendes100: null, csendesUlti: 2, csendesDurchmarsch: 3 }
  },
  {
    id: 'piros_ulti',
    name: 'Piros Ulti',
    basePoints: 10,
    rank: 9,
    gameType: 'TRUMP',
    trump: { kind: 'piros' },
    tags: ['PIROS_PREFIX', 'ULTI'],
    silent: { csendes100: 4, csendesUlti: null, csendesDurchmarsch: 6, hasBangBangBangBang: true }
  },
  {
    id: 'pirosbetli',
    name: 'Pirosbetli',
    basePoints: 10,
    rank: 10,
    gameType: 'NO_TRUMP',
    trump: { kind: 'none' },
    tags: ['PIROS_PREFIX', 'BETLI'],
    silent: { csendes100: null, csendesUlti: null, csendesDurchmarsch: null }
  },
  {
    id: 'durchmarsch_40_100',
    name: 'Durchmarsch 40-100',
    basePoints: 10,
    rank: 11,
    gameType: 'TRUMP',
    trump: { kind: 'bidder' },
    tags: ['DURCHMARSCH', '40_100'],
    silent: { csendes100: null, csendesUlti: 2, csendesDurchmarsch: null }
  },
  {
    id: 'durchmarsch_ulti',
    name: 'Durchmarsch Ulti',
    basePoints: 10,
    rank: 12,
    gameType: 'TRUMP',
    trump: { kind: 'bidder' },
    tags: ['DURCHMARSCH', 'ULTI'],
    silent: { csendes100: 2, csendesUlti: null, csendesDurchmarsch: null }
  },
  {
    id: 'ulti_20_100',
    name: 'Ulti 20-100',
    basePoints: 12,
    rank: 13,
    gameType: 'TRUMP',
    trump: { kind: 'bidder' },
    tags: ['ULTI', '20_100'],
    silent: { csendes100: null, csendesUlti: null, csendesDurchmarsch: 3 }
  },
  {
    id: 'pirosdurchmarsch',
    name: 'Pirosdurchmarsch',
    basePoints: 12,
    rank: 14,
    gameType: 'NO_TRUMP',
    trump: { kind: 'none' },
    tags: ['PIROS_PREFIX', 'DURCHMARSCH'],
    silent: { csendes100: null, csendesUlti: null, csendesDurchmarsch: null }
  },
  {
    id: 'durchmarsch_40_100_ulti',
    name: 'Durchmarsch 40-100 Ulti',
    basePoints: 14,
    rank: 15,
    gameType: 'TRUMP',
    trump: { kind: 'bidder' },
    tags: ['DURCHMARSCH', '40_100', 'ULTI'],
    silent: { csendes100: null, csendesUlti: null, csendesDurchmarsch: null }
  },
  {
    id: 'durchmarsch_20_100',
    name: 'Durchmarsch 20-100',
    basePoints: 14,
    rank: 16,
    gameType: 'TRUMP',
    trump: { kind: 'bidder' },
    tags: ['DURCHMARSCH', '20_100'],
    silent: { csendes100: null, csendesUlti: 2, csendesDurchmarsch: null }
  },
  {
    id: 'piros_40_100_ulti',
    name: 'Piros 40-100 Ulti',
    basePoints: 16,
    rank: 17,
    gameType: 'TRUMP',
    trump: { kind: 'piros' },
    tags: ['PIROS_PREFIX', '40_100', 'ULTI'],
    silent: { csendes100: null, csendesUlti: null, csendesDurchmarsch: 6 }
  },
  {
    id: 'piros_20_100',
    name: 'Piros 20-100',
    basePoints: 16,
    rank: 18,
    gameType: 'TRUMP',
    trump: { kind: 'piros' },
    tags: ['PIROS_PREFIX', '20_100'],
    silent: { csendes100: null, csendesUlti: 4, csendesDurchmarsch: 6 }
  },
  {
    id: 'durchmarsch_ulti_20_100',
    name: 'Durchmarsch Ulti 20-100',
    basePoints: 18,
    rank: 19,
    gameType: 'TRUMP',
    trump: { kind: 'bidder' },
    tags: ['DURCHMARSCH', 'ULTI', '20_100'],
    silent: { csendes100: null, csendesUlti: null, csendesDurchmarsch: null }
  },
  {
    id: 'pirosdurchmarsch_40_100',
    name: 'Pirosdurchmarsch 40-100',
    basePoints: 20,
    rank: 20,
    gameType: 'TRUMP',
    trump: { kind: 'piros' },
    tags: ['PIROS_PREFIX', 'DURCHMARSCH', '40_100'],
    silent: { csendes100: null, csendesUlti: 4, csendesDurchmarsch: null }
  },
  {
    id: 'pirosdurchmarsch_ulti',
    name: 'Pirosdurchmarsch Ulti',
    basePoints: 20,
    rank: 21,
    gameType: 'TRUMP',
    trump: { kind: 'piros' },
    tags: ['PIROS_PREFIX', 'DURCHMARSCH', 'ULTI'],
    silent: { csendes100: 4, csendesUlti: null, csendesDurchmarsch: null }
  },
  {
    id: 'teritettbetli',
    name: 'Terítettbetli',
    basePoints: 20,
    rank: 22,
    gameType: 'NO_TRUMP',
    trump: { kind: 'none' },
    tags: ['TERITETT', 'BETLI'],
    silent: { csendes100: null, csendesUlti: null, csendesDurchmarsch: null }
  },
  {
    id: 'piros_ulti_20_100',
    name: 'Piros Ulti 20-100',
    basePoints: 24,
    rank: 23,
    gameType: 'TRUMP',
    trump: { kind: 'piros' },
    tags: ['PIROS_PREFIX', 'ULTI', '20_100'],
    silent: { csendes100: null, csendesUlti: null, csendesDurchmarsch: 6 }
  },
  {
    id: 'teritett_durchmarsch',
    name: 'Terített Durchmarsch',
    basePoints: 24,
    rank: 24,
    gameType: 'NO_TRUMP',
    trump: { kind: 'none' },
    tags: ['TERITETT', 'DURCHMARSCH'],
    silent: { csendes100: null, csendesUlti: null, csendesDurchmarsch: null }
  },
  {
    id: 'piros_durchmarsch_40_100_ulti',
    name: 'Piros Durchmarsch 40-100 Ulti',
    basePoints: 28,
    rank: 25,
    gameType: 'TRUMP',
    trump: { kind: 'piros' },
    tags: ['PIROS_PREFIX', 'DURCHMARSCH', '40_100', 'ULTI'],
    silent: { csendes100: null, csendesUlti: null, csendesDurchmarsch: null }
  },
  {
    id: 'piros_durchmarsch_20_100',
    name: 'Piros Durchmarsch 20-100',
    basePoints: 28,
    rank: 26,
    gameType: 'TRUMP',
    trump: { kind: 'piros' },
    tags: ['PIROS_PREFIX', 'DURCHMARSCH', '20_100'],
    silent: { csendes100: null, csendesUlti: 4, csendesDurchmarsch: null }
  },
  {
    id: 'teritett_durchmarsch_40_100',
    name: 'Terített Durchmarsch 40-100',
    basePoints: 28,
    rank: 27,
    gameType: 'TRUMP',
    trump: { kind: 'bidder' },
    tags: ['TERITETT', 'DURCHMARSCH', '40_100'],
    silent: { csendes100: null, csendesUlti: 2, csendesDurchmarsch: null }
  },
  {
    id: 'teritett_durchmarsch_ulti',
    name: 'Terített Durchmarsch Ulti',
    basePoints: 28,
    rank: 28,
    gameType: 'TRUMP',
    trump: { kind: 'bidder' },
    tags: ['TERITETT', 'DURCHMARSCH', 'ULTI'],
    silent: { csendes100: 2, csendesUlti: null, csendesDurchmarsch: null }
  },
  {
    id: 'teritett_durchmarsch_40_100_ulti',
    name: 'Terített Durchmarsch 40-100 Ulti',
    basePoints: 32,
    rank: 29,
    gameType: 'TRUMP',
    trump: { kind: 'bidder' },
    tags: ['TERITETT', 'DURCHMARSCH', '40_100', 'ULTI'],
    silent: { csendes100: null, csendesUlti: null, csendesDurchmarsch: null }
  },
  {
    id: 'piros_teritett_durchmarsch_40_100',
    name: 'Piros Terített Durchmarsch 40-100',
    basePoints: 32,
    rank: 30,
    gameType: 'TRUMP',
    trump: { kind: 'piros' },
    tags: ['PIROS_PREFIX', 'TERITETT', 'DURCHMARSCH', '40_100'],
    silent: { csendes100: null, csendesUlti: 4, csendesDurchmarsch: null }
  },
  {
    id: 'piros_teritett_durchmarsch_ulti',
    name: 'Piros Terített Durchmarsch Ulti',
    basePoints: 32,
    rank: 31,
    gameType: 'TRUMP',
    trump: { kind: 'piros' },
    tags: ['PIROS_PREFIX', 'TERITETT', 'DURCHMARSCH', 'ULTI'],
    silent: { csendes100: 4, csendesUlti: null, csendesDurchmarsch: null }
  },
  {
    id: 'teritett_durchmarsch_20_100',
    name: 'Terített Durchmarsch 20-100',
    basePoints: 32,
    rank: 32,
    gameType: 'TRUMP',
    trump: { kind: 'bidder' },
    tags: ['TERITETT', 'DURCHMARSCH', '20_100'],
    silent: { csendes100: null, csendesUlti: 2, csendesDurchmarsch: null }
  },
  {
    id: 'piros_durchmarsch_ulti_20_100',
    name: 'Piros Durchmarsch Ulti 20-100',
    basePoints: 36,
    rank: 33,
    gameType: 'TRUMP',
    trump: { kind: 'piros' },
    tags: ['PIROS_PREFIX', 'DURCHMARSCH', 'ULTI', '20_100'],
    silent: { csendes100: null, csendesUlti: null, csendesDurchmarsch: null }
  },
  {
    id: 'teritett_durchmarsch_ulti_20_100',
    name: 'Terített Durchmarsch Ulti 20-100',
    basePoints: 36,
    rank: 34,
    gameType: 'TRUMP',
    trump: { kind: 'bidder' },
    tags: ['TERITETT', 'DURCHMARSCH', 'ULTI', '20_100'],
    silent: { csendes100: null, csendesUlti: null, csendesDurchmarsch: null }
  },
  {
    id: 'piros_teritett_durchmarsch_40_100_ulti',
    name: 'Piros Terített Durchmarsch 40-100 Ulti',
    basePoints: 40,
    rank: 35,
    gameType: 'TRUMP',
    trump: { kind: 'piros' },
    tags: ['PIROS_PREFIX', 'TERITETT', 'DURCHMARSCH', '40_100', 'ULTI'],
    silent: { csendes100: null, csendesUlti: null, csendesDurchmarsch: null }
  },
  {
    id: 'piros_teritett_durchmarsch_20_100',
    name: 'Piros Terített Durchmarsch 20-100',
    basePoints: 40,
    rank: 36,
    gameType: 'TRUMP',
    trump: { kind: 'piros' },
    tags: ['PIROS_PREFIX', 'TERITETT', 'DURCHMARSCH', '20_100'],
    silent: { csendes100: null, csendesUlti: 4, csendesDurchmarsch: null }
  },
  {
    id: 'piros_teritett_durchmarsch_ulti_20_100',
    name: 'Piros Terített Durchmarsch Ulti 20-100',
    basePoints: 48,
    rank: 37,
    gameType: 'TRUMP',
    trump: { kind: 'piros' },
    tags: ['PIROS_PREFIX', 'TERITETT', 'DURCHMARSCH', 'ULTI', '20_100'],
    silent: { csendes100: null, csendesUlti: null, csendesDurchmarsch: null }
  }
];

export type BaseAnnouncement = {
  id: string;
  name: string;
  basePoints: number;
  gameType: GameType;
  notes: string;
  isPrefix?: boolean;
  multiplier?: number;
};

export const BASE_ANNOUNCEMENTS: BaseAnnouncement[] = [
  {
    id: 'passz',
    name: 'Passz',
    basePoints: 1,
    gameType: 'TRUMP',
    notes: 'Adujáték, a pontértékek több, mint felét viszi.'
  },
  {
    id: 'negyvenszaz',
    name: 'Negyvenszáz',
    basePoints: 4,
    gameType: 'TRUMP',
    notes: 'Adujáték, felvevőnek 40-e van, és ütésből legalább 60 pontot szerez.'
  },
  {
    id: 'ulti',
    name: 'Ulti',
    basePoints: 4,
    gameType: 'TRUMP',
    notes:
      'Adujáték: az adu hetessel kell a 10 körben ütni. Ha nincs kombinálva semmivel, a passzt is játsszák. Bukás esetén még egyszer levonás (piros dupláz, kontrák nem).'
  },
  {
    id: 'betli',
    name: 'Betli',
    basePoints: 5,
    gameType: 'NO_TRUMP',
    notes: 'Adu nélküli játék: felvevő vállalja, hogy nem üt semmit.'
  },
  {
    id: 'durchmarsch',
    name: 'Durchmarsch',
    basePoints: 6,
    gameType: 'NO_TRUMP',
    notes: 'Felvevő vállalja, hogy mindent üt. Aduszín a táblázatból (ha van).'
  },
  {
    id: 'huszszaz',
    name: 'Húszszáz',
    basePoints: 8,
    gameType: 'TRUMP',
    notes: 'Adujáték: felvevőnek 20-a van, és ütésből legalább 80 pontot szerez.'
  },
  {
    id: 'piros',
    name: 'Piros (prefix)',
    basePoints: 0,
    gameType: 'TRUMP',
    notes:
      'Nem önálló bemondás. Prefix: duplázza a nem terített durchmarsch bemondások pontjait, és adujátékban színt jelöl.',
    isPrefix: true,
    multiplier: 2
  },
  {
    id: 'teritett_durchmarsch',
    name: 'Terített durchmarsch',
    basePoints: 24,
    gameType: 'NO_TRUMP',
    notes: 'Felvevő vállalja, hogy mindent üt. Terítés a 2. kör elején, csak a felvevő.'
  }
];

export const getBidById = (id: string): BidDefinition | undefined => BIDS.find((bid) => bid.id === id);

export const getBidsAbove = (rank: number): BidDefinition[] => BIDS.filter((bid) => bid.rank > rank);
