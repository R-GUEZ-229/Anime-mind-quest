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
    'Common': 1, 'Rare': 2, 'Epic': 3, 'Legendary': 4, 'Divine': 5, 'Mythic': 6
  };

  const generateEnemy = async () => {
    setBattleLoading(true);
    setBattleLog(["Tentative de liaison interdimensionnelle...", "Analyse des flux de données..."]);
    
    try {
      const targetPower = (selectedCard?.stats.power || 500) + (user.level * 15);
      
      const data = await callGeminiWithRetry(async (ai) => {
        const response = await ai.models.generateContent({
          model: getModelForTask('text'),
          contents: `Génère un adversaire d'anime puissant issu du Top 100. 
          Puissance approx: ${targetPower}.
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
      }, `enemy_gen_${Date.now()}`, (attempt, delay) => {
        setBattleLog(prev => [...prev, `LIMITE DE QUOTA DÉTECTÉE. Retentative dans ${delay/1000}s... (Essai ${attempt})`]);
      });

      setBattleLog(prev => [...prev, `ENTITÉ DÉTECTÉE : ${data.name}. Génération du spectre visuel...`]);

      const imgData = await generateAnimeImage(`Fierce anime battle portrait: ${data.name} from ${data.anime}. Studio high-quality, 4K visual.`, data.name);

      const enemy: AnimeCard = {
        id: `enemy_${Date.now()}`,
        characterName: data.name || "Némésis Inconnue",
        anime: data.anime || "Multivers Anime",
        rarity: (data.rarity as CardRarity) || 'Epic',
        baseStats: { power: data.power || 600, speed: data.speed || 600, intelligence: data.intelligence || 600, energy: data.energy || 600 },
        stats: { power: data.power || 600, speed: data.speed || 600, intelligence: data.intelligence || 600, energy: data.energy || 600 },
        imageUrl: imgData,
        level: 1,
        currentXp: 0,
        xpToNextLevel: 1000
      };

      setEnemyCard(enemy);
      setBattleLog(prev => [...prev, `CIBLE VERROUILLÉE : ${enemy.characterName}`]);
    } catch (e: any) {
      console.error(e);
      const isQuota = e.message?.includes("429") || e.message?.includes("quota");
      setBattleLog(prev => [
        ...prev, 
        isQuota ? "ERREUR CRITIQUE : Quota API épuisé. Attendez 60 secondes." : "ÉCHEC DE SYNCHRONISATION : Signal instable."
      ]);
    } finally {
      setBattleLoading(false);
    }
  };

  const startSimulation = async () => {
    if (!selectedCard || !enemyCard) return;
    
    setBattleLoading(true);
    setBattleLog(prev => [...prev, "Initialisation de la simulation neurale...", "Calcul des trajectoires d'énergie..."]);
    
    setTimeout(async () => {
      const playerRankWeight = rarityRankMap[selectedCard.rarity] * 200;
      const enemyRankWeight = rarityRankMap[enemyCard.rarity] * 200;

      const playerTotal = selectedCard.stats.power + selectedCard.stats.speed + selectedCard.stats.intelligence + playerRankWeight;
      const enemyTotal = enemyCard.stats.power + enemyCard.stats.speed + enemyCard.stats.intelligence + enemyRankWeight;
      
      const win = playerTotal >= enemyTotal;

      if (win) {
        setBattleResult('win');
        const unitXp = Math.floor(playerTotal / 3);
        setBattleLog(prev => [...prev, ">>> VICTOIRE CONFIRMÉE <<<", `XP UNITÉ : +${unitXp}`, `+50 Diamants`]);
        
        addXP(Math.floor(playerTotal/5));
        addCardXP(selectedCard.id, unitXp);
        gainDiamonds(50);
        playSound('success', user.settings.volume);

        try {
          const res = await callGeminiWithRetry(async (ai) => {
             const cardData = await ai.models.generateContent({
                model: getModelForTask('text'),
                contents: `Génère une carte bonus d'anime Rare+. Format JSON strict: { name, anime, rarity, pwr, spd, int, eng }`,
                config: { responseMimeType: 'application/json' }
             });
             return JSON.parse(cardData.text || '{}');
          });
          const bonusImg = await generateAnimeImage(`Premium character art: ${res.name} from ${res.anime}`, res.name);
          const newBonus: AnimeCard = {
            id: `bonus_${Date.now()}`,
            characterName: res.name || "Guerrier Bonus",
            anime: res.anime || "Archives",
            rarity: (res.rarity as CardRarity) || 'Rare',
            baseStats: { power: res.pwr || 650, speed: res.spd || 650, intelligence: res.int || 650, energy: res.eng || 650 },
            stats: { power: res.pwr || 650, speed: res.spd || 650, intelligence: res.int || 650, energy: res.eng || 650 },
            imageUrl: bonusImg,
            level: 1, currentXp: 0, xpToNextLevel: 1000
          };
          setBonusCard(newBonus);
        } catch (e) { console.warn("Loot fail - quota?"); }

      } else {
        setBattleResult('loss');
        setBattleLog(prev => [...prev, ">>> ÉCHEC TACTIQUE : Unité neutralisée <<<"]);
        playSound('error', user.settings.volume);
      }
      setBattleLoading(false);
    }, 2000);
  };

  const collectLoot = () => {
    if (bonusCard) addCard(bonusCard);
    setBattleResult(null); setSelectedCard(null); setEnemyCard(null); setBonusCard(null); setBattleLog([]);
  };

  return (
    <div className="pt-24 px-6 min-h-screen bg-black page-transition pb-24 max-w-6xl mx-auto">
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-orbitron font-black text-white italic tracking-tighter uppercase leading-none">STATION <span className="text-red-600">DE COMBAT</span></h1>
        <p className="text-gray-500 text-[10px] uppercase tracking-[0.4em] font-bold mt-4">Calculateur d'affrontements en temps réel</p>
      </div>

      {!selectedCard && !battleLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {user.inventory.map((card) => (
            <button 
              key={card.id} 
              onClick={() => { setSelectedCard(card); playSound('click', user.settings.volume); }}
              className="glass-panel p-2 rounded-sm border border-white/5 hover:border-red-500 transition-all hover:scale-105 text-left group"
            >
              <div className="relative aspect-[3/4] mb-2 overflow-hidden rounded-sm bg-zinc-900">
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
              <div className="relative glass-panel p-2 border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.2)] bg-blue-500/5">
                <img src={selectedCard.imageUrl} className="w-48 h-64 md:w-64 md:h-80 object-cover rounded-sm" alt="Player" />
                <div className="absolute top-4 left-4 bg-blue-600 px-3 py-1 text-[8px] font-black uppercase tracking-widest text-white border-l-4 border-white">UNITÉ : ALLIÉE</div>
              </div>
              <h3 className="mt-6 text-xl md:text-2xl font-orbitron font-black text-white italic uppercase tracking-tighter text-center">{selectedCard.characterName}</h3>
              <p className="theme-text text-[10px] font-black uppercase tracking-widest italic">LVL {selectedCard.level} • {selectedCard.rarity}</p>
            </div>

            <div className="text-6xl font-orbitron font-black italic text-red-600 animate-pulse">VS</div>

            <div className="flex flex-col items-center animate-in slide-in-from-right duration-500">
              {enemyCard ? (
                <div className="relative glass-panel p-2 border-red-600 shadow-[0_0_40px_rgba(220,38,38,0.2)] bg-red-600/5">
                  <img src={enemyCard.imageUrl} className="w-48 h-64 md:w-64 md:h-80 object-cover rounded-sm" alt="Enemy" />
                  <div className="absolute top-4 right-4 bg-red-600 px-3 py-1 text-[8px] font-black uppercase tracking-widest text-white border-r-4 border-white text-right">UNITÉ : HOSTILE</div>
                </div>
              ) : (
                <div className="w-48 h-64 md:w-64 md:h-80 border-2 border-dashed border-gray-800 flex items-center justify-center text-gray-600 font-black italic uppercase animate-pulse">Recherche de cible...</div>
              )}
              {enemyCard && (
                <>
                  <h3 className="mt-6 text-xl md:text-2xl font-orbitron font-black text-white italic uppercase tracking-tighter text-center">{enemyCard.characterName}</h3>
                  <p className="text-red-500 text-[10px] font-black uppercase tracking-widest italic">{enemyCard.rarity}</p>
                </>
              )}
            </div>
          </div>

          <div className="mt-12 w-full max-w-3xl glass-panel p-8 border-white/5 bg-white/5 flex flex-col items-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse"></div>
            
            {battleLog.length > 0 && (
              <div className="w-full h-32 overflow-y-auto font-mono text-[10px] text-gray-400 space-y-2 mb-8 bg-black/60 p-4 rounded-sm border border-white/5 scrollbar-thin">
                {battleLog.map((log, i) => <div key={i} className="flex items-center gap-3 animate-in fade-in slide-in-from-left duration-300"><span className="theme-text">>></span> {log}</div>)}
              </div>
            )}

            {!battleLoading && !battleResult && !enemyCard && (
              <button onClick={generateEnemy} className="px-20 py-6 bg-white text-black font-black text-xs uppercase tracking-[0.5em] hover:bg-red-600 hover:text-white transition-all shadow-xl active:scale-95 border-b-4 border-gray-300">ACTIVER RADAR</button>
            )}

            {!battleLoading && enemyCard && !battleResult && (
              <button onClick={startSimulation} className="px-20 py-6 bg-red-600 text-white font-black text-xs uppercase tracking-[0.5em] hover:bg-red-500 transition-all shadow-xl active:scale-95 border-b-4 border-red-800">DÉCLENCHER ASSAUT</button>
            )}

            {battleResult && (
              <div className="text-center animate-in zoom-in duration-500 w-full">
                <h2 className={`text-6xl md:text-8xl font-orbitron font-black italic mb-8 ${battleResult === 'win' ? 'text-green-500' : 'text-red-500'}`}>{battleResult === 'win' ? 'VICTOIRE' : 'ÉCHEC'}</h2>
                <button onClick={collectLoot} className="px-12 py-5 bg-white text-black font-black uppercase text-xs tracking-widest hover:theme-bg hover:text-white transition-all shadow-2xl">FERMER SESSION</button>
              </div>
            )}
            
            {battleLoading && (
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-t-transparent border-[var(--primary-color)] rounded-full animate-spin"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] theme-text animate-pulse italic">Synchronisation neurale en cours...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Combat;