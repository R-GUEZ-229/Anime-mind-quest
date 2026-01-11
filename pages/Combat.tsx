import React, { useState } from 'react';
import { useGame } from '../lib/gameStore';
import { AnimeCard, CardRarity } from '../types';
import { playSound } from '../lib/audio';
import { Type } from "@google/genai";
import { callGeminiWithRetry, getModelForTask, generateAnimeImage } from '../lib/ai';

const Combat: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user, addXP, addCardXP, gainDiamonds, addCard } = useGame();
  const [selectedCard, setSelectedCard] = useState<AnimeCard | null>(null);
  const [enemyCard, setEnemyCard] = useState<AnimeCard | null>(null);
  const [battleLoading, setBattleLoading] = useState(false);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [battleResult, setBattleResult] = useState<'win' | 'loss' | null>(null);
  const [bonusCard, setBonusCard] = useState<AnimeCard | null>(null);

  const rarityRankMap: Record<CardRarity, number> = {
    'Common': 1,
    'Rare': 2,
    'Epic': 3,
    'Legendary': 4,
    'Divine': 5,
    'Mythic': 6
  };

  const generateEnemy = async () => {
    setBattleLoading(true);
    setBattleLog(["Scan de l'espace interdimensionnel...", "Signature neurale détectée..."]);
    
    try {
      const targetPower = (selectedCard?.stats.power || 500) + (user.level * 15);
      
      const data = await callGeminiWithRetry(async (ai) => {
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Génère un adversaire d'anime puissant issu du Top 100 mondial. 
          Niveau de puissance requis: environ ${targetPower}.
          Format JSON strict requis.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                anime: { type: Type.STRING },
                rarity: { type: Type.STRING },
                power: { type: Type.NUMBER },
                speed: { type: Type.NUMBER },
                intelligence: { type: Type.NUMBER },
                energy: { type: Type.NUMBER }
              },
              required: ['name', 'anime', 'rarity', 'power', 'speed', 'intelligence', 'energy']
            }
          }
        });
        return JSON.parse(response.text || '{}');
      }, `enemy_gen_${Date.now()}`);

      const imgData = await generateAnimeImage(`Fierce anime battle portrait: ${data.name} from ${data.anime}. Studio high-quality, 4K visual.`, data.name);

      const enemy: AnimeCard = {
        id: `enemy_${Date.now()}`,
        characterName: data.name || "Némésis Inconnue",
        anime: data.anime || "Univers Anime",
        rarity: (data.rarity as CardRarity) || 'Epic',
        baseStats: { power: data.power || 600, speed: data.speed || 600, intelligence: data.intelligence || 600, energy: data.energy || 600 },
        stats: { power: data.power || 600, speed: data.speed || 600, intelligence: data.intelligence || 600, energy: data.energy || 600 },
        imageUrl: imgData,
        level: 1,
        currentXp: 0,
        xpToNextLevel: 1000
      };

      setEnemyCard(enemy);
      setBattleLog(prev => [...prev, `ADVERSAIRE IDENTIFIÉ : ${enemy.characterName} [${enemy.rarity}]`]);
    } catch (e) {
      console.error(e);
      setBattleLog(prev => [...prev, "ERREUR CRITIQUE : Liaison instable avec les archives."]);
    } finally {
      setBattleLoading(false);
    }
  };

  const startSimulation = async () => {
    if (!selectedCard || !enemyCard) return;
    
    setBattleLoading(true);
    setBattleLog(prev => [...prev, "Analyse des vecteurs d'attaque...", "Simulation neurale en cours..."]);
    
    setTimeout(async () => {
      const playerRankWeight = rarityRankMap[selectedCard.rarity] * 200;
      const enemyRankWeight = rarityRankMap[enemyCard.rarity] * 200;

      const playerTotal = selectedCard.stats.power + selectedCard.stats.speed + selectedCard.stats.intelligence + playerRankWeight;
      const enemyTotal = enemyCard.stats.power + enemyCard.stats.speed + enemyCard.stats.intelligence + enemyRankWeight;
      
      const win = playerTotal >= enemyTotal;

      if (win) {
        setBattleResult('win');
        const unitXp = Math.floor(playerTotal / 3);
        setBattleLog(prev => [...prev, "VICTOIRE !", `XP UNITÉ : +${unitXp}`, `+50 Diamants`, "GÉNÉRATION RÉCOMPENSE..."]);
        
        addXP(Math.floor(playerTotal/5));
        addCardXP(selectedCard.id, unitXp);
        gainDiamonds(50);
        playSound('success', user.settings.volume);

        try {
          const res = await callGeminiWithRetry(async (ai) => {
             const cardData = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Génère une carte bonus d'anime (Top 100). Rareté: Rare+. Format JSON strict: { name, anime, rarity, pwr, spd, int, eng }`,
                config: { responseMimeType: 'application/json' }
             });
             return JSON.parse(cardData.text || '{}');
          });
          const bonusImg = await generateAnimeImage(`Premium character art: ${res.name} from ${res.anime}`, res.name);
          const newBonus: AnimeCard = {
            id: `bonus_${Date.now()}`,
            characterName: res.name || "Guerrier Mystère",
            anime: res.anime || "Top 100",
            rarity: (res.rarity as CardRarity) || 'Rare',
            baseStats: { power: res.pwr || 650, speed: res.spd || 650, intelligence: res.int || 650, energy: res.eng || 650 },
            stats: { power: res.pwr || 650, speed: res.spd || 650, intelligence: res.int || 650, energy: res.eng || 650 },
            imageUrl: bonusImg,
            level: 1,
            currentXp: 0,
            xpToNextLevel: 1000
          };
          setBonusCard(newBonus);
        } catch (e) { console.error("Bonus fail", e); }

      } else {
        setBattleResult('loss');
        setBattleLog(prev => [...prev, "ÉCHEC : Unité surpassée tactiquement."]);
        playSound('error', user.settings.volume);
      }
      setBattleLoading(false);
    }, 2000);
  };

  const collectLoot = () => {
    if (bonusCard) addCard(bonusCard);
    setBattleResult(null);
    setSelectedCard(null);
    setEnemyCard(null);
    setBonusCard(null);
    setBattleLog([]);
  };

  return (
    <div className="pt-24 px-6 min-h-screen bg-black page-transition pb-24 max-w-6xl mx-auto">
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-orbitron font-black text-white italic tracking-tighter uppercase leading-none">STATION <span className="text-red-600">DE COMBAT</span></h1>
        <p className="text-gray-500 text-[10px] uppercase tracking-[0.4em] font-bold mt-4">Arène d'évolution tactique v2.0</p>
      </div>

      {!selectedCard && !battleLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {user.inventory.map((card, idx) => (
            <button 
              key={card.id || idx} 
              onClick={() => { setSelectedCard(card); playSound('click', user.settings.volume); }}
              className="glass-panel p-2 rounded-sm border border-white/5 hover:border-red-500 transition-all hover:scale-105 text-left group"
            >
              <div className="relative aspect-[3/4] mb-2 overflow-hidden rounded-sm">
                <img src={card.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={card.characterName} />
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 text-[7px] font-black text-white border-l-2 border-white uppercase">LVL {card.level}</div>
              </div>
              <h4 className="text-[10px] font-black truncate text-white uppercase italic leading-none">{card.characterName}</h4>
              <div className="flex justify-between items-center mt-2">
                <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">{card.rarity}</span>
                <span className="text-[8px] theme-text font-black">PWR {card.stats.power}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedCard && (
        <div className="flex flex-col items-center">
          <div className="flex flex-col md:flex-row items-center gap-12 w-full justify-center">
            <div className="flex flex-col items-center animate-in slide-in-from-left duration-500">
              <div className="relative glass-panel p-2 border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.3)]">
                <img src={selectedCard.imageUrl} className="w-48 h-64 md:w-64 md:h-80 object-cover rounded-sm" alt="Player" />
                <div className="absolute top-4 left-4 bg-blue-600 px-3 py-1 text-[8px] font-black uppercase tracking-widest text-white border-l-4 border-white">UNITÉ : VOUS</div>
              </div>
              <h3 className="mt-6 text-xl md:text-2xl font-orbitron font-black text-white italic uppercase tracking-tighter text-center">{selectedCard.characterName}</h3>
              <p className="theme-text text-[10px] font-black uppercase tracking-widest italic">LVL {selectedCard.level} • {selectedCard.rarity}</p>
            </div>

            <div className="text-6xl font-orbitron font-black italic text-red-600 animate-pulse">VS</div>

            <div className="flex flex-col items-center animate-in slide-in-from-right duration-500">
              {enemyCard ? (
                <div className="relative glass-panel p-2 border-red-600 shadow-[0_0_40px_rgba(220,38,38,0.3)]">
                  <img src={enemyCard.imageUrl} className="w-48 h-64 md:w-64 md:h-80 object-cover rounded-sm" alt="Enemy" />
                  <div className="absolute top-4 right-4 bg-red-600 px-3 py-1 text-[8px] font-black uppercase tracking-widest text-white border-r-4 border-white text-right">UNITÉ : HOSTILE</div>
                </div>
              ) : (
                <div className="w-48 h-64 md:w-64 md:h-80 border-2 border-dashed border-gray-800 flex items-center justify-center text-gray-800 font-black italic uppercase animate-pulse">Scanning...</div>
              )}
              {enemyCard && (
                <>
                  <h3 className="mt-6 text-xl md:text-2xl font-orbitron font-black text-white italic uppercase tracking-tighter text-center">{enemyCard.characterName}</h3>
                  <p className="text-red-500 text-[10px] font-black uppercase tracking-widest italic">{enemyCard.rarity}</p>
                </>
              )}
            </div>
          </div>

          <div className="mt-12 w-full max-w-3xl glass-panel p-8 border-white/5 bg-white/5 flex flex-col items-center shadow-2xl">
            {battleLog.length > 0 && (
              <div className="w-full h-32 overflow-y-auto font-mono text-[10px] text-gray-400 space-y-2 mb-8 bg-black/40 p-4 rounded-sm border border-white/5">
                {battleLog.map((log, i) => <div key={i} className="flex items-center gap-3 animate-in fade-in slide-in-from-left duration-300"><span className="theme-text">>></span> {log}</div>)}
              </div>
            )}

            {!battleLoading && !battleResult && !enemyCard && (
              <button onClick={generateEnemy} className="px-20 py-6 bg-white text-black font-black text-xs uppercase tracking-[0.5em] hover:bg-red-600 hover:text-white transition-all shadow-xl active:scale-95">LOCALISER CIBLE</button>
            )}

            {!battleLoading && enemyCard && !battleResult && (
              <button onClick={startSimulation} className="px-20 py-6 bg-red-600 text-white font-black text-xs uppercase tracking-[0.5em] hover:bg-red-500 transition-all shadow-xl active:scale-95">DÉCLENCHER COMBAT</button>
            )}

            {battleResult && (
              <div className="text-center animate-in zoom-in duration-500 w-full">
                <h2 className={`text-6xl md:text-8xl font-orbitron font-black italic mb-8 ${battleResult === 'win' ? 'text-green-500' : 'text-red-500'}`}>{battleResult === 'win' ? 'VICTOIRE' : 'DÉFAITE'}</h2>
                <button onClick={collectLoot} className="px-12 py-5 bg-white text-black font-black uppercase text-xs tracking-widest hover:theme-bg hover:text-white transition-all shadow-2xl">TERMINER SESSION</button>
              </div>
            )}
            
            {battleLoading && (
              <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-t-transparent border-[var(--primary-color)] rounded-full animate-spin"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] theme-text animate-pulse italic">Calcul des probabilités de survie...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Combat;