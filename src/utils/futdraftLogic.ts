// ============================================================================
// FUTDRAFT AI & TACTICS - EA SPORTS FC 27 DATABASE & MATCH ENGINE
// ============================================================================

export type CardTier = 'gold' | 'silver' | 'bronze' | 'icon' | 'toty';
export type PlayerPosition = 'PO' | 'DFC' | 'LI' | 'LD' | 'MCD' | 'MC' | 'MCO' | 'EI' | 'ED' | 'DC';
export type PitchZone = 'GK' | 'DEF' | 'MID' | 'ATK';
export type FormationType = '4-3-3' | '4-4-2' | '4-2-3-1' | '3-5-2';

export type SilhouetteStyle =
  | 'afro_beard'      // Salah / Marcelo style
  | 'tall_bun'        // Haaland / Bale style
  | 'short_swept'     // De Bruyne / Bellingham / Kroos
  | 'messi_beard'     // Messi / Kane
  | 'high_fade'       // Van Dijk / Rudiger / Saliba
  | 'buzz_cut'        // Mbappe / Vinicius / Rodri
  | 'curly_locks'     // Musiala / Cucurella / Modric
  | 'keeper_gloves';  // Courtois / Alisson / Ter Stegen

export interface FutPlayerCard {
  id: string;
  name: string;
  shortName: string;
  rating: number;
  position: PlayerPosition;
  zone: PitchZone;
  tier: CardTier;
  nation: string;
  nationCode: string; // e.g., 'EG', 'NO', 'BE', 'AR', 'NL', 'FR', 'BR', 'ES', 'EN', 'PT', 'DE', 'UY'
  club: string;
  clubColors: [string, string]; // Primary, Secondary hex colors for kit & crest
  silhouette: SilhouetteStyle;
  skinTone: string;
  hairColor: string;
  stats: {
    pac: number; // Ritmo
    sho: number; // Tiro
    pas: number; // Pase
    dri: number; // Regate
    def: number; // Defensa
    phy: number; // Físico
  };
  stamina?: number; // 0-100 during match
}

export interface FormationSlot {
  slotId: string;
  label: string;
  zone: PitchZone;
  acceptedPositions: PlayerPosition[];
  // Coordinates on the tactical pitch (0-100% X and Y)
  x: number;
  y: number;
  linksTo: string[]; // Adjacent slotIds for chemistry calculation
}

export interface TacticalAction {
  id: string;
  name: string;
  category: 'offensive' | 'defensive' | 'transition';
  iconName: 'press' | 'long_pass' | 'shoot' | 'hard_tackle' | 'counter';
  description: string;
  primaryStat: keyof FutPlayerCard['stats'];
  secondaryStat: keyof FutPlayerCard['stats'];
  counteredBy: string;
  baseBonus: number;
}

export interface MatchEventLog {
  id: string;
  minute: number;
  type: 'goal' | 'shot' | 'save' | 'tackle' | 'foul' | 'yellow_card' | 'tactical_duel' | 'kickoff';
  team: 'my' | 'bro';
  text: string;
  highlight?: boolean;
  duelDetails?: {
    attackerName: string;
    defenderName: string;
    actionName: string;
    successChance: number;
    roll: number;
    won: boolean;
  };
}

export interface TeamTacticsConfig {
  mentality: 'defensive' | 'balanced' | 'attacking' | 'ultra_attacking';
  pressingStyle: 'low_block' | 'balanced' | 'high_press' | 'gegenpress';
  passingStyle: 'short_tiki_taka' | 'mixed' | 'direct_counter';
  tempo: number; // 1-100
  width: number; // 1-100
}

// ============================================================================
// FORMATIONS & PITCH COORDINATES (Perspective Tactical Pitch)
// ============================================================================

export const FORMATIONS: Record<FormationType, FormationSlot[]> = {
  '4-3-3': [
    // Attack (3)
    { slotId: 'atk_1', label: 'EI', zone: 'ATK', acceptedPositions: ['EI', 'DC', 'MCO'], x: 20, y: 20, linksTo: ['atk_2', 'mid_1'] },
    { slotId: 'atk_2', label: 'DC', zone: 'ATK', acceptedPositions: ['DC', 'MCO'], x: 50, y: 14, linksTo: ['atk_1', 'atk_3', 'mid_2'] },
    { slotId: 'atk_3', label: 'ED', zone: 'ATK', acceptedPositions: ['ED', 'DC', 'MCO'], x: 80, y: 20, linksTo: ['atk_2', 'mid_3'] },
    // Midfield (3)
    { slotId: 'mid_1', label: 'MC', zone: 'MID', acceptedPositions: ['MC', 'MCD', 'MCO'], x: 26, y: 46, linksTo: ['atk_1', 'mid_2', 'def_1', 'def_2'] },
    { slotId: 'mid_2', label: 'MCO', zone: 'MID', acceptedPositions: ['MCO', 'MC', 'MCD'], x: 50, y: 42, linksTo: ['atk_2', 'mid_1', 'mid_3', 'def_2', 'def_3'] },
    { slotId: 'mid_3', label: 'MC', zone: 'MID', acceptedPositions: ['MC', 'MCO', 'MCD'], x: 74, y: 46, linksTo: ['atk_3', 'mid_2', 'def_3', 'def_4'] },
    // Defense (4)
    { slotId: 'def_1', label: 'LI', zone: 'DEF', acceptedPositions: ['LI', 'DFC'], x: 14, y: 70, linksTo: ['mid_1', 'def_2'] },
    { slotId: 'def_2', label: 'DFC', zone: 'DEF', acceptedPositions: ['DFC', 'MCD'], x: 38, y: 72, linksTo: ['mid_1', 'mid_2', 'def_1', 'def_3', 'gk_1'] },
    { slotId: 'def_3', label: 'DFC', zone: 'DEF', acceptedPositions: ['DFC', 'MCD'], x: 62, y: 72, linksTo: ['mid_2', 'mid_3', 'def_2', 'def_4', 'gk_1'] },
    { slotId: 'def_4', label: 'LD', zone: 'DEF', acceptedPositions: ['LD', 'DFC'], x: 86, y: 70, linksTo: ['mid_3', 'def_3'] },
    // Goalkeeper (1)
    { slotId: 'gk_1', label: 'PO', zone: 'GK', acceptedPositions: ['PO'], x: 50, y: 89, linksTo: ['def_2', 'def_3'] },
  ],
  '4-4-2': [
    { slotId: 'atk_1', label: 'DC', zone: 'ATK', acceptedPositions: ['DC', 'EI', 'MCO'], x: 36, y: 16, linksTo: ['atk_2', 'mid_1', 'mid_2'] },
    { slotId: 'atk_2', label: 'DC', zone: 'ATK', acceptedPositions: ['DC', 'ED', 'MCO'], x: 64, y: 16, linksTo: ['atk_1', 'mid_3', 'mid_4'] },
    { slotId: 'mid_1', label: 'EI', zone: 'MID', acceptedPositions: ['EI', 'MC', 'MCO'], x: 16, y: 44, linksTo: ['atk_1', 'mid_2', 'def_1'] },
    { slotId: 'mid_2', label: 'MC', zone: 'MID', acceptedPositions: ['MC', 'MCD', 'MCO'], x: 39, y: 47, linksTo: ['atk_1', 'mid_1', 'mid_3', 'def_2'] },
    { slotId: 'mid_3', label: 'MC', zone: 'MID', acceptedPositions: ['MC', 'MCD', 'MCO'], x: 61, y: 47, linksTo: ['atk_2', 'mid_2', 'mid_4', 'def_3'] },
    { slotId: 'mid_4', label: 'ED', zone: 'MID', acceptedPositions: ['ED', 'MC', 'MCO'], x: 84, y: 44, linksTo: ['atk_2', 'mid_3', 'def_4'] },
    { slotId: 'def_1', label: 'LI', zone: 'DEF', acceptedPositions: ['LI', 'DFC'], x: 14, y: 70, linksTo: ['mid_1', 'def_2'] },
    { slotId: 'def_2', label: 'DFC', zone: 'DEF', acceptedPositions: ['DFC', 'MCD'], x: 38, y: 72, linksTo: ['mid_2', 'def_1', 'def_3', 'gk_1'] },
    { slotId: 'def_3', label: 'DFC', zone: 'DEF', acceptedPositions: ['DFC', 'MCD'], x: 62, y: 72, linksTo: ['mid_3', 'def_2', 'def_4', 'gk_1'] },
    { slotId: 'def_4', label: 'LD', zone: 'DEF', acceptedPositions: ['LD', 'DFC'], x: 86, y: 70, linksTo: ['mid_4', 'def_3'] },
    { slotId: 'gk_1', label: 'PO', zone: 'GK', acceptedPositions: ['PO'], x: 50, y: 89, linksTo: ['def_2', 'def_3'] },
  ],
  '4-2-3-1': [
    { slotId: 'atk_1', label: 'DC', zone: 'ATK', acceptedPositions: ['DC'], x: 50, y: 14, linksTo: ['mid_1', 'mid_2', 'mid_3'] },
    { slotId: 'mid_1', label: 'EI', zone: 'ATK', acceptedPositions: ['EI', 'MCO'], x: 20, y: 32, linksTo: ['atk_1', 'mid_2', 'mid_4'] },
    { slotId: 'mid_2', label: 'MCO', zone: 'MID', acceptedPositions: ['MCO', 'MC', 'DC'], x: 50, y: 31, linksTo: ['atk_1', 'mid_1', 'mid_3', 'mid_4', 'mid_5'] },
    { slotId: 'mid_3', label: 'ED', zone: 'ATK', acceptedPositions: ['ED', 'MCO'], x: 80, y: 32, linksTo: ['atk_1', 'mid_2', 'mid_5'] },
    { slotId: 'mid_4', label: 'MCD', zone: 'MID', acceptedPositions: ['MCD', 'MC'], x: 36, y: 51, linksTo: ['mid_1', 'mid_2', 'mid_5', 'def_1', 'def_2'] },
    { slotId: 'mid_5', label: 'MCD', zone: 'MID', acceptedPositions: ['MCD', 'MC'], x: 64, y: 51, linksTo: ['mid_2', 'mid_3', 'mid_4', 'def_3', 'def_4'] },
    { slotId: 'def_1', label: 'LI', zone: 'DEF', acceptedPositions: ['LI', 'DFC'], x: 14, y: 71, linksTo: ['mid_4', 'def_2'] },
    { slotId: 'def_2', label: 'DFC', zone: 'DEF', acceptedPositions: ['DFC'], x: 38, y: 73, linksTo: ['mid_4', 'def_1', 'def_3', 'gk_1'] },
    { slotId: 'def_3', label: 'DFC', zone: 'DEF', acceptedPositions: ['DFC'], x: 62, y: 73, linksTo: ['mid_5', 'def_2', 'def_4', 'gk_1'] },
    { slotId: 'def_4', label: 'LD', zone: 'DEF', acceptedPositions: ['LD', 'DFC'], x: 86, y: 71, linksTo: ['mid_5', 'def_3'] },
    { slotId: 'gk_1', label: 'PO', zone: 'GK', acceptedPositions: ['PO'], x: 50, y: 89, linksTo: ['def_2', 'def_3'] },
  ],
  '3-5-2': [
    { slotId: 'atk_1', label: 'DC', zone: 'ATK', acceptedPositions: ['DC', 'EI'], x: 36, y: 15, linksTo: ['atk_2', 'mid_1', 'mid_2'] },
    { slotId: 'atk_2', label: 'DC', zone: 'ATK', acceptedPositions: ['DC', 'ED'], x: 64, y: 15, linksTo: ['atk_1', 'mid_2', 'mid_3'] },
    { slotId: 'mid_1', label: 'EI', zone: 'MID', acceptedPositions: ['EI', 'LI', 'MC'], x: 16, y: 40, linksTo: ['atk_1', 'mid_2', 'mid_4', 'def_1'] },
    { slotId: 'mid_2', label: 'MCO', zone: 'MID', acceptedPositions: ['MCO', 'MC'], x: 50, y: 34, linksTo: ['atk_1', 'atk_2', 'mid_1', 'mid_3', 'mid_4', 'mid_5'] },
    { slotId: 'mid_3', label: 'ED', zone: 'MID', acceptedPositions: ['ED', 'LD', 'MC'], x: 84, y: 40, linksTo: ['atk_2', 'mid_2', 'mid_5', 'def_3'] },
    { slotId: 'mid_4', label: 'MCD', zone: 'MID', acceptedPositions: ['MCD', 'MC'], x: 36, y: 53, linksTo: ['mid_1', 'mid_2', 'mid_5', 'def_1', 'def_2'] },
    { slotId: 'mid_5', label: 'MCD', zone: 'MID', acceptedPositions: ['MCD', 'MC'], x: 64, y: 53, linksTo: ['mid_2', 'mid_3', 'mid_4', 'def_2', 'def_3'] },
    { slotId: 'def_1', label: 'DFC', zone: 'DEF', acceptedPositions: ['DFC', 'LI'], x: 24, y: 72, linksTo: ['mid_1', 'mid_4', 'def_2', 'gk_1'] },
    { slotId: 'def_2', label: 'DFC', zone: 'DEF', acceptedPositions: ['DFC'], x: 50, y: 73, linksTo: ['mid_4', 'mid_5', 'def_1', 'def_3', 'gk_1'] },
    { slotId: 'def_3', label: 'DFC', zone: 'DEF', acceptedPositions: ['DFC', 'LD'], x: 76, y: 72, linksTo: ['mid_3', 'mid_5', 'def_2', 'gk_1'] },
    { slotId: 'gk_1', label: 'PO', zone: 'GK', acceptedPositions: ['PO'], x: 50, y: 89, linksTo: ['def_1', 'def_2', 'def_3'] },
  ],
};

// ============================================================================
// EA SPORTS FC 27 DATABASE (NO COPYRIGHT PHOTOS - VECTOR SILHOUETTES)
// ============================================================================

export const FC27_PLAYERS_DB: FutPlayerCard[] = [
  // --- GOLD & TOTY SUPERSTARS ---
  {
    id: 'haaland_91',
    name: 'Erling Haaland',
    shortName: 'E. HAALAND',
    rating: 91,
    position: 'DC',
    zone: 'ATK',
    tier: 'gold',
    nation: 'Noruega',
    nationCode: 'NO',
    club: 'Manchester City',
    clubColors: ['#6CABDD', '#1C2C5B'],
    silhouette: 'tall_bun',
    skinTone: '#d4a373',
    hairColor: '#e9c46a',
    stats: { pac: 89, sho: 93, pas: 66, dri: 80, def: 45, phy: 88 },
  },
  {
    id: 'mbappe_92',
    name: 'Kylian Mbappé',
    shortName: 'K. MBAPPÉ',
    rating: 92,
    position: 'DC',
    zone: 'ATK',
    tier: 'gold',
    nation: 'Francia',
    nationCode: 'FR',
    club: 'Real Madrid',
    clubColors: ['#FFFFFF', '#FEBE10'],
    silhouette: 'buzz_cut',
    skinTone: '#6f4e37',
    hairColor: '#1a1a1a',
    stats: { pac: 97, sho: 90, pas: 80, dri: 92, def: 36, phy: 78 },
  },
  {
    id: 'salah_91',
    name: 'Mohamed Salah',
    shortName: 'M. SALAH',
    rating: 91,
    position: 'DC',
    zone: 'ATK',
    tier: 'gold',
    nation: 'Egipto',
    nationCode: 'EG',
    club: 'Liverpool FC',
    clubColors: ['#C8102E', '#F6EB61'],
    silhouette: 'afro_beard',
    skinTone: '#8d5524',
    hairColor: '#141414',
    stats: { pac: 91, sho: 87, pas: 82, dri: 90, def: 45, phy: 76 },
  },
  {
    id: 'messi_89',
    name: 'Lionel Messi',
    shortName: 'L. MESSI',
    rating: 89,
    position: 'MCO',
    zone: 'MID',
    tier: 'gold',
    nation: 'Argentina',
    nationCode: 'AR',
    club: 'Inter Miami / Barça Legend',
    clubColors: ['#A50044', '#004D98'],
    silhouette: 'messi_beard',
    skinTone: '#c68642',
    hairColor: '#221812',
    stats: { pac: 81, sho: 87, pas: 90, dri: 94, def: 33, phy: 64 },
  },
  {
    id: 'debruyne_90',
    name: 'Kevin De Bruyne',
    shortName: 'K. DE BRUYNE',
    rating: 90,
    position: 'MCO',
    zone: 'MID',
    tier: 'gold',
    nation: 'Bélgica',
    nationCode: 'BE',
    club: 'Manchester City',
    clubColors: ['#6CABDD', '#FFFFFF'],
    silhouette: 'short_swept',
    skinTone: '#e0ac69',
    hairColor: '#d4a359',
    stats: { pac: 72, sho: 85, pas: 94, dri: 87, def: 65, phy: 78 },
  },
  {
    id: 'vandijk_89',
    name: 'Virgil van Dijk',
    shortName: 'V. VAN DIJK',
    rating: 89,
    position: 'DFC',
    zone: 'DEF',
    tier: 'silver',
    nation: 'Países Bajos',
    nationCode: 'NL',
    club: 'Liverpool FC',
    clubColors: ['#C8102E', '#FFFFFF'],
    silhouette: 'high_fade',
    skinTone: '#8d5524',
    hairColor: '#111111',
    stats: { pac: 78, sho: 60, pas: 71, dri: 72, def: 89, phy: 86 },
  },
  {
    id: 'vinicius_91',
    name: 'Vinícius Jr.',
    shortName: 'VINÍCIUS JR',
    rating: 91,
    position: 'EI',
    zone: 'ATK',
    tier: 'gold',
    nation: 'Brasil',
    nationCode: 'BR',
    club: 'Real Madrid',
    clubColors: ['#FFFFFF', '#00529F'],
    silhouette: 'buzz_cut',
    skinTone: '#4a2e1b',
    hairColor: '#0c0c0c',
    stats: { pac: 95, sho: 84, pas: 81, dri: 93, def: 29, phy: 69 },
  },
  {
    id: 'bellingham_90',
    name: 'Jude Bellingham',
    shortName: 'J. BELLINGHAM',
    rating: 90,
    position: 'MC',
    zone: 'MID',
    tier: 'gold',
    nation: 'Inglaterra',
    nationCode: 'EN',
    club: 'Real Madrid',
    clubColors: ['#FFFFFF', '#FEBE10'],
    silhouette: 'short_swept',
    skinTone: '#6f4e37',
    hairColor: '#141414',
    stats: { pac: 80, sho: 86, pas: 83, dri: 88, def: 78, phy: 83 },
  },
  {
    id: 'rodri_91',
    name: 'Rodri Hernández',
    shortName: 'RODRI',
    rating: 91,
    position: 'MCD',
    zone: 'MID',
    tier: 'gold',
    nation: 'España',
    nationCode: 'ES',
    club: 'Manchester City',
    clubColors: ['#6CABDD', '#1C2C5B'],
    silhouette: 'short_swept',
    skinTone: '#c68642',
    hairColor: '#231709',
    stats: { pac: 66, sho: 80, pas: 86, dri: 84, def: 87, phy: 85 },
  },
  {
    id: 'yamal_89',
    name: 'Lamine Yamal',
    shortName: 'L. YAMAL',
    rating: 89,
    position: 'ED',
    zone: 'ATK',
    tier: 'gold',
    nation: 'España',
    nationCode: 'ES',
    club: 'FC Barcelona',
    clubColors: ['#004D98', '#A50044'],
    silhouette: 'curly_locks',
    skinTone: '#6f4e37',
    hairColor: '#121212',
    stats: { pac: 91, sho: 82, pas: 85, dri: 92, def: 34, phy: 63 },
  },
  {
    id: 'rudiger_88',
    name: 'Antonio Rüdiger',
    shortName: 'A. RÜDIGER',
    rating: 88,
    position: 'DFC',
    zone: 'DEF',
    tier: 'silver',
    nation: 'Alemania',
    nationCode: 'DE',
    club: 'Real Madrid',
    clubColors: ['#FFFFFF', '#FEBE10'],
    silhouette: 'high_fade',
    skinTone: '#3d2314',
    hairColor: '#090909',
    stats: { pac: 82, sho: 55, pas: 73, dri: 70, def: 86, phy: 86 },
  },
  {
    id: 'saliba_88',
    name: 'William Saliba',
    shortName: 'W. SALIBA',
    rating: 88,
    position: 'DFC',
    zone: 'DEF',
    tier: 'bronze',
    nation: 'Francia',
    nationCode: 'FR',
    club: 'Arsenal FC',
    clubColors: ['#EF0107', '#FFFFFF'],
    silhouette: 'buzz_cut',
    skinTone: '#5c3c24',
    hairColor: '#111111',
    stats: { pac: 82, sho: 48, pas: 74, dri: 76, def: 88, phy: 83 },
  },
  {
    id: 'valverde_89',
    name: 'Federico Valverde',
    shortName: 'F. VALVERDE',
    rating: 89,
    position: 'MC',
    zone: 'MID',
    tier: 'silver',
    nation: 'Uruguay',
    nationCode: 'UY',
    club: 'Real Madrid',
    clubColors: ['#FFFFFF', '#00529F'],
    silhouette: 'short_swept',
    skinTone: '#c68642',
    hairColor: '#1e1510',
    stats: { pac: 88, sho: 84, pas: 84, dri: 84, def: 80, phy: 85 },
  },
  {
    id: 'davies_86',
    name: 'Alphonso Davies',
    shortName: 'A. DAVIES',
    rating: 86,
    position: 'LI',
    zone: 'DEF',
    tier: 'bronze',
    nation: 'Canadá',
    nationCode: 'CA',
    club: 'Bayern München',
    clubColors: ['#DC052D', '#FFFFFF'],
    silhouette: 'high_fade',
    skinTone: '#3d2314',
    hairColor: '#0a0a0a',
    stats: { pac: 95, sho: 68, pas: 77, dri: 85, def: 76, phy: 77 },
  },
  {
    id: 'alexander_arnold_87',
    name: 'Trent Alexander-Arnold',
    shortName: 'T. ARNOLD',
    rating: 87,
    position: 'LD',
    zone: 'DEF',
    tier: 'silver',
    nation: 'Inglaterra',
    nationCode: 'EN',
    club: 'Liverpool FC',
    clubColors: ['#C8102E', '#FFFFFF'],
    silhouette: 'afro_beard',
    skinTone: '#6f4e37',
    hairColor: '#111111',
    stats: { pac: 76, sho: 74, pas: 91, dri: 82, def: 79, phy: 74 },
  },
  {
    id: 'courtois_90',
    name: 'Thibaut Courtois',
    shortName: 'T. COURTOIS',
    rating: 90,
    position: 'PO',
    zone: 'GK',
    tier: 'gold',
    nation: 'Bélgica',
    nationCode: 'BE',
    club: 'Real Madrid',
    clubColors: ['#10b981', '#FFFFFF'],
    silhouette: 'keeper_gloves',
    skinTone: '#d4a373',
    hairColor: '#261b12',
    stats: { pac: 85, sho: 89, pas: 76, dri: 90, def: 46, phy: 89 },
  },
  {
    id: 'alisson_89',
    name: 'Alisson Becker',
    shortName: 'ALISSON',
    rating: 89,
    position: 'PO',
    zone: 'GK',
    tier: 'silver',
    nation: 'Brasil',
    nationCode: 'BR',
    club: 'Liverpool FC',
    clubColors: ['#22c55e', '#14532d'],
    silhouette: 'messi_beard',
    skinTone: '#c68642',
    hairColor: '#24180e',
    stats: { pac: 86, sho: 85, pas: 85, dri: 89, def: 52, phy: 90 },
  },
  {
    id: 'pedri_88',
    name: 'Pedri González',
    shortName: 'PEDRI',
    rating: 88,
    position: 'MC',
    zone: 'MID',
    tier: 'bronze',
    nation: 'España',
    nationCode: 'ES',
    club: 'FC Barcelona',
    clubColors: ['#004D98', '#A50044'],
    silhouette: 'short_swept',
    skinTone: '#c68642',
    hairColor: '#1f1610',
    stats: { pac: 79, sho: 73, pas: 86, dri: 90, def: 72, phy: 70 },
  },
  {
    id: 'musiala_89',
    name: 'Jamal Musiala',
    shortName: 'J. MUSIALA',
    rating: 89,
    position: 'MCO',
    zone: 'MID',
    tier: 'gold',
    nation: 'Alemania',
    nationCode: 'DE',
    club: 'Bayern München',
    clubColors: ['#DC052D', '#FFFFFF'],
    silhouette: 'curly_locks',
    skinTone: '#8d5524',
    hairColor: '#17120e',
    stats: { pac: 85, sho: 82, pas: 83, dri: 93, def: 63, phy: 66 },
  },
  {
    id: 'kane_90',
    name: 'Harry Kane',
    shortName: 'H. KANE',
    rating: 90,
    position: 'DC',
    zone: 'ATK',
    tier: 'gold',
    nation: 'Inglaterra',
    nationCode: 'EN',
    club: 'Bayern München',
    clubColors: ['#DC052D', '#FFFFFF'],
    silhouette: 'short_swept',
    skinTone: '#e0ac69',
    hairColor: '#8c6239',
    stats: { pac: 69, sho: 93, pas: 84, dri: 83, def: 49, phy: 82 },
  },
  {
    id: 'dias_88',
    name: 'Rúben Dias',
    shortName: 'RÚBEN DIAS',
    rating: 88,
    position: 'DFC',
    zone: 'DEF',
    tier: 'silver',
    nation: 'Portugal',
    nationCode: 'PT',
    club: 'Manchester City',
    clubColors: ['#6CABDD', '#FFFFFF'],
    silhouette: 'short_swept',
    skinTone: '#c68642',
    hairColor: '#1f1610',
    stats: { pac: 67, sho: 39, pas: 70, dri: 69, def: 89, phy: 87 },
  },
  {
    id: 'hakimi_87',
    name: 'Achraf Hakimi',
    shortName: 'A. HAKIMI',
    rating: 87,
    position: 'LD',
    zone: 'DEF',
    tier: 'bronze',
    nation: 'Marruecos',
    nationCode: 'MA',
    club: 'Paris SG',
    clubColors: ['#004170', '#DA291C'],
    silhouette: 'high_fade',
    skinTone: '#a67346',
    hairColor: '#141414',
    stats: { pac: 92, sho: 75, pas: 80, dri: 82, def: 75, phy: 78 },
  },
  {
    id: 'theo_87',
    name: 'Theo Hernández',
    shortName: 'T. HERNÁNDEZ',
    rating: 87,
    position: 'LI',
    zone: 'DEF',
    tier: 'silver',
    nation: 'Francia',
    nationCode: 'FR',
    club: 'AC Milan',
    clubColors: ['#FB090B', '#000000'],
    silhouette: 'buzz_cut',
    skinTone: '#c68642',
    hairColor: '#d4a359',
    stats: { pac: 94, sho: 76, pas: 78, dri: 84, def: 79, phy: 86 },
  },
  {
    id: 'saka_88',
    name: 'Bukayo Saka',
    shortName: 'B. SAKA',
    rating: 88,
    position: 'ED',
    zone: 'ATK',
    tier: 'bronze',
    nation: 'Inglaterra',
    nationCode: 'EN',
    club: 'Arsenal FC',
    clubColors: ['#EF0107', '#FFFFFF'],
    silhouette: 'high_fade',
    skinTone: '#4a2e1b',
    hairColor: '#0e0e0e',
    stats: { pac: 86, sho: 83, pas: 83, dri: 88, def: 60, phy: 73 },
  },
];

// ============================================================================
// TACTICAL ACTIONS (MODALIDAD B: BATALLA TÁCTICA POR TURNOS)
// ============================================================================

export const TACTICAL_ACTIONS: TacticalAction[] = [
  {
    id: 'high_press',
    name: 'Presión Alta',
    category: 'defensive',
    iconName: 'press',
    description: 'Asfixia la salida de balón usando Físico y Ritmo para robar en campo rival.',
    primaryStat: 'phy',
    secondaryStat: 'pac',
    counteredBy: 'long_pass',
    baseBonus: 12,
  },
  {
    id: 'long_pass',
    name: 'Pase Largo',
    category: 'transition',
    iconName: 'long_pass',
    description: 'Cambio de orientación o balón filtrado al espacio rompiendo líneas de presión.',
    primaryStat: 'pas',
    secondaryStat: 'dri',
    counteredBy: 'hard_tackle',
    baseBonus: 6,
  },
  {
    id: 'shoot',
    name: 'Disparar',
    category: 'offensive',
    iconName: 'shoot',
    description: 'Remate potente o colocado a portería buscando batir al guardameta rival.',
    primaryStat: 'sho',
    secondaryStat: 'dri',
    counteredBy: 'hard_tackle',
    baseBonus: 10,
  },
  {
    id: 'hard_tackle',
    name: 'Entrada Fuerte',
    category: 'defensive',
    iconName: 'hard_tackle',
    description: 'Duelo defensivo al límite para cortar disparo o regate en zona crítica.',
    primaryStat: 'def',
    secondaryStat: 'phy',
    counteredBy: 'counter',
    baseBonus: 9,
  },
  {
    id: 'counter',
    name: 'Contraataque',
    category: 'offensive',
    iconName: 'counter',
    description: 'Transición eléctrica vertical explotando el Ritmo y Regate de tus extremos.',
    primaryStat: 'pac',
    secondaryStat: 'dri',
    counteredBy: 'high_press',
    baseBonus: 11,
  },
];

// ============================================================================
// DEFAULT PROTOTYPE LINEUP (MATCHING THE USER'S EXACT VISUAL DESIGN)
// ============================================================================

export function getInitialPrototypeLineup(): Record<string, FutPlayerCard> {
  const byId = (id: string) => FC27_PLAYERS_DB.find((p) => p.id === id) || FC27_PLAYERS_DB[0];
  return {
    // Top Attack Row
    atk_1: { ...byId('salah_91'), position: 'EI', tier: 'silver', rating: 91 },
    atk_2: { ...byId('salah_91'), position: 'DC', tier: 'gold', rating: 91 },
    atk_3: { ...byId('vandijk_89'), shortName: 'V. VAN DIJK', position: 'DC', tier: 'silver', rating: 88 },
    atk_4: { ...byId('saliba_88'), shortName: 'B. SAKA', position: 'ED', tier: 'bronze', rating: 85 },
    // Middle Row
    mid_1: { ...byId('debruyne_90'), position: 'MC', tier: 'silver', rating: 88 },
    mid_2: { ...byId('debruyne_90'), position: 'MCO', tier: 'gold', rating: 85 },
    mid_3: { ...byId('messi_89'), position: 'MC', tier: 'bronze', rating: 89 },
    // Defense Row
    def_1: { ...byId('salah_91'), position: 'LI', tier: 'silver', rating: 91 },
    def_2: { ...byId('vandijk_89'), position: 'DFC', tier: 'silver', rating: 88 },
    def_3: { ...byId('dias_88'), shortName: 'V. VAN DIJK', position: 'DFC', tier: 'silver', rating: 88 },
    def_4: { ...byId('davies_86'), shortName: 'V. VAN DIJK', position: 'LD', tier: 'bronze', rating: 89 },
    // Bottom Pivot / Sweeper Star
    gk_1: { ...byId('haaland_91'), position: 'DC', tier: 'gold', rating: 85 },
  };
}

export function getBrotherDefaultLineup(): Record<string, FutPlayerCard> {
  const byId = (id: string) => FC27_PLAYERS_DB.find((p) => p.id === id) || FC27_PLAYERS_DB[0];
  return {
    atk_1: byId('mbappe_92'),
    atk_2: byId('kane_90'),
    mid_1: byId('vinicius_91'),
    mid_2: byId('bellingham_90'),
    mid_3: byId('rodri_91'),
    mid_4: byId('yamal_89'),
    def_1: byId('theo_87'),
    def_2: byId('rudiger_88'),
    def_3: byId('saliba_88'),
    def_4: byId('hakimi_87'),
    gk_1: byId('courtois_90'),
  };
}

// ============================================================================
// MATHEMATICAL ENGINE: CHEMISTRY, SYNERGY & TURN SUCCESS PROBABILITY
// ============================================================================

export function calculateTeamChemistry(
  lineup: Record<string, FutPlayerCard>,
  formation: FormationType
): { totalChemistry: number; maxChemistry: number; activeLinks: Array<{ from: string; to: string; strength: 'strong' | 'normal' | 'weak' }> } {
  const slots = FORMATIONS[formation];
  const activeLinks: Array<{ from: string; to: string; strength: 'strong' | 'normal' | 'weak' }> = [];
  const visited = new Set<string>();
  let chemPoints = 0;

  for (const slot of slots) {
    const pA = lineup[slot.slotId];
    if (!pA) continue;

    for (const targetId of slot.linksTo) {
      const key = [slot.slotId, targetId].sort().join('--');
      if (visited.has(key)) continue;
      visited.add(key);

      const pB = lineup[targetId];
      if (!pB) continue;

      const sameClub = pA.club === pB.club;
      const sameNation = pA.nationCode === pB.nationCode;

      if (sameClub && sameNation) {
        activeLinks.push({ from: slot.slotId, to: targetId, strength: 'strong' });
        chemPoints += 3;
      } else if (sameClub || sameNation) {
        activeLinks.push({ from: slot.slotId, to: targetId, strength: 'strong' });
        chemPoints += 2.5;
      } else {
        activeLinks.push({ from: slot.slotId, to: targetId, strength: 'normal' });
        chemPoints += 1.6;
      }
    }
  }

  const normalized = Math.min(33, Math.round((chemPoints / Math.max(1, activeLinks.length * 2.2)) * 33));
  return {
    totalChemistry: Math.max(22, normalized),
    maxChemistry: 33,
    activeLinks,
  };
}

export function calculateActionSuccessChance(
  activeCard: FutPlayerCard,
  action: TacticalAction,
  opponentLineup: Record<string, FutPlayerCard>,
  teamChemistry: number,
  tactics: TeamTacticsConfig
): number {
  const oppCards = Object.values(opponentLineup);
  const avgOppDef =
    oppCards.reduce((acc, c) => acc + (c.stats.def + c.stats.phy) / 2, 0) / Math.max(1, oppCards.length);

  const playerPower =
    activeCard.stats[action.primaryStat] * 0.65 +
    activeCard.stats[action.secondaryStat] * 0.35;

  const chemBonus = ((teamChemistry - 20) / 13) * 6;
  const mentalityMod =
    tactics.mentality === 'ultra_attacking' && action.category === 'offensive'
      ? 5
      : tactics.mentality === 'defensive' && action.category === 'defensive'
      ? 5
      : 2;

  const rawDiff = playerPower - avgOppDef + action.baseBonus + chemBonus + mentalityMod;
  const probability = Math.round(50 + rawDiff * 0.85);
  return Math.max(24, Math.min(94, probability));
}

export function resolveTacticalTurnDuel(
  myCard: FutPlayerCard,
  myAction: TacticalAction,
  opponentCard: FutPlayerCard,
  opponentAction: TacticalAction,
  teamChemistry: number,
  tactics: TeamTacticsConfig,
  currentMinute: number
): {
  won: boolean;
  isGoal: boolean;
  isShot: boolean;
  successChance: number;
  diceRoll: number;
  eventLog: MatchEventLog;
} {
  const baseChance = calculateActionSuccessChance(
    myCard,
    myAction,
    { opp: opponentCard },
    teamChemistry,
    tactics
  );

  // Tactical counter modifier
  const isCountered = myAction.counteredBy === opponentAction.id;
  const iCounteredHim = opponentAction.counteredBy === myAction.id;
  const finalChance = Math.max(
    18,
    Math.min(95, baseChance + (iCounteredHim ? 12 : 0) - (isCountered ? 12 : 0))
  );

  // Virtual D100 Dice Roll
  const diceRoll = Math.floor(Math.random() * 100) + 1;
  const won = diceRoll <= finalChance;

  let isGoal = false;
  let isShot = false;
  let narrative = '';

  if (won) {
    if (myAction.id === 'shoot' || myAction.id === 'counter') {
      isShot = true;
      const goalThreshold = myAction.id === 'shoot' ? 42 : 55;
      isGoal = diceRoll <= goalThreshold;
      if (isGoal) {
        narrative = `Min ${currentMinute}: ¡GOLAZO de ${myCard.shortName} (${myAction.name}) superando a ${opponentCard.shortName}!`;
      } else {
        narrative = `Min ${currentMinute}: Disparo peligroso de ${myCard.shortName} que exige parada monumental ante ${opponentCard.shortName}.`;
      }
    } else if (myAction.id === 'long_pass') {
      isShot = diceRoll <= 35;
      isGoal = diceRoll <= 16;
      narrative = isGoal
        ? `Min ${currentMinute}: ¡GOL tras asistencia magistral de ${myCard.shortName} rompiendo la línea de ${opponentCard.shortName}!`
        : `Min ${currentMinute}: ${myCard.shortName} conecta un Pase Largo milimétrico (${finalChance}% éxito) ganando metros clave.`;
    } else {
      narrative = `Min ${currentMinute}: ${myCard.shortName} ejecuta ${myAction.name} con éxito (${finalChance}%) y recupera la posesión ante ${opponentCard.shortName}.`;
    }
  } else {
    isShot = opponentAction.id === 'shoot' || opponentAction.id === 'counter';
    isGoal = isShot && diceRoll >= 86;
    if (isGoal) {
      narrative = `Min ${currentMinute}: ¡GOL RIVAL! ${opponentCard.shortName} castiga al contraataque tras interceptar a ${myCard.shortName}.`;
    } else {
      narrative = `Min ${currentMinute}: Duelo ganado por ${opponentCard.shortName} (${opponentAction.name}) neutralizando a ${myCard.shortName}.`;
    }
  }

  return {
    won,
    isGoal,
    isShot,
    successChance: finalChance,
    diceRoll,
    eventLog: {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      minute: currentMinute,
      type: isGoal ? 'goal' : isShot ? 'shot' : 'tactical_duel',
      team: won ? 'my' : 'bro',
      text: narrative,
      highlight: isGoal,
      duelDetails: {
        attackerName: myCard.shortName,
        defenderName: opponentCard.shortName,
        actionName: myAction.name,
        successChance: finalChance,
        roll: diceRoll,
        won,
      },
    },
  };
}

// ============================================================================
// MODALIDAD A: SIMULACIÓN ESTADÍSTICA ASÍNCRONA (AUTO-BATTLER TICK)
// ============================================================================

export function simulateStatisticalMinuteTick(
  minute: number,
  myLineup: Record<string, FutPlayerCard>,
  broLineup: Record<string, FutPlayerCard>,
  myTactics: TeamTacticsConfig
): {
  possessionDelta: number;
  event?: MatchEventLog;
  myShotAdded: boolean;
  broShotAdded: boolean;
  myGoalAdded: boolean;
  broGoalAdded: boolean;
} {
  const myPlayers = Object.values(myLineup);
  const broPlayers = Object.values(broLineup);

  const myMidAvg =
    myPlayers.reduce((s, p) => s + p.stats.pas * 0.5 + p.stats.dri * 0.5, 0) / Math.max(1, myPlayers.length);
  const broMidAvg =
    broPlayers.reduce((s, p) => s + p.stats.pas * 0.5 + p.stats.dri * 0.5, 0) / Math.max(1, broPlayers.length);

  const pressBonus = myTactics.pressingStyle === 'high_press' || myTactics.pressingStyle === 'gegenpress' ? 2.5 : 0;
  const possessionDelta = (myMidAvg + pressBonus - broMidAvg) * 0.12 + (Math.random() - 0.48) * 1.4;

  // Determine if a notable statistical event happens this minute
  const roll = Math.random() * 100;
  if (roll > 22) {
    return {
      possessionDelta,
      myShotAdded: false,
      broShotAdded: false,
      myGoalAdded: false,
      broGoalAdded: false,
    };
  }

  const isMyTeamAttacking = Math.random() * 100 < 54 + (myMidAvg - broMidAvg);
  const attackers = (isMyTeamAttacking ? myPlayers : broPlayers).filter(
    (p) => p.zone === 'ATK' || p.zone === 'MID'
  );
  const defenders = (isMyTeamAttacking ? broPlayers : myPlayers).filter(
    (p) => p.zone === 'DEF' || p.zone === 'GK'
  );

  const attacker = attackers[Math.floor(Math.random() * attackers.length)] || myPlayers[0];
  const assister = attackers.find((p) => p.id !== attacker.id) || attacker;
  const defender = defenders[Math.floor(Math.random() * defenders.length)] || broPlayers[0];

  const atkRating = attacker.stats.sho * 0.6 + attacker.stats.dri * 0.4;
  const defRating = defender.stats.def * 0.6 + defender.stats.phy * 0.4;
  const duelAdvantage = atkRating - defRating + (Math.random() * 30 - 15);

  if (duelAdvantage > 14) {
    // GOAL!
    return {
      possessionDelta,
      myShotAdded: isMyTeamAttacking,
      broShotAdded: !isMyTeamAttacking,
      myGoalAdded: isMyTeamAttacking,
      broGoalAdded: !isMyTeamAttacking,
      event: {
        id: `auto_${minute}_${Math.random().toString(36).slice(2, 6)}`,
        minute,
        type: 'goal',
        team: isMyTeamAttacking ? 'my' : 'bro',
        text: `Min ${minute}: ¡GOL de ${attacker.shortName} tras pase filtrado de ${assister.shortName}!`,
        highlight: true,
      },
    };
  } else if (duelAdvantage > 2) {
    // Shot on target
    return {
      possessionDelta,
      myShotAdded: isMyTeamAttacking,
      broShotAdded: !isMyTeamAttacking,
      myGoalAdded: false,
      broGoalAdded: false,
      event: {
        id: `auto_${minute}_${Math.random().toString(36).slice(2, 6)}`,
        minute,
        type: 'shot',
        team: isMyTeamAttacking ? 'my' : 'bro',
        text: `Min ${minute}: Remate potente de ${attacker.shortName} despejado in extremis por ${defender.shortName}.`,
      },
    };
  } else {
    // Defensive interception
    return {
      possessionDelta,
      myShotAdded: false,
      broShotAdded: false,
      myGoalAdded: false,
      broGoalAdded: false,
      event: {
        id: `auto_${minute}_${Math.random().toString(36).slice(2, 6)}`,
        minute,
        type: 'tackle',
        team: isMyTeamAttacking ? 'bro' : 'my',
        text: `Min ${minute}: Corte providencial de ${defender.shortName} anticipando el desmarque de ${attacker.shortName}.`,
      },
    };
  }
}
