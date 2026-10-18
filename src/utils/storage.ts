import type { UserProfile, LeaderboardPlayer } from '../types/casino';

const STORAGE_KEY = 'ios_casino_royale_user';

export const INITIAL_USER: UserProfile = {
  id: 'player_me',
  name: 'Jugador VIP',
  avatar: 'VIP',
  bankroll: 1000, // 1000 pesos iniciales
  weeklyScore: 1000,
  tableTheme: 'emerald',
  cardBackTheme: 'dragon_gold',
  crupierPersonality: 'burlona',
  soundEnabled: true,
  hapticsEnabled: true,
  stats: {
    futdraft: { gamesPlayed: 0, gamesWon: 0, totalProfit: 0, bestWin: 0 },
    conquian: { gamesPlayed: 0, gamesWon: 0, totalProfit: 0, bestWin: 0 },
    blackjack: { gamesPlayed: 0, gamesWon: 0, totalProfit: 0, bestWin: 0 },
    roulette: { gamesPlayed: 0, gamesWon: 0, totalProfit: 0, bestWin: 0 },
    poker: { gamesPlayed: 0, gamesWon: 0, totalProfit: 0, bestWin: 0 },
  },
};

export function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...INITIAL_USER,
        ...parsed,
        stats: {
          futdraft: { ...INITIAL_USER.stats.futdraft!, ...(parsed.stats?.futdraft || {}) },
          conquian: { ...INITIAL_USER.stats.conquian, ...(parsed.stats?.conquian || {}) },
          blackjack: { ...INITIAL_USER.stats.blackjack, ...(parsed.stats?.blackjack || {}) },
          roulette: { ...INITIAL_USER.stats.roulette, ...(parsed.stats?.roulette || {}) },
          poker: { ...INITIAL_USER.stats.poker, ...(parsed.stats?.poker || {}) },
        },
      };
    }
  } catch (e) {
    console.error('Error loading profile', e);
  }
  return INITIAL_USER;
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving profile', e);
  }
}

const PEER_KEY = 'casino_peer_player';

export function getPeerPlayer(): Partial<LeaderboardPlayer> | null {
  try {
    const raw = localStorage.getItem(PEER_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading peer profile', e);
  }
  return null;
}

export function savePeerPlayer(peer: Partial<LeaderboardPlayer>): void {
  try {
    localStorage.setItem(PEER_KEY, JSON.stringify(peer));
  } catch (e) {
    console.error('Error saving peer profile', e);
  }
}

// 7-Day Consecutive Daily Reward Tier System
export const DAILY_REWARD_TIERS = [500, 750, 1000, 1500, 2000, 2500, 5000];

export function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function canClaimDailyReward(profile: UserProfile): boolean {
  const today = getTodayDateString();
  return profile.lastDailyRewardDate !== today;
}

export function claimDailyReward(profile: UserProfile): {
  updatedProfile: UserProfile;
  rewardAmount: number;
  streak: number;
  isJackpot: boolean;
} {
  const today = getTodayDateString();
  let currentStreak = profile.dailyStreak || 0;

  // Check if consecutive day
  if (profile.lastDailyRewardDate) {
    const lastDate = new Date(profile.lastDailyRewardDate);
    const currentDate = new Date(today);
    const diffDays = Math.round((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      currentStreak += 1;
    } else if (diffDays > 1) {
      currentStreak = 1; // streak reset
    }
  } else {
    currentStreak = 1;
  }

  if (currentStreak > 7) currentStreak = 1;

  const rewardAmount = DAILY_REWARD_TIERS[currentStreak - 1] || 500;
  const isJackpot = currentStreak === 7;

  const updatedProfile: UserProfile = {
    ...profile,
    bankroll: profile.bankroll + rewardAmount,
    weeklyScore: profile.weeklyScore + Math.floor(rewardAmount / 2),
    lastDailyRewardDate: today,
    dailyStreak: currentStreak,
  };

  saveUserProfile(updatedProfile);

  return {
    updatedProfile,
    rewardAmount,
    streak: currentStreak,
    isJackpot,
  };
}

// Returns the tournament leaderboard containing ONLY real players (user and brother/friends)
export function getWeeklyLeaderboard(currentUser: UserProfile): LeaderboardPlayer[] {
  const peer = getPeerPlayer();
  const allPlayers: Omit<LeaderboardPlayer, 'rank'>[] = [
    {
      id: currentUser.id,
      name: currentUser.name,
      avatar: currentUser.avatar,
      photoUrl: currentUser.photoUrl,
      weeklyScore: currentUser.weeklyScore,
      isCurrentUser: true,
      badge: 'Tú',
    },
  ];

  // If brother/peer has connected, include his real score and profile
  if (peer && peer.id && peer.id !== currentUser.id) {
    allPlayers.push({
      id: peer.id,
      name: peer.name || 'Hermano VIP',
      avatar: peer.avatar || 'HER',
      photoUrl: peer.photoUrl,
      weeklyScore: peer.weeklyScore ?? 1000,
      isCurrentUser: false,
      isPeer: true,
      badge: 'Hermano',
    });
  }

  // Sort by weeklyScore descending
  allPlayers.sort((a, b) => b.weeklyScore - a.weeklyScore);

  return allPlayers.map((player, index) => ({
    ...player,
    rank: index + 1,
    isCurrentUser: player.id === currentUser.id,
  }));
}

// Format currency
export function formatMoney(amount: number): string {
  return `$${amount.toLocaleString('es-MX')} MXN`;
}
