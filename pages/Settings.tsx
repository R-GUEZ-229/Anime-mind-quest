
import React, { useState, useEffect } from 'react';
import { useGame } from '../lib/gameStore';
import { playSound } from '../lib/audio';

const Settings: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user, resetGame, setTheme, setNickname, updateSettings } = useGame();
  const [tempName, setTempName] = useState(user.nickname);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    setTempName(user.nickname);
  }, [user.nickname]);

  const handleNicknameSave = () => {
    if (tempName.trim().length < 3) {
      setSaveStatus('NOM TROP COURT');
      setTimeout(() => setSaveStatus(null), 2000);
      return;
    }
    setNickname(tempName.trim());
    setSaveStatus('IDENTITÉ SYNCHRONISÉE');
    playSound('success', user.settings.volume);
    setTimeout(() => setSaveStatus(null), 2000);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    updateSettings({ volume: val });
  };

  const toggleVFX = () => {
    updateSettings({ vfxEnabled: !user.settings.vfxEnabled });
    playSound('click', user.settings.volume);
  };

  const toggleNotifications = () => {
    updateSettings({ notificationsEnabled: !user.settings.notificationsEnabled });
    playSound('click', user.settings.volume);
  };

  const handleReset = () => {
    if (confirm("ATTENTION CRITIQUE : Cette opération va purger toute la Matrix et déconnecter votre conscience. Toutes vos cartes, diamants et votre progression seront définitivement supprimés. Êtes-vous sûr ?")) {
      resetGame();
      // Le rechargement est géré dans resetGame() pour assurer une purge propre
    }
  };

  const themes = [
    { id: 'default', name: 'VIDE ROUGE', color: 'bg-red-600' },
    { id: 'neon', name: 'NÉON CYBER', color: 'bg-blue-400 shadow-[0_0_10px_#00f2ff]' },
    { id: 'blue_horizon', name: 'HORIZON BLEU', color: 'bg-blue-600' },
    { id: 'blood_shinobi', name: 'SANG SHINOBI', color: 'bg-red-800' },
    { id: 'void_infinity', name: 'VIDE INFINI', color: 'bg-indigo-900' },
    { id: 'cyber_nexus', name: 'CYBER NEXUS', color: 'bg-cyan-500' },
    { id: 'sakura_bloom', name: 'SAKURA BLOOM', color: 'bg-pink-500' },
    { id: 'golden_age', name: 'GOLDEN AGE', color: 'bg-yellow-500' },
  ];

  return (
    <div className="pt-24 px-6 min-h-screen max-w-4xl mx-auto page-transition bg-black pb-24">
      <div className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-orbitron font-black text-white italic tracking-tighter uppercase">CORE <span className="text-gray-500">SYSTEM</span></h1>
          <p className="text-gray-500 text-[10px] uppercase tracking-[0.4em] font-bold">Configuration du Terminal v1.4.0</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* User Identity Section */}
        <div className="glass-panel p-8 rounded-sm border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 scale-y-0 group-hover:scale-y-100 transition-transform"></div>
          <h2 className="text-xl font-orbitron font-black mb-6 italic tracking-tight flex items-center gap-3 uppercase">
            <span className="text-blue-500">01</span> IDENTITÉ NODE
          </h2>
          <div className="space-y-4">
            <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Pseudonyme</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={tempName}
                onChange={(e) => setTempName(e.target.value.toUpperCase())}
                className="flex-1 bg-white/5 border border-white/10 rounded-sm px-4 py-3 font-orbitron font-bold text-white focus:border-blue-500 outline-none transition-all uppercase"
                placeholder="NICKNAME"
              />
              <button 
                onClick={handleNicknameSave}
                className="px-6 bg-blue-600 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all active:scale-95"
              >
                SYNC
              </button>
            </div>
            {saveStatus && <p className="text-[8px] text-blue-400 font-black tracking-widest animate-pulse uppercase">{saveStatus}</p>}
          </div>
        </div>

        {/* Audio Engine Section */}
        <div className="glass-panel p-8 rounded-sm border-white/5 group relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-600 scale-y-0 group-hover:scale-y-100 transition-transform"></div>
          <h2 className="text-xl font-orbitron font-black mb-6 italic tracking-tight flex items-center gap-3 uppercase">
            <span className="text-red-500">02</span> MOTEUR AUDIO
          </h2>
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Volume Maître</label>
              <span className="text-sm font-orbitron font-bold text-white">{Math.round(user.settings.volume * 100)}%</span>
            </div>
            <input 
              type="range" 
              min="0" max="1" step="0.01" 
              value={user.settings.volume}
              onChange={handleVolumeChange}
              className="w-full accent-red-600 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Interface Themes Section */}
        <div className="glass-panel p-8 rounded-sm border-white/5 md:col-span-2 group relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 scale-y-0 group-hover:scale-y-100 transition-transform"></div>
          <h2 className="text-xl font-orbitron font-black mb-8 italic tracking-tight flex items-center gap-3 uppercase">
            <span className="text-purple-500">03</span> SPECTRE VISUEL (THÈMES)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {themes.map(theme => {
                const isUnlocked = user.unlockedThemes.includes(theme.id);
                return (
                  <button 
                    key={theme.id}
                    disabled={!isUnlocked}
                    onClick={() => setTheme(theme.id)}
                    className={`p-4 border rounded-sm font-black text-[10px] tracking-widest transition-all flex flex-col items-center gap-3 relative overflow-hidden ${!isUnlocked ? 'opacity-20 cursor-not-allowed' : 'hover:border-white/40'} ${user.theme === theme.id ? 'border-white bg-white/10 shadow-lg' : 'border-white/5'}`}
                  >
                    {!isUnlocked && <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10 text-xs">🔒</div>}
                    <div className={`w-6 h-6 rounded-full ${theme.color}`}></div>
                    {theme.name}
                    {user.theme === theme.id && <span className="text-[8px] text-green-500 font-bold">ACTIF</span>}
                  </button>
                );
             })}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="glass-panel p-8 rounded-sm border-red-900/20 md:col-span-2 bg-red-600/5 group relative overflow-hidden">
          <h2 className="text-xl font-orbitron font-black mb-6 italic tracking-tight text-red-500 flex items-center gap-3 uppercase">
            <span className="text-red-500">04</span> PURGE DE LA MATRICE
          </h2>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <p className="text-gray-500 text-[10px] max-w-lg uppercase font-bold tracking-widest leading-loose">
              Cette action supprimera votre progression, vos cartes et vos diamants. Impossible de restaurer les archives après cette opération.
            </p>
            <button 
              onClick={handleReset}
              className="px-12 py-5 bg-red-900/20 border border-red-600 text-red-500 font-black text-xs uppercase tracking-[0.4em] hover:bg-red-600 hover:text-white transition-all shadow-[0_0_30px_rgba(255,0,0,0.1)] active:scale-95"
            >
              PURGER TOUTE LA MATRIX
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
