
import React, { useState, useEffect } from 'react';
import { GameProvider, useGame } from './lib/gameStore';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Play from './pages/Play';
import Personality from './pages/Personality';
import Shop from './pages/Shop';
import Achievements from './pages/Achievements';
import Settings from './pages/Settings';
import Collection from './pages/Collection';
import Combat from './pages/Combat';
import { startBGM } from './lib/audio';
import { Rank } from './types';

const BackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button 
    onClick={onClick}
    className="fixed top-20 left-6 z-[60] px-4 py-2 glass-panel border-white/20 text-[10px] font-black uppercase tracking-[0.3em] text-white hover:bg-[var(--primary-color)] hover:border-[var(--primary-color)] transition-all flex items-center gap-2 group"
  >
    <span className="group-hover:-translate-x-1 transition-transform">←</span> RETOUR AU HUB
  </button>
);

const Leaderboard: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user } = useGame();
  
  const fullLeaderboard = [
    ...user.leaderboard,
    { id: 'user_current', name: `${user.nickname} (VOUS)`, xp: user.totalXp, rank: user.rank, isBot: false }
  ].sort((a, b) => b.xp - a.xp);
  
  const userIndex = fullLeaderboard.findIndex(e => e.id === 'user_current');

  const getPositionalRank = (index: number, defaultRank: string): string => {
    const pos = index + 1;
    if (pos === 1) return Rank.INFINITE_ERROR;
    if (pos >= 2 && pos <= 30) return Rank.OUTERVERSAL;
    if (pos >= 31 && pos <= 58) return Rank.GOD;
    if (pos >= 59 && pos <= 105) return Rank.MYTHIC;
    return defaultRank;
  };

  const getRankColor = (rankName: string): string => {
    if (rankName === Rank.INFINITE_ERROR) return 'text-white theme-glow-text animate-pulse';
    if (rankName === Rank.OUTERVERSAL) return 'text-cyan-400 font-black';
    if (rankName === Rank.GOD) return 'text-yellow-500 font-bold';
    if (rankName === Rank.MYTHIC) return 'text-red-500';
    return 'text-gray-500';
  };

  return (
    <div className="pt-24 min-h-screen px-4 md:px-6 page-transition bg-black pb-24 w-full max-w-4xl mx-auto">
      <div className="mb-12 text-center">
        <h1 className="text-4xl md:text-6xl font-orbitron font-black text-white italic tracking-tighter uppercase leading-none">
          CLASSEMENT <span className="theme-text">MONDIAL</span>
        </h1>
        <p className="text-gray-500 text-[10px] uppercase tracking-[0.5em] mt-4 font-bold">
          Votre position : <span className="text-white">#{userIndex + 1} SUR {fullLeaderboard.length} NODES</span>
        </p>
      </div>
      <div className="glass-panel w-full border-white/10 rounded-sm overflow-hidden flex flex-col h-[65vh] shadow-2xl">
        <div className="bg-white/5 border-b border-white/10 px-6 py-4 flex justify-between text-[10px] font-black uppercase text-gray-500 tracking-widest">
          <span>IDENTITÉ / RANG HIÉRARCHIQUE</span>
          <span>DATA XP</span>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-2">
          {fullLeaderboard.map((entry, idx) => {
            const isUser = entry.id === 'user_current';
            const displayRank = getPositionalRank(idx, entry.rank as string);
            const rankStyle = getRankColor(displayRank);
            
            return (
              <div key={idx} className={`flex items-center justify-between p-4 rounded-sm border transition-all ${isUser ? 'bg-[var(--primary-color)]/20 border-[var(--primary-color)] theme-glow' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                <div className="flex items-center gap-4">
                  <span className={`font-orbitron font-black text-lg w-10 ${isUser ? 'theme-text' : 'text-gray-700'}`}>#{idx + 1}</span>
                  <div className="flex flex-col">
                    <span className={`font-bold text-sm md:text-base tracking-tight ${isUser ? 'text-white' : 'text-gray-200'}`}>{entry.name}</span>
                    <span className={`text-[8px] uppercase font-black tracking-widest ${rankStyle}`}>{displayRank}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`font-orbitron font-bold text-sm md:text-base ${isUser ? 'text-white' : 'text-gray-400'}`}>
                    {entry.xp.toLocaleString()} <span className="text-[10px] opacity-50">XP</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const PageRenderer: React.FC<{ currentPage: string, onNavigate: (page: string) => void }> = ({ currentPage, onNavigate }) => {
  switch (currentPage) {
    case 'home': return <Home onNavigate={onNavigate} />;
    case 'play': return <Play onNavigate={onNavigate} />;
    case 'personality': return <Personality onNavigate={onNavigate} />;
    case 'shop': return <Shop />;
    case 'achievements': return <Achievements />;
    case 'settings': return <Settings onNavigate={onNavigate} />;
    case 'collection': return <Collection onNavigate={onNavigate} />;
    case 'combat': return <Combat onNavigate={onNavigate} />;
    case 'leaderboard': return <Leaderboard onNavigate={onNavigate} />;
    default: return <Home onNavigate={onNavigate} />;
  }
};

const MainAppContent: React.FC = () => {
  const { user } = useGame();
  const [currentPage, setCurrentPage] = useState('home');

  useEffect(() => {
    document.body.setAttribute('data-theme', user.theme || 'default');
  }, [user.theme]);

  useEffect(() => {
    const bgm = startBGM(user.settings.volume * 0.2);
    return () => bgm.pause();
  }, [user.settings.volume]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [currentPage]);

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-white selection:bg-[var(--primary-color)] w-full overflow-x-hidden">
      <Navbar />
      <main className="flex-1 w-full relative">
        {currentPage !== 'home' && <BackButton onClick={() => setCurrentPage('home')} />}
        <PageRenderer currentPage={currentPage} onNavigate={setCurrentPage} />
      </main>
      
      <div className="fixed bottom-0 left-0 w-full h-16 md:hidden glass-panel border-t border-white/10 z-40 flex items-center justify-around px-4 pb-[env(safe-area-inset-bottom)]">
        {[
          {id: 'home', icon: '🏠'},
          {id: 'play', icon: '⚔️'},
          {id: 'combat', icon: '🤺'},
          {id: 'collection', icon: '🎴'},
          {id: 'shop', icon: '💎'}
        ].map(item => (
          <button 
            key={item.id} 
            onClick={() => setCurrentPage(item.id)} 
            className={`p-2 transition-all ${currentPage === item.id ? 'theme-text scale-125 theme-glow-text' : 'text-gray-500'}`}
          >
            {item.icon}
          </button>
        ))}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [hasStarted, setHasStarted] = useState(false);
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center overflow-hidden">
        <div className="mb-12 relative flex flex-col items-center max-w-full">
          <div className="absolute inset-0 bg-red-600 blur-[100px] opacity-20 animate-pulse"></div>
          <img src="https://i.imgur.com/ZL3PFel.png" alt="Anime Mind Logo" className="w-40 h-40 md:w-64 md:h-64 object-contain mb-6 drop-shadow-[0_0_20px_rgba(255,0,0,0.6)] relative z-10" />
          <h1 className="text-4xl md:text-8xl font-orbitron font-black italic tracking-tighter text-white relative z-10 leading-none uppercase">ANIME<span className="text-red-600">MIND</span></h1>
        </div>
        <button onClick={() => setHasStarted(true)} className="group relative px-12 md:px-20 py-5 bg-white text-black font-black uppercase tracking-[0.4em] text-[10px] md:text-xs overflow-hidden transition-all shadow-2xl">
          <span className="relative z-10">INITIALISER LA SESSION</span>
          <div className="absolute inset-0 bg-red-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        </button>
      </div>
    );
  }
  return <GameProvider><MainAppContent /></GameProvider>;
};

export default App;
