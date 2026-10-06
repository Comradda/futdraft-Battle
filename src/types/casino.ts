export type GameType = 'lobby' | 'conquian' | 'blackjack' | 'roulette' | 'poker';

export type PersonalityType = 'neutral' | 'burlona' | 'desafiante' | 'amigable';

export type TableTheme = 'emerald' | 'royal_blue' | 'crimson' | 'obsidian';

export type CardBackTheme = 'dragon_gold' | 'aztec_royal' | 'cyberpunk' | 'classic_red';

export type CrupierMood = 'neutral' | 'smirk' | 'laughing' | 'challenging' | 'impressed' | 'thinking' | 'celebrating';

export interface CrupierSpeech {
  text: string;
  mood: CrupierMood;
  audioKey?: string;
  duration?: number;
  soundPitch?: number;
}

export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  totalProfit: number;
  bestWin: number;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  bankroll: number;
  weeklyScore: number;
  tableTheme: TableTheme;
  cardBackTheme: CardBackTheme;
  crupierPersonality: PersonalityType;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  stats: {
    conquian: UserStats;
    blackjack: UserStats;
    roulette: UserStats;
    poker: UserStats;
  };
}

export interface LeaderboardPlayer {
  rank: number;
  id: string;
  name: string;
  avatar: string;
  weeklyScore: number;
  badge?: string;
  isCurrentUser?: boolean;
}

// Standard 52-card Deck Types
export type StandardSuit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type StandardRank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface StandardCard {
  id: string;
  suit: StandardSuit;
  rank: StandardRank;
  value: number; // For blackjack: 1-11; for poker: 2-14
  color: 'red' | 'black';
  faceUp?: boolean;
}

// Spanish 40-card Deck Types (Conquian)
export type SpanishSuit = 'oros' | 'copas' | 'espadas' | 'bastos';
export type SpanishRank = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '10' | '11' | '12'; // 10=Sota, 11=Caballo, 12=Rey

export interface SpanishCard {
  id: string;
  suit: SpanishSuit;
  rank: SpanishRank;
  numValue: number; // 1 to 10 sequence value: 1,2,3,4,5,6,7, 8(for sota), 9(caballo), 10(rey)
  name: string;
  faceUp?: boolean;
}

// Roulette Types
export type BetType = 
  | 'straight' 
  | 'split' 
  | 'street' 
  | 'corner' 
  | 'line' 
  | 'dozen1' | 'dozen2' | 'dozen3' 
  | 'col1' | 'col2' | 'col3' 
  | 'red' | 'black' 
  | 'even' | 'odd' 
  | 'low' | 'high';

export interface RouletteBet {
  type: BetType;
  numbers: number[];
  amount: number;
  chipColor?: string;
}

export interface RouletteHistoryItem {
  number: number;
  color: 'red' | 'black' | 'green';
}
