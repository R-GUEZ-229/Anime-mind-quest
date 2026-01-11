
import React from 'react';
import { useGame } from '../lib/gameStore';
import { ACHIEVEMENTS } from '../constants';

const Achievements: React.FC = () => {
  const { user } = useGame();

  return (
    <div className="pt-24 px-6 min-h-screen max-w-4xl mx-auto page-transition bg-black">
      <div className="mb-12">
        <h1 className="text-5xl font-orbitron font-black text-white italic tracking-tighter">MEDAL <span className="text-purple-500">CABINET</span></h1>
        <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Archives de vos prouesses neurales</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ACHIEVEMENTS.map(ach => {
          const isUnlocked = user.unlockedAchievements.includes(ach.id);
          let progress = 0;
          if (ach.type === 'xp') progress = (user.totalXp / ach.requirement) * 100;
          if (ach.type === 'level') progress = (user.level / ach.requirement) * 100;
          if (ach.type === 'quizzes') progress = (user.completedQuizzes.length / ach.requirement) * 100;
          if (ach.type === 'diamonds') progress = (user.diamonds / ach.requirement) * 100;
          
          progress = Math.min(100, progress);

          return (
            <div key={ach.id} className={`glass-panel p-8 rounded-sm relative overflow-hidden border ${isUnlocked ? 'border-purple-500/50 bg-purple-500/5' : 'border-white/5 grayscale opacity-60'}`}>
              <div className="flex gap-6 items-center">
                <span className="text-5xl">{ach.icon}</span>
                <div className="flex-1">
                  <h3 className="text-xl font-orbitron font-black italic">{ach.title}</h3>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">{ach.description}</p>
                </div>
              </div>
              <div className="mt-6">
                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest mb-2">
                  <span>Progression</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-1 bg-white/5 w-full rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-1000 ${isUnlocked ? 'bg-purple-500' : 'bg-gray-700'}`} style={{ width: `${progress}%` }}></div>
                </div>
              </div>
              {isUnlocked && <div className="absolute top-4 right-4 text-[10px] font-black text-purple-400 border border-purple-400 px-2 py-0.5 animate-pulse">UNLOCKED</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Achievements;
