import type { UserProfile, LeaderboardPlayer } from '../types/casino';

const STORAGE_KEY = 'ios_casino_royale_user';

export const INITIAL_USER: UserProfile = {
  id: 'player_me',
  name: 'Jugador VIP',
  avatar: '👑',
  bankroll: 1000, // 1000 pesos iniciales como se solicitó
  weeklyScore: 1000,
  tableTheme: 'emerald',
  cardBackTheme: 'dragon_gold',
  crupierPersonality: 'burlona',
  soundEnabled: true,
  hapticsEnabled: true,
  stats: {
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
      return { ...INITIAL_USER, ...parsed };
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

// Generate realistic dynamic weekly tournament leaderboard
export function getWeeklyLeaderboard(currentUser: UserProfile): LeaderboardPlayer[] {
  const bots: Omit<LeaderboardPlayer, 'rank' | 'isCurrentUser'>[] = [
    { id: 'bot_1', name: 'Don Aurelio', avatar: '🎩', weeklyScore: 48500, badge: '🏆 Maestro' },
    { id: 'bot_2', name: 'La Matadora', avatar: '💃', weeklyScore: 34200, badge: '🔥 En Racha' },
    { id: 'bot_3', name: 'El As del Norte', avatar: '🤠', weeklyScore: 26800, badge: '⭐ Experto' },
    { id: 'bot_4', name: 'Sultán Poker', avatar: '🪙', weeklyScore: 19400 },
    { id: 'bot_5', name: 'Sofia Blackjack', avatar: '🎯', weeklyScore: 14750 },
    { id: 'bot_6', name: 'Capi Conquian', avatar: '🃏', weeklyScore: 11200 },
    { id: 'bot_7', name: 'Lucky Strike', avatar: '🎲', weeklyScore: 8900 },
    { id: 'bot_8', name: 'Ruleta Rusa', avatar: '🎰', weeklyScore: 6300 },
    { id: 'bot_9', name: 'Gato Negro', avatar: '🐈‍⬛', weeklyScore: 4100 },
    { id: 'bot_10', name: 'El Principiante', avatar: '🍀', weeklyScore: 1500 },
  ];

  const allPlayers = [
    ...bots,
    {
      id: currentUser.id,
      name: currentUser.name,
      avatar: currentUser.avatar,
      weeklyScore: currentUser.weeklyScore,
      isCurrentUser: true,
      badge: '📍 Tú',
    },
  ];

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
