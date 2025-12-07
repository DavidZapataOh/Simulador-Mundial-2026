/**
 * FIFA World Cup 2026 - Teams and Groups Configuration
 * 
 * SINGLE SOURCE OF TRUTH for all team data including playoff candidates.
 * All team lookups go through TEAMS_REGISTRY.
 */

// ============================================================================
// Type Definitions
// ============================================================================

export type TeamId = string;
export type GroupId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L';

export interface Team {
  id: TeamId;
  name: string;
  shortName: string;
  flagCode: string;
  groupId?: GroupId;
  isPlayoffSlot?: boolean;
}

export interface Group {
  id: GroupId;
  name: string;
  teams: TeamId[];
}

export type KnockoutStage =
  | 'roundOf32'
  | 'roundOf16'
  | 'quarterFinals'
  | 'semiFinals'
  | 'thirdPlace'
  | 'final';

export interface KnockoutMatchSlot {
  id: string;
  matchNumber: number;
  stage: KnockoutStage;
  homeSource: BracketSource;
  awaySource: BracketSource;
}

export type BracketSource =
  | { type: 'groupWinner'; groupId: GroupId }
  | { type: 'groupRunnerUp'; groupId: GroupId }
  | { type: 'thirdPlace'; possibleGroups: GroupId[] }
  | { type: 'winnerOf'; matchId: string }
  | { type: 'loserOf'; matchId: string };

// ============================================================================
// Playoff Types
// ============================================================================

export interface PlayoffPath {
  id: string;
  name: string;
  slotTeamId: TeamId; // The slot ID used in groups (e.g., "playoff-1-slot")
  candidateIds: TeamId[]; // IDs of candidate teams
}

export interface PlayoffSelection {
  playoffId: string;
  selectedTeamId: TeamId; // The actual team ID selected (e.g., "ita")
}

// Mapping from slot IDs to selected real team IDs
export type PlayoffMapping = Record<TeamId, TeamId>;

// ============================================================================
// Simulation Types
// ============================================================================

export interface GroupPrediction {
  groupId: GroupId;
  orderedTeamIds: TeamId[];
}

export interface KnockoutMatchPrediction {
  matchId: string;
  homeTeamId: TeamId;
  awayTeamId: TeamId;
  winnerTeamId: TeamId;
}

// ============================================================================
// TEAMS REGISTRY - Single Source of Truth
// All teams including playoff candidates are here
// ============================================================================

export const TEAMS_REGISTRY: Record<TeamId, Team> = {
  // ========== CONFIRMED TEAMS (42) ==========
  // Group A
  mex: { id: 'mex', name: 'México', shortName: 'MEX', flagCode: 'MX', groupId: 'A' },
  rsa: { id: 'rsa', name: 'Sudáfrica', shortName: 'RSA', flagCode: 'ZA', groupId: 'A' },
  kor: { id: 'kor', name: 'Corea del Sur', shortName: 'KOR', flagCode: 'KR', groupId: 'A' },
  // Group B
  can: { id: 'can', name: 'Canadá', shortName: 'CAN', flagCode: 'CA', groupId: 'B' },
  qat: { id: 'qat', name: 'Qatar', shortName: 'QAT', flagCode: 'QA', groupId: 'B' },
  sui: { id: 'sui', name: 'Suiza', shortName: 'SUI', flagCode: 'CH', groupId: 'B' },
  // Group C
  bra: { id: 'bra', name: 'Brasil', shortName: 'BRA', flagCode: 'BR', groupId: 'C' },
  mar: { id: 'mar', name: 'Marruecos', shortName: 'MAR', flagCode: 'MA', groupId: 'C' },
  hai: { id: 'hai', name: 'Haití', shortName: 'HAI', flagCode: 'HT', groupId: 'C' },
  sco: { id: 'sco', name: 'Escocia', shortName: 'SCO', flagCode: 'GB', groupId: 'C' },
  // Group D
  usa: { id: 'usa', name: 'Estados Unidos', shortName: 'USA', flagCode: 'US', groupId: 'D' },
  par: { id: 'par', name: 'Paraguay', shortName: 'PAR', flagCode: 'PY', groupId: 'D' },
  aus: { id: 'aus', name: 'Australia', shortName: 'AUS', flagCode: 'AU', groupId: 'D' },
  // Group E
  ger: { id: 'ger', name: 'Alemania', shortName: 'GER', flagCode: 'DE', groupId: 'E' },
  cur: { id: 'cur', name: 'Curazao', shortName: 'CUR', flagCode: 'CW', groupId: 'E' },
  civ: { id: 'civ', name: 'Costa de Marfil', shortName: 'CIV', flagCode: 'CI', groupId: 'E' },
  ecu: { id: 'ecu', name: 'Ecuador', shortName: 'ECU', flagCode: 'EC', groupId: 'E' },
  // Group F
  ned: { id: 'ned', name: 'Países Bajos', shortName: 'NED', flagCode: 'NL', groupId: 'F' },
  jpn: { id: 'jpn', name: 'Japón', shortName: 'JPN', flagCode: 'JP', groupId: 'F' },
  tun: { id: 'tun', name: 'Túnez', shortName: 'TUN', flagCode: 'TN', groupId: 'F' },
  // Group G
  bel: { id: 'bel', name: 'Bélgica', shortName: 'BEL', flagCode: 'BE', groupId: 'G' },
  egy: { id: 'egy', name: 'Egipto', shortName: 'EGY', flagCode: 'EG', groupId: 'G' },
  irn: { id: 'irn', name: 'Irán', shortName: 'IRN', flagCode: 'IR', groupId: 'G' },
  nzl: { id: 'nzl', name: 'Nueva Zelanda', shortName: 'NZL', flagCode: 'NZ', groupId: 'G' },
  // Group H
  esp: { id: 'esp', name: 'España', shortName: 'ESP', flagCode: 'ES', groupId: 'H' },
  cpv: { id: 'cpv', name: 'Cabo Verde', shortName: 'CPV', flagCode: 'CV', groupId: 'H' },
  ksa: { id: 'ksa', name: 'Arabia Saudita', shortName: 'KSA', flagCode: 'SA', groupId: 'H' },
  uru: { id: 'uru', name: 'Uruguay', shortName: 'URU', flagCode: 'UY', groupId: 'H' },
  // Group I
  fra: { id: 'fra', name: 'Francia', shortName: 'FRA', flagCode: 'FR', groupId: 'I' },
  sen: { id: 'sen', name: 'Senegal', shortName: 'SEN', flagCode: 'SN', groupId: 'I' },
  nor: { id: 'nor', name: 'Noruega', shortName: 'NOR', flagCode: 'NO', groupId: 'I' },
  // Group J
  arg: { id: 'arg', name: 'Argentina', shortName: 'ARG', flagCode: 'AR', groupId: 'J' },
  alg: { id: 'alg', name: 'Argelia', shortName: 'ALG', flagCode: 'DZ', groupId: 'J' },
  aut: { id: 'aut', name: 'Austria', shortName: 'AUT', flagCode: 'AT', groupId: 'J' },
  jor: { id: 'jor', name: 'Jordania', shortName: 'JOR', flagCode: 'JO', groupId: 'J' },
  // Group K
  por: { id: 'por', name: 'Portugal', shortName: 'POR', flagCode: 'PT', groupId: 'K' },
  uzb: { id: 'uzb', name: 'Uzbekistán', shortName: 'UZB', flagCode: 'UZ', groupId: 'K' },
  col: { id: 'col', name: 'Colombia', shortName: 'COL', flagCode: 'CO', groupId: 'K' },
  // Group L
  eng: { id: 'eng', name: 'Inglaterra', shortName: 'ENG', flagCode: 'GB', groupId: 'L' },
  cro: { id: 'cro', name: 'Croacia', shortName: 'CRO', flagCode: 'HR', groupId: 'L' },
  gha: { id: 'gha', name: 'Ghana', shortName: 'GHA', flagCode: 'GH', groupId: 'L' },
  pan: { id: 'pan', name: 'Panamá', shortName: 'PAN', flagCode: 'PA', groupId: 'L' },

  // ========== PLAYOFF SLOT PLACEHOLDERS (6) ==========
  'playoff-1-slot': { id: 'playoff-1-slot', name: 'Playoff 1', shortName: 'PO1', flagCode: 'UN', groupId: 'K', isPlayoffSlot: true },
  'playoff-2-slot': { id: 'playoff-2-slot', name: 'Playoff 2', shortName: 'PO2', flagCode: 'UN', groupId: 'I', isPlayoffSlot: true },
  'playoff-3-slot': { id: 'playoff-3-slot', name: 'Playoff 3', shortName: 'PO3', flagCode: 'EU', groupId: 'B', isPlayoffSlot: true },
  'playoff-4-slot': { id: 'playoff-4-slot', name: 'Playoff 4', shortName: 'PO4', flagCode: 'EU', groupId: 'F', isPlayoffSlot: true },
  'playoff-5-slot': { id: 'playoff-5-slot', name: 'Playoff 5', shortName: 'PO5', flagCode: 'EU', groupId: 'D', isPlayoffSlot: true },
  'playoff-6-slot': { id: 'playoff-6-slot', name: 'Playoff 6', shortName: 'PO6', flagCode: 'EU', groupId: 'A', isPlayoffSlot: true },

  // ========== PLAYOFF CANDIDATES (all real teams that could win playoffs) ==========
  // Playoff 1 candidates (Intercontinental 1)
  ncl: { id: 'ncl', name: 'Nueva Caledonia', shortName: 'NCL', flagCode: 'NC' },
  jam: { id: 'jam', name: 'Jamaica', shortName: 'JAM', flagCode: 'JM' },
  cod: { id: 'cod', name: 'RD Congo', shortName: 'COD', flagCode: 'CD' },
  // Playoff 2 candidates (Intercontinental 2)
  bol: { id: 'bol', name: 'Bolivia', shortName: 'BOL', flagCode: 'BO' },
  sur: { id: 'sur', name: 'Surinam', shortName: 'SUR', flagCode: 'SR' },
  irq: { id: 'irq', name: 'Irak', shortName: 'IRQ', flagCode: 'IQ' },
  // Playoff 3 candidates (UEFA A)
  ita: { id: 'ita', name: 'Italia', shortName: 'ITA', flagCode: 'IT' },
  nir: { id: 'nir', name: 'Irlanda del Norte', shortName: 'NIR', flagCode: 'GB' },
  wal: { id: 'wal', name: 'Gales', shortName: 'WAL', flagCode: 'GB' },
  bih: { id: 'bih', name: 'Bosnia y Herzegovina', shortName: 'BIH', flagCode: 'BA' },
  // Playoff 4 candidates (UEFA B)
  ukr: { id: 'ukr', name: 'Ucrania', shortName: 'UKR', flagCode: 'UA' },
  swe: { id: 'swe', name: 'Suecia', shortName: 'SWE', flagCode: 'SE' },
  pol: { id: 'pol', name: 'Polonia', shortName: 'POL', flagCode: 'PL' },
  alb: { id: 'alb', name: 'Albania', shortName: 'ALB', flagCode: 'AL' },
  // Playoff 5 candidates (UEFA C)
  svk: { id: 'svk', name: 'Eslovaquia', shortName: 'SVK', flagCode: 'SK' },
  kos: { id: 'kos', name: 'Kosovo', shortName: 'KOS', flagCode: 'XK' },
  tur: { id: 'tur', name: 'Turquía', shortName: 'TUR', flagCode: 'TR' },
  rou: { id: 'rou', name: 'Rumania', shortName: 'ROU', flagCode: 'RO' },
  // Playoff 6 candidates (UEFA D)
  cze: { id: 'cze', name: 'República Checa', shortName: 'CZE', flagCode: 'CZ' },
  irl: { id: 'irl', name: 'Irlanda', shortName: 'IRL', flagCode: 'IE' },
  den: { id: 'den', name: 'Dinamarca', shortName: 'DEN', flagCode: 'DK' },
  mkd: { id: 'mkd', name: 'Macedonia del Norte', shortName: 'MKD', flagCode: 'MK' },
};

// Legacy alias for backward compatibility
export const TEAMS = TEAMS_REGISTRY;

// ============================================================================
// Playoff Paths Configuration
// ============================================================================

export const PLAYOFF_PATHS: PlayoffPath[] = [
  {
    id: 'playoff-1',
    name: 'Playoff Intercontinental 1',
    slotTeamId: 'playoff-1-slot',
    candidateIds: ['ncl', 'jam', 'cod'],
  },
  {
    id: 'playoff-2',
    name: 'Playoff Intercontinental 2',
    slotTeamId: 'playoff-2-slot',
    candidateIds: ['bol', 'sur', 'irq'],
  },
  {
    id: 'playoff-3',
    name: 'Playoff UEFA A',
    slotTeamId: 'playoff-3-slot',
    candidateIds: ['ita', 'nir', 'wal', 'bih'],
  },
  {
    id: 'playoff-4',
    name: 'Playoff UEFA B',
    slotTeamId: 'playoff-4-slot',
    candidateIds: ['ukr', 'swe', 'pol', 'alb'],
  },
  {
    id: 'playoff-5',
    name: 'Playoff UEFA C',
    slotTeamId: 'playoff-5-slot',
    candidateIds: ['svk', 'kos', 'tur', 'rou'],
  },
  {
    id: 'playoff-6',
    name: 'Playoff UEFA D',
    slotTeamId: 'playoff-6-slot',
    candidateIds: ['cze', 'irl', 'den', 'mkd'],
  },
];

// ============================================================================
// Groups Configuration (using slot IDs for playoffs)
// ============================================================================

export const GROUPS: Group[] = [
  { id: 'A', name: 'Grupo A', teams: ['mex', 'rsa', 'kor', 'playoff-6-slot'] },
  { id: 'B', name: 'Grupo B', teams: ['can', 'playoff-3-slot', 'qat', 'sui'] },
  { id: 'C', name: 'Grupo C', teams: ['bra', 'mar', 'hai', 'sco'] },
  { id: 'D', name: 'Grupo D', teams: ['usa', 'par', 'aus', 'playoff-5-slot'] },
  { id: 'E', name: 'Grupo E', teams: ['ger', 'cur', 'civ', 'ecu'] },
  { id: 'F', name: 'Grupo F', teams: ['ned', 'jpn', 'playoff-4-slot', 'tun'] },
  { id: 'G', name: 'Grupo G', teams: ['bel', 'egy', 'irn', 'nzl'] },
  { id: 'H', name: 'Grupo H', teams: ['esp', 'cpv', 'ksa', 'uru'] },
  { id: 'I', name: 'Grupo I', teams: ['fra', 'sen', 'playoff-2-slot', 'nor'] },
  { id: 'J', name: 'Grupo J', teams: ['arg', 'alg', 'aut', 'jor'] },
  { id: 'K', name: 'Grupo K', teams: ['por', 'playoff-1-slot', 'uzb', 'col'] },
  { id: 'L', name: 'Grupo L', teams: ['eng', 'cro', 'gha', 'pan'] },
];

export const GROUP_IDS: GroupId[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

// ============================================================================
// Team Resolution Helper - THE CORE FUNCTION
// Always use this to get the actual team for display
// ============================================================================

export function resolveTeamId(rawTeamId: TeamId, playoffMapping: PlayoffMapping): TeamId {
  return playoffMapping[rawTeamId] ?? rawTeamId;
}

export function getResolvedTeam(rawTeamId: TeamId, playoffMapping: PlayoffMapping): Team | undefined {
  const resolvedId = resolveTeamId(rawTeamId, playoffMapping);
  return TEAMS_REGISTRY[resolvedId];
}

// Build playoff mapping from selections
export function buildPlayoffMapping(selections: PlayoffSelection[]): PlayoffMapping {
  const mapping: PlayoffMapping = {};
  for (const selection of selections) {
    const path = PLAYOFF_PATHS.find(p => p.id === selection.playoffId);
    if (path) {
      mapping[path.slotTeamId] = selection.selectedTeamId;
    }
  }
  return mapping;
}

// ============================================================================
// Knockout Bracket - Logical structure (match IDs and sources)
// ============================================================================

export const KNOCKOUT_MATCHES: Record<string, KnockoutMatchSlot> = {
  // Round of 32
  M73: { id: 'M73', matchNumber: 73, stage: 'roundOf32', homeSource: { type: 'groupRunnerUp', groupId: 'A' }, awaySource: { type: 'groupRunnerUp', groupId: 'B' } },
  M74: { id: 'M74', matchNumber: 74, stage: 'roundOf32', homeSource: { type: 'groupWinner', groupId: 'E' }, awaySource: { type: 'thirdPlace', possibleGroups: ['A', 'B', 'C', 'D', 'F'] } },
  M75: { id: 'M75', matchNumber: 75, stage: 'roundOf32', homeSource: { type: 'groupWinner', groupId: 'F' }, awaySource: { type: 'groupRunnerUp', groupId: 'C' } },
  M76: { id: 'M76', matchNumber: 76, stage: 'roundOf32', homeSource: { type: 'groupWinner', groupId: 'C' }, awaySource: { type: 'groupRunnerUp', groupId: 'F' } },
  M77: { id: 'M77', matchNumber: 77, stage: 'roundOf32', homeSource: { type: 'groupWinner', groupId: 'I' }, awaySource: { type: 'thirdPlace', possibleGroups: ['C', 'D', 'F', 'G', 'H'] } },
  M78: { id: 'M78', matchNumber: 78, stage: 'roundOf32', homeSource: { type: 'groupRunnerUp', groupId: 'E' }, awaySource: { type: 'groupRunnerUp', groupId: 'I' } },
  M79: { id: 'M79', matchNumber: 79, stage: 'roundOf32', homeSource: { type: 'groupWinner', groupId: 'A' }, awaySource: { type: 'thirdPlace', possibleGroups: ['C', 'E', 'F', 'H', 'I'] } },
  M80: { id: 'M80', matchNumber: 80, stage: 'roundOf32', homeSource: { type: 'groupWinner', groupId: 'L' }, awaySource: { type: 'thirdPlace', possibleGroups: ['E', 'H', 'I', 'J', 'K'] } },
  M81: { id: 'M81', matchNumber: 81, stage: 'roundOf32', homeSource: { type: 'groupWinner', groupId: 'D' }, awaySource: { type: 'thirdPlace', possibleGroups: ['B', 'E', 'F', 'I', 'J'] } },
  M82: { id: 'M82', matchNumber: 82, stage: 'roundOf32', homeSource: { type: 'groupWinner', groupId: 'G' }, awaySource: { type: 'thirdPlace', possibleGroups: ['A', 'E', 'H', 'I', 'J'] } },
  M83: { id: 'M83', matchNumber: 83, stage: 'roundOf32', homeSource: { type: 'groupRunnerUp', groupId: 'K' }, awaySource: { type: 'groupRunnerUp', groupId: 'L' } },
  M84: { id: 'M84', matchNumber: 84, stage: 'roundOf32', homeSource: { type: 'groupWinner', groupId: 'H' }, awaySource: { type: 'groupRunnerUp', groupId: 'J' } },
  M85: { id: 'M85', matchNumber: 85, stage: 'roundOf32', homeSource: { type: 'groupWinner', groupId: 'B' }, awaySource: { type: 'thirdPlace', possibleGroups: ['E', 'F', 'G', 'I', 'J'] } },
  M86: { id: 'M86', matchNumber: 86, stage: 'roundOf32', homeSource: { type: 'groupWinner', groupId: 'J' }, awaySource: { type: 'groupRunnerUp', groupId: 'H' } },
  M87: { id: 'M87', matchNumber: 87, stage: 'roundOf32', homeSource: { type: 'groupWinner', groupId: 'K' }, awaySource: { type: 'thirdPlace', possibleGroups: ['D', 'E', 'I', 'J', 'L'] } },
  M88: { id: 'M88', matchNumber: 88, stage: 'roundOf32', homeSource: { type: 'groupRunnerUp', groupId: 'D' }, awaySource: { type: 'groupRunnerUp', groupId: 'G' } },
  // Round of 16
  M89: { id: 'M89', matchNumber: 89, stage: 'roundOf16', homeSource: { type: 'winnerOf', matchId: 'M74' }, awaySource: { type: 'winnerOf', matchId: 'M77' } },
  M90: { id: 'M90', matchNumber: 90, stage: 'roundOf16', homeSource: { type: 'winnerOf', matchId: 'M73' }, awaySource: { type: 'winnerOf', matchId: 'M75' } },
  M91: { id: 'M91', matchNumber: 91, stage: 'roundOf16', homeSource: { type: 'winnerOf', matchId: 'M76' }, awaySource: { type: 'winnerOf', matchId: 'M78' } },
  M92: { id: 'M92', matchNumber: 92, stage: 'roundOf16', homeSource: { type: 'winnerOf', matchId: 'M79' }, awaySource: { type: 'winnerOf', matchId: 'M80' } },
  M93: { id: 'M93', matchNumber: 93, stage: 'roundOf16', homeSource: { type: 'winnerOf', matchId: 'M83' }, awaySource: { type: 'winnerOf', matchId: 'M84' } },
  M94: { id: 'M94', matchNumber: 94, stage: 'roundOf16', homeSource: { type: 'winnerOf', matchId: 'M81' }, awaySource: { type: 'winnerOf', matchId: 'M82' } },
  M95: { id: 'M95', matchNumber: 95, stage: 'roundOf16', homeSource: { type: 'winnerOf', matchId: 'M86' }, awaySource: { type: 'winnerOf', matchId: 'M88' } },
  M96: { id: 'M96', matchNumber: 96, stage: 'roundOf16', homeSource: { type: 'winnerOf', matchId: 'M85' }, awaySource: { type: 'winnerOf', matchId: 'M87' } },
  // Quarter-finals
  M97: { id: 'M97', matchNumber: 97, stage: 'quarterFinals', homeSource: { type: 'winnerOf', matchId: 'M89' }, awaySource: { type: 'winnerOf', matchId: 'M90' } },
  M98: { id: 'M98', matchNumber: 98, stage: 'quarterFinals', homeSource: { type: 'winnerOf', matchId: 'M93' }, awaySource: { type: 'winnerOf', matchId: 'M94' } },
  M99: { id: 'M99', matchNumber: 99, stage: 'quarterFinals', homeSource: { type: 'winnerOf', matchId: 'M91' }, awaySource: { type: 'winnerOf', matchId: 'M92' } },
  M100: { id: 'M100', matchNumber: 100, stage: 'quarterFinals', homeSource: { type: 'winnerOf', matchId: 'M95' }, awaySource: { type: 'winnerOf', matchId: 'M96' } },
  // Semi-finals
  M101: { id: 'M101', matchNumber: 101, stage: 'semiFinals', homeSource: { type: 'winnerOf', matchId: 'M97' }, awaySource: { type: 'winnerOf', matchId: 'M98' } },
  M102: { id: 'M102', matchNumber: 102, stage: 'semiFinals', homeSource: { type: 'winnerOf', matchId: 'M99' }, awaySource: { type: 'winnerOf', matchId: 'M100' } },
  // Third place
  M103: { id: 'M103', matchNumber: 103, stage: 'thirdPlace', homeSource: { type: 'loserOf', matchId: 'M101' }, awaySource: { type: 'loserOf', matchId: 'M102' } },
  // Final
  M104: { id: 'M104', matchNumber: 104, stage: 'final', homeSource: { type: 'winnerOf', matchId: 'M101' }, awaySource: { type: 'winnerOf', matchId: 'M102' } },
};

// ============================================================================
// VISUAL ORDERING - Explicit arrays for bracket layout
// These define the TOP-TO-BOTTOM order for each column in the bracket
// ============================================================================

// Round of 32: Pairs that feed the same R16 match are adjacent
export const R32_VISUAL_ORDER = [
  'M74', 'M77',  // → M89
  'M73', 'M75',  // → M90
  'M83', 'M84',  // → M93
  'M81', 'M82',  // → M94
  'M76', 'M78',  // → M91
  'M79', 'M80',  // → M92
  'M86', 'M88',  // → M95
  'M85', 'M87',  // → M96
] as const;

// Round of 16: Ordered so each pair feeds QF correctly
export const R16_VISUAL_ORDER = [
  'M89', 'M90',  // → M97
  'M93', 'M94',  // → M98
  'M91', 'M92',  // → M99
  'M95', 'M96',  // → M100
] as const;

// Quarter-finals: Each match between its R16 feeders
export const QF_VISUAL_ORDER = [
  'M97',   // (89 vs 90) - top left
  'M98',   // (93 vs 94) - top right  
  'M99',   // (91 vs 92) - below M97
  'M100',  // (95 vs 96) - below M98
] as const;

// Semi-finals
export const SF_VISUAL_ORDER = ['M101', 'M102'] as const;

// Final and 3rd place
export const FINAL_VISUAL_ORDER = ['M104'] as const;
export const THIRD_PLACE_VISUAL_ORDER = ['M103'] as const;

// Combined for easy access
export const KNOCKOUT_SLOTS = [
  ...R32_VISUAL_ORDER.map(id => KNOCKOUT_MATCHES[id]),
  ...R16_VISUAL_ORDER.map(id => KNOCKOUT_MATCHES[id]),
  ...QF_VISUAL_ORDER.map(id => KNOCKOUT_MATCHES[id]),
  ...SF_VISUAL_ORDER.map(id => KNOCKOUT_MATCHES[id]),
  ...THIRD_PLACE_VISUAL_ORDER.map(id => KNOCKOUT_MATCHES[id]),
  ...FINAL_VISUAL_ORDER.map(id => KNOCKOUT_MATCHES[id]),
];

// ============================================================================
// Helper Functions
// ============================================================================

export function getTeam(teamId: TeamId): Team | undefined {
  return TEAMS_REGISTRY[teamId];
}

export function getGroup(groupId: GroupId): Group | undefined {
  return GROUPS.find(g => g.id === groupId);
}

export function getKnockoutMatch(matchId: string): KnockoutMatchSlot | undefined {
  return KNOCKOUT_MATCHES[matchId];
}

export const STAGE_NAMES: Record<KnockoutStage, string> = {
  roundOf32: 'Dieciseisavos',
  roundOf16: 'Octavos',
  quarterFinals: 'Cuartos',
  semiFinals: 'Semifinales',
  thirdPlace: 'Tercer Lugar',
  final: 'Final',
};
