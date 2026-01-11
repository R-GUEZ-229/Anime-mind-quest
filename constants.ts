
import { Rank, UserState, Achievement } from './types';

export const MAX_HEARTS = 5;
export const HEART_REGEN_TIME = 60000;

export const INITIAL_USER_STATE: UserState = {
  nickname: 'USER_NODE_01',
  level: 1,
  totalXp: 0,
  xp: 0,
  hearts: MAX_HEARTS,
  lastHeartUpdateTime: Date.now(),
  diamonds: 50,
  rank: Rank.ROOKIE,
  completedQuizzes: [],
  hasBattlePass: false,
  theme: 'default',
  unlockedThemes: ['default', 'neon'],
  leaderboard: [],
  unlockedAchievements: [],
  inventory: [],
  // Initialize with 5 boosters as per gameStore logic
  boosters: 5,
  settings: {
    volume: 0.5,
    vfxEnabled: true,
    notificationsEnabled: true
  }
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'acc_1', title: 'Aspirant', description: 'Atteindre le niveau 5', icon: '🌱', requirement: 5, type: 'level' },
  { id: 'acc_2', title: 'Chasseur de Primes', description: 'Gagner 1000 diamants', icon: '💰', requirement: 1000, type: 'diamonds' },
  { id: 'acc_3', title: 'Expert des Archives', description: 'Compléter 50 quiz', icon: '📚', requirement: 50, type: 'quizzes' },
  { id: 'acc_4', title: 'Dieu de l\'Anime', description: 'Atteindre 100,000 XP total', icon: '⚡', requirement: 100000, type: 'xp' },
];

export const RANK_THRESHOLDS = [
  { level: 0, rank: Rank.ROOKIE },
  { level: 10, rank: Rank.OTAKU },
  { level: 25, rank: Rank.SHINOBI },
  { level: 50, rank: Rank.LEGEND },
  { level: 80, rank: Rank.MYTHIC }
];

export const XP_PER_LEVEL = 500;
