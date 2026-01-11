import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserState, Rank, AnimeCard, CardRarity, LeaderboardEntry } from '../types';
import { INITIAL_USER_STATE, RANK_THRESHOLDS, XP_PER_LEVEL, MAX_HEARTS, HEART_REGEN_TIME } from '../constants';
import { playSound } from './audio';

interface GameContextType {
  user: UserState;
  addXP: (amount: number) => void;
  addCardXP: (cardId: string, amount: number) => void;
  useBoosterOnCard: (cardId: string) => boolean;
  gainBoosters: (amount: number) => void;
  loseHeart: () => void;
  gainDiamonds: (amount: number) => void;
  spendDiamonds: (amount: number) => boolean;
  restoreHearts: () => void;
  refillHeartsWithDiamonds: () => boolean;
  purchaseBattlePass: () => void;
  setTheme: (themeId: string) => void;
  unlockTheme: (themeId: string) => void;
  setNickname: (name: string) => void;
  setPersonality: (match: any) => void;
  updateSettings: (settings: Partial<UserState['settings']>) => void;
  completeQuiz: (quizId: string) => void;
  addCard: (card: AnimeCard) => void;
  resetGame: () => void;
  timeToNextHeart: number;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const BOT_NAMES = ["Kirito_99", "Asuna_X", "Zoro_Lost", "Sasuke_U", "Luffy_Gear6", "Goku_UI", "Mikasa_A", "Eren_J", "Naruto_Hokage", "Ichigo_Hollow", "Saitama_One", "Killua_Z"];

const generateLeaderboard = (): LeaderboardEntry[] => {
  const bots: LeaderboardEntry[] = [];
  for (let i = 0; i < 150; i++) {
    const randomXp = Math.floor(Math.random() * 150000);
    const botName = `${BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]}_${Math.floor(Math.random() * 999)}`;
    let rank = Rank.ROOKIE;
    const level = Math.floor(randomXp / XP_PER_LEVEL);
    for (const threshold of RANK_THRESHOLDS) { if (level >= threshold.level) rank = threshold.rank; }
    bots.push({ id: `bot_${i}`, name: botName, xp: randomXp, rank: rank, isBot: true });
  }
  return bots;
};

const DB_VERSION = 'amq_database_v12';
const CARD_XP_BASE = 1000;

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserState>(() => {
    const saved = localStorage.getItem(DB_VERSION);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
           return { 
            ...INITIAL_USER_STATE, 
            ...parsed, 
            inventory: Array.isArray(parsed.inventory) ? parsed.inventory : [],
            boosters: parsed.boosters !== undefined ? Number(parsed.boosters) : 5,
            unlockedThemes: Array.isArray(parsed.unlockedThemes) ? parsed.unlockedThemes : INITIAL_USER_STATE.unlockedThemes,
            leaderboard: Array.isArray(parsed.leaderboard) && parsed.leaderboard.length ? parsed.leaderboard : generateLeaderboard() 
          };
        }
      } catch (e) { 
        console.error("Corruption JSON détectée, réinitialisation partielle des données."); 
      }
    }
    return { ...INITIAL_USER_STATE, boosters: 5 };
  });

  const [timeToNextHeart, setTimeToNextHeart] = useState(0);

  useEffect(() => { 
    try {
      localStorage.setItem(DB_VERSION, JSON.stringify(user)); 
    } catch (e) {
      console.warn("Dépassement de capacité LocalStorage.");
    }
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      setUser(prev => {
        if (prev.hearts >= MAX_HEARTS) return prev;
        const now = Date.now();
        const elapsed = now - (prev.lastHeartUpdateTime || now);
        if (elapsed >= HEART_REGEN_TIME) {
          const newHearts = Math.min(MAX_HEARTS, prev.hearts + 1);
          return { ...prev, hearts: newHearts, lastHeartUpdateTime: newHearts === MAX_HEARTS ? now : prev.lastHeartUpdateTime + HEART_REGEN_TIME };
        }
        setTimeToNextHeart(HEART_REGEN_TIME - elapsed);
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const addXP = useCallback((amount: number) => {
    setUser(prev => {
      const newTotalXp = prev.totalXp + amount;
      let newLevelXp = prev.xp + amount;
      let newLevel = prev.level;
      while (newLevelXp >= XP_PER_LEVEL) { newLevelXp -= XP_PER_LEVEL; newLevel++; playSound('levelUp', prev.settings.volume); }
      let newRank = prev.rank;
      for (const threshold of RANK_THRESHOLDS) { if (newLevel >= threshold.level) newRank = threshold.rank; }
      return { ...prev, xp: newLevelXp, totalXp: newTotalXp, level: newLevel, rank: newRank };
    });
  }, []);

  const addCardXP = useCallback((cardId: string, amount: number) => {
    setUser(prev => ({
      ...prev,
      inventory: prev.inventory.map(card => {
        if (card.id !== cardId) return card;
        let newXp = card.currentXp + amount;
        let newLevel = card.level;
        let newXpToNext = card.xpToNextLevel;
        while (newXp >= newXpToNext) {
          newXp -= newXpToNext;
          newLevel++;
          newXpToNext = Math.floor(CARD_XP_BASE * Math.pow(1.2, newLevel - 1));
          playSound('success', prev.settings.volume);
        }
        const growth = 1 + (newLevel - 1) * 0.05;
        return { 
          ...card, 
          currentXp: newXp, 
          level: newLevel, 
          xpToNextLevel: newXpToNext,
          stats: {
            power: Math.floor(card.baseStats.power * growth),
            speed: Math.floor(card.baseStats.speed * growth),
            intelligence: Math.floor(card.baseStats.intelligence * growth),
            energy: Math.floor(card.baseStats.energy * growth),
          } 
        };
      })
    }));
  }, []);

  const useBoosterOnCard = useCallback((cardId: string): boolean => {
    let success = false;
    setUser(prev => {
      if (prev.boosters > 0) {
        success = true;
        const newState = { ...prev, boosters: prev.boosters - 1 };
        newState.inventory = newState.inventory.map(card => {
          if (card.id !== cardId) return card;
          let newXp = card.currentXp + 500;
          let newLevel = card.level;
          let newXpToNext = card.xpToNextLevel;
          while (newXp >= newXpToNext) {
            newXp -= newXpToNext;
            newLevel++;
            newXpToNext = Math.floor(CARD_XP_BASE * Math.pow(1.2, newLevel - 1));
          }
          const growth = 1 + (newLevel - 1) * 0.05;
          return { ...card, currentXp: newXp, level: newLevel, xpToNextLevel: newXpToNext, stats: { power: Math.floor(card.baseStats.power * growth), speed: Math.floor(card.baseStats.speed * growth), intelligence: Math.floor(card.baseStats.intelligence * growth), energy: Math.floor(card.baseStats.energy * growth) } };
        });
        playSound('success', prev.settings.volume);
        return newState;
      }
      return prev;
    });
    return success;
  }, []);

  const gainBoosters = useCallback((amount: number) => {
    setUser(prev => ({ ...prev, boosters: prev.boosters + amount }));
    playSound('success', user.settings.volume);
  }, [user.settings.volume]);

  const addCard = useCallback((card: AnimeCard) => {
    setUser(prev => ({ ...prev, inventory: [...prev.inventory, card] }));
  }, []);

  const refillHeartsWithDiamonds = (): boolean => {
    if (user.diamonds >= 30) {
      setUser(prev => ({ ...prev, hearts: MAX_HEARTS, diamonds: prev.diamonds - 30 }));
      playSound('success', user.settings.volume);
      return true;
    }
    return false;
  };

  const setPersonality = (match: any) => setUser(prev => ({ ...prev, personalityMatch: match }));
  const loseHeart = () => setUser(prev => ({ ...prev, hearts: Math.max(0, prev.hearts - 1), lastHeartUpdateTime: prev.hearts === MAX_HEARTS ? Date.now() : prev.lastHeartUpdateTime }));
  const gainDiamonds = (amount: number) => { setUser(prev => ({ ...prev, diamonds: prev.diamonds + amount })); playSound('diamonds', user.settings.volume); };
  
  const spendDiamonds = (amount: number): boolean => {
    let success = false;
    setUser(prev => {
      if (prev.diamonds >= amount) { success = true; return { ...prev, diamonds: prev.diamonds - amount }; }
      return prev;
    });
    return success;
  };

  const restoreHearts = () => setUser(prev => ({ ...prev, hearts: MAX_HEARTS }));
  const purchaseBattlePass = () => setUser(prev => ({ ...prev, hasBattlePass: true }));
  const setTheme = (theme: string) => setUser(prev => ({ ...prev, theme }));
  const unlockTheme = (themeId: string) => setUser(prev => ({ ...prev, unlockedThemes: Array.from(new Set([...prev.unlockedThemes, themeId])) }));
  const setNickname = (nickname: string) => setUser(prev => ({ ...prev, nickname }));
  const updateSettings = (newSettings: Partial<UserState['settings']>) => setUser(prev => ({ ...prev, settings: { ...prev.settings, ...newSettings } }));
  const completeQuiz = (quizId: string) => setUser(prev => ({ ...prev, completedQuizzes: [...new Set([...prev.completedQuizzes, quizId])] }));
  
  const resetGame = () => { localStorage.clear(); window.location.reload(); };

  return React.createElement(GameContext.Provider, { 
    value: { user, addXP, addCardXP, useBoosterOnCard, gainBoosters, loseHeart, gainDiamonds, spendDiamonds, restoreHearts, refillHeartsWithDiamonds, purchaseBattlePass, setTheme, unlockTheme, setNickname, setPersonality, updateSettings, completeQuiz, addCard, resetGame, timeToNextHeart } 
  }, children);
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
};