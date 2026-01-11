
export type QuizType = 'image' | 'fusion' | 'scrambled' | 'input';

export interface Quiz {
  id: string;
  type: QuizType;
  difficulty: number;
  images: string[];
  question: string;
  choices?: string[];
  answer: string;
  acceptedAnswers?: string[];
  xp: number;
}

export type CardRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Divine' | 'Mythic';

export interface AnimeCard {
  id: string;
  characterName: string;
  anime: string;
  rarity: CardRarity;
  baseStats: {
    power: number;
    speed: number;
    intelligence: number;
    energy: number;
  };
  stats: {
    power: number;
    speed: number;
    intelligence: number;
    energy: number;
  };
  imageUrl: string;
  level: number;
  currentXp: number;
  xpToNextLevel: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  xp: number;
  rank: Rank | string;
  isBot: boolean;
}

export interface ShopOffer {
  id: string;
  title: string;
  price: number;
  isRealMoney: boolean;
  description: string;
  content: {
    diamonds?: number;
    cards?: number;
    guaranteedRarity?: CardRarity;
    themeId?: string;
  };
}

export enum Rank {
  ROOKIE = 'Rookie',
  OTAKU = 'Otaku',
  SHINOBI = 'Shinobi',
  LEGEND = 'Legend',
  MYTHIC = 'Mythique',
  GOD = 'Dieu',
  OUTERVERSAL = 'Entité Outherversal',
  INFINITE_ERROR = 'Erreur Infini'
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement: number;
  type: 'level' | 'diamonds' | 'quizzes' | 'xp';
}

export interface PersonalityOption {
  text: string;
  traits: Record<string, number>;
}

export interface PersonalityQuestion {
  id: string;
  question: string;
  options: PersonalityOption[];
}

export interface UserState {
  nickname: string;
  level: number;
  totalXp: number;
  xp: number;
  hearts: number;
  lastHeartUpdateTime: number;
  diamonds: number;
  rank: Rank;
  completedQuizzes: string[];
  personalityMatch?: any;
  hasBattlePass: boolean;
  theme: string;
  unlockedThemes: string[];
  leaderboard: LeaderboardEntry[];
  unlockedAchievements: string[];
  inventory: AnimeCard[];
  boosters: number;
  settings: {
    volume: number;
    vfxEnabled: boolean;
    notificationsEnabled: boolean;
  };
}
