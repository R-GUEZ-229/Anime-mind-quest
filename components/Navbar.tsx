
import React from 'react';
import { useGame } from '../lib/gameStore';
import { MAX_HEARTS } from '../constants';

const Navbar: React.FC = () => {
  const { user, timeToNextHeart } = useGame();

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <nav className="fixed top-0 left-0 w-full h-16 glass-panel z-50 flex items-center justify-between px-6 border-b theme-border bg-black/80 backdrop-blur-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 flex items-center justify-center relative">
          <img 
            src="https://i.imgur.com/ZL3PFel.png" 
            alt="Logo" 
            className="w-full h-full object-contain drop-shadow-[0_0_8px_var(--glow-color)]"
          />
        </div>
        <div className="flex flex-col">
          <span className="font-orbitron font-black text-xl tracking-tighter text-white italic leading-none">
            ANIME<span className="theme-text">MIND</span>
          </span>
          <span className="text-[8px] text-gray-500 font-bold tracking-[0.3em] uppercase">{user.nickname}</span>
        </div>
      </div>

      <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest">
        <div className="hidden lg:flex flex-col items-end">
          <span className="text-gray-500 text-[8px]">RANG: <span className="theme-text">{user.rank}</span></span>
          <span className="text-white">NODE LEVEL {user.level}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative flex flex-col items-center">
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-sm border ${user.hearts === 0 ? 'border-red-600 bg-red-600/10' : 'border-white/10 bg-white/5 shadow-sm'}`}>
              <span className={`${user.hearts === 0 ? 'animate-pulse' : ''}`}>❤️</span>
              <span className="font-orbitron text-sm text-white">{user.hearts}</span>
            </div>
            {user.hearts < MAX_HEARTS && (
              <span className="absolute -bottom-5 text-[8px] text-gray-500 font-mono tracking-normal">
                +{formatTime(timeToNextHeart)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 px-4 py-1.5 rounded-sm border border-white/10 bg-white/5 shadow-sm">
            <span className="theme-text">💎</span>
            <span className="font-orbitron text-sm text-white">{user.diamonds}</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
