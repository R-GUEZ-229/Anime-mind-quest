
import React from 'react';
import { useGame } from '../lib/gameStore';

const Home: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user } = useGame();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen pt-20 px-6 pb-12 bg-black overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-20">
         <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[var(--primary-color)] rounded-full blur-[120px] animate-pulse"></div>
         <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-600 rounded-full blur-[120px] animate-pulse transition-all duration-1000"></div>
      </div>

      <div className="relative z-10 text-center mb-12 space-y-2 flex flex-col items-center">
        <div className="inline-block px-4 py-1 bg-[var(--primary-color)]/10 border border-[var(--primary-color)]/30 rounded-full mb-6">
          <span className="theme-text text-[10px] font-black tracking-[0.3em] uppercase italic">Sequence ${user.level}: Matrix Link</span>
        </div>
        <img src="https://i.imgur.com/ZL3PFel.png" alt="Official Logo" className="w-32 h-32 md:w-48 md:h-48 object-contain drop-shadow-[0_0_15px_rgba(255,0,0,0.4)] mb-2" />
        <h1 className="text-4xl md:text-6xl font-black font-orbitron tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,0,0,0.3)] italic leading-none uppercase">
          ANIME<span className="theme-text not-italic">MIND</span>
        </h1>
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
        <button onClick={() => onNavigate('play')} className="group relative h-56 rounded-sm border border-[var(--primary-color)]/20 bg-gradient-to-br from-black to-[var(--primary-color)]/10 overflow-hidden hover:theme-border transition-all duration-500">
          <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/anime-play/800/600')] bg-cover opacity-10 group-hover:opacity-30 transition-all grayscale group-hover:grayscale-0"></div>
          <div className="relative z-10 flex flex-col justify-end p-6 h-full items-start">
            <div className="mb-1 px-3 py-0.5 theme-bg text-[8px] font-black text-white italic">SESSION LORE</div>
            <h2 className="text-3xl font-black font-orbitron tracking-tighter italic uppercase">Mode Histoire</h2>
          </div>
        </button>

        <button onClick={() => onNavigate('combat')} className="group relative h-56 rounded-sm border border-blue-500/20 bg-gradient-to-br from-black to-blue-950/20 overflow-hidden hover:border-blue-500 transition-all duration-500">
          <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/anime-combat/800/600')] bg-cover opacity-10 group-hover:opacity-30 transition-all grayscale group-hover:grayscale-0"></div>
          <div className="relative z-10 flex flex-col justify-end p-6 h-full items-start">
            <div className="mb-1 px-3 py-0.5 bg-blue-600 text-[8px] font-black text-white italic">ARÈNE NEURALE</div>
            <h2 className="text-3xl font-black font-orbitron tracking-tighter italic uppercase">COMBAT</h2>
          </div>
        </button>

        <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-5 gap-4">
           {[
             { id: 'collection', icon: '🎴', label: 'Deck', color: 'hover:border-blue-400' },
             { id: 'personality', icon: '🧠', label: 'Profil', color: 'hover:border-cyan-400' },
             { id: 'shop', icon: '💎', label: 'Shop', color: 'hover:border-emerald-500' },
             { id: 'leaderboard', icon: '🏆', label: 'Rangs', color: 'hover:border-yellow-500' },
             { id: 'settings', icon: '⚙️', label: 'Système', color: 'hover:border-gray-500' }
           ].map(item => (
            <button key={item.id} onClick={() => onNavigate(item.id)} className={`glass-panel p-6 rounded-sm flex flex-col items-center justify-center transition-all duration-300 border-white/5 ${item.color} group`}>
              <span className="text-2xl mb-2 group-hover:scale-125 transition-transform">{item.icon}</span>
              <span className="font-orbitron font-bold text-[8px] tracking-[0.2em] uppercase text-gray-500 group-hover:text-white">{item.label}</span>
            </button>
           ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
