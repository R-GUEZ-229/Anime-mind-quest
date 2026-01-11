
import React, { useState } from 'react';
import { useGame } from '../lib/gameStore';
import { CardRarity, AnimeCard } from '../types';
import ProgressBar from '../components/ProgressBar';

const Collection: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user, useBoosterOnCard } = useGame();
  const [selectedUnit, setSelectedUnit] = useState<AnimeCard | null>(null);

  const rarityColors: Record<CardRarity, string> = {
    'Common': 'text-gray-400 border-gray-500',
    'Rare': 'text-blue-400 border-blue-500',
    'Epic': 'text-purple-400 border-purple-500',
    'Legendary': 'text-yellow-500 border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]',
    'Divine': 'text-cyan-400 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]',
    'Mythic': 'text-red-600 border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.6)]'
  };

  const handleBoost = (cardId: string) => {
    if (user.boosters > 0) {
      useBoosterOnCard(cardId);
    }
  };

  return (
    <div className="pt-24 px-6 min-h-screen bg-black page-transition pb-24">
      <div className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-orbitron font-black text-white italic tracking-tighter uppercase">DATA <span className="theme-text">DECK</span></h1>
          <p className="text-gray-500 text-[10px] uppercase tracking-[0.4em] font-bold">Archives de Cartes Collectionnées</p>
        </div>
        <div className="flex gap-8 text-right">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Boosters⚡</span>
            <div className="text-2xl font-orbitron font-bold text-white italic">{user.boosters}</div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] theme-text font-black uppercase tracking-widest">Unités Actives🎴</span>
            <div className="text-2xl font-orbitron font-bold text-white italic">{user.inventory.length}</div>
          </div>
        </div>
      </div>

      {user.inventory.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center glass-panel border-white/5">
          <span className="text-6xl mb-6 grayscale opacity-20">🎴</span>
          <h3 className="text-xl font-bold uppercase tracking-widest text-gray-500">Aucune donnée archivée</h3>
          <p className="text-xs text-gray-600 mt-2">Générez des unités via le mode Histoire ou la Boutique.</p>
          <button onClick={() => onNavigate('shop')} className="mt-8 px-8 py-3 bg-white text-black font-black text-xs uppercase tracking-widest hover:theme-bg hover:text-white transition-all">BOUTIQUE</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {user.inventory.map((card, idx) => (
            <div key={idx} className={`glass-panel p-2 rounded-sm border transition-all hover:scale-105 relative group overflow-hidden ${rarityColors[card.rarity].split(' ').slice(1).join(' ')}`}>
              <div className="aspect-[3/4] overflow-hidden bg-zinc-900 rounded-sm mb-3 relative">
                <img src={card.imageUrl} alt={card.characterName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-md text-[7px] font-black text-white italic border-l-2 border-white uppercase">LVL {card.level}</div>
                
                {/* Overlay Boost */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm">
                   <button 
                     disabled={user.boosters === 0}
                     onClick={() => handleBoost(card.id)}
                     className="px-4 py-2 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 transition-all active:scale-90"
                   >
                     ⚡ BOOST (+500 XP)
                   </button>
                </div>
              </div>
              <div className="px-2 pb-2">
                <span className={`text-[8px] font-black uppercase tracking-widest mb-1 block ${rarityColors[card.rarity].split(' ')[0]}`}>{card.rarity}</span>
                <h4 className="text-sm font-orbitron font-black text-white truncate italic leading-none uppercase">{card.characterName}</h4>
                <p className="text-[8px] text-gray-500 uppercase font-black truncate mt-1 tracking-widest mb-3">{card.anime}</p>
                
                {/* Unité XP */}
                <div className="mb-4">
                  <div className="flex justify-between text-[7px] text-gray-500 font-black mb-1">
                    <span>PROGRESSION UNITÉ</span>
                    <span>{card.currentXp} / {card.xpToNextLevel}</span>
                  </div>
                  <ProgressBar current={card.currentXp} total={card.xpToNextLevel} color="bg-blue-500" />
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <div className="flex flex-col items-center bg-white/5 py-1.5 rounded-sm border border-white/5">
                    <span className="text-[6px] text-gray-500 uppercase font-black tracking-tighter">POWER</span>
                    <span className="text-[10px] font-bold text-red-500 leading-none mt-1">{card.stats.power}</span>
                  </div>
                  <div className="flex flex-col items-center bg-white/5 py-1.5 rounded-sm border border-white/5">
                    <span className="text-[6px] text-gray-500 uppercase font-black tracking-tighter">SPEED</span>
                    <span className="text-[10px] font-bold text-blue-400 leading-none mt-1">{card.stats.speed}</span>
                  </div>
                  <div className="flex flex-col items-center bg-white/5 py-1.5 rounded-sm border border-white/5">
                    <span className="text-[6px] text-gray-500 uppercase font-black tracking-tighter">INTEL</span>
                    <span className="text-[10px] font-bold text-emerald-400 leading-none mt-1">{card.stats.intelligence}</span>
                  </div>
                  <div className="flex flex-col items-center bg-white/5 py-1.5 rounded-sm border border-white/5">
                    <span className="text-[6px] text-gray-500 uppercase font-black tracking-tighter">ENERGY</span>
                    <span className="text-[10px] font-bold text-yellow-500 leading-none mt-1">{card.stats.energy}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Collection;
