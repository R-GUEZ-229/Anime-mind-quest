import React, { useState } from 'react';
import { useGame } from '../lib/gameStore';
import { playSound } from '../lib/audio';
import { AnimeCard, CardRarity } from '../types';
import { callGeminiWithRetry, getModelForTask, generateAnimeImage } from '../lib/ai';

declare var FedaPay: any;

const FEDAPAY_CONFIG = {
  PUBLIC_KEY: 'pk_sandbox_8s4j8nmgyODgm9WSVwBaMtdJ',
  ACCOUNT_ID: 'acc_1062392892',
  EMAIL: 'meyofet470@feanzier.com'
};

const SecurePaymentOverlay: React.FC<{ item: any; onConfirm: () => void; onCancel: () => void }> = ({ item, onConfirm, onCancel }) => {
  const [processing, setProcessing] = useState(false);

  const handleFedaPay = () => {
    setProcessing(true);
    try {
      if (typeof FedaPay === 'undefined') {
        alert("Le terminal de paiement est en cours de chargement. Réessayez dans un instant.");
        setProcessing(false);
        return;
      }
      FedaPay.init({
        public_key: FEDAPAY_CONFIG.PUBLIC_KEY,
        transaction: {
          amount: Math.round(item.price * 655),
          description: `AMQ Premium: ${item.title}`
        },
        customer: {
          email: FEDAPAY_CONFIG.EMAIL,
          lastname: 'Player',
          firstname: 'AMQ'
        },
        onComplete: (response: any) => {
          setProcessing(false);
          if (response && (response.status === 'approved' || response.status === 'success' || response.transaction?.status === 'approved')) {
            onConfirm();
          } else {
            alert("La transaction n'a pas pu être validée.");
          }
        },
        onClose: () => {
          setProcessing(false);
        }
      }).open();
    } catch (e) {
      console.error("FedaPay Error:", e);
      setProcessing(false);
      alert("Liaison avec FedaPay interrompue.");
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-6 backdrop-blur-md">
      <div className="max-w-md w-full glass-panel border-[var(--primary-color)]/50 p-8 flex flex-col items-center animate-in zoom-in duration-300">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-3xl mb-4 border border-emerald-500/30">🔐</div>
          <h2 className="text-2xl font-orbitron font-black text-white italic mb-1 tracking-tighter uppercase leading-none">TERMINAL SÉCURISÉ</h2>
          <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-[0.4em]">FedaPay Gateway</p>
        </div>
        
        <div className="w-full space-y-4 mb-8">
           <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-gray-500 text-[10px] uppercase font-black">PRODUIT</span><span className="text-white font-bold text-xs uppercase italic">{item.title}</span></div>
           <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-gray-500 text-[10px] uppercase font-black">PRIX</span><span className="theme-text font-black">{item.price}€ (~{Math.round(item.price * 655)} FCFA)</span></div>
        </div>
        
        <button onClick={handleFedaPay} disabled={processing} className="w-full py-5 theme-bg text-white font-black uppercase text-xs tracking-widest hover:opacity-80 disabled:opacity-50 transition-all shadow-2xl">
          {processing ? 'TRAITEMENT...' : 'PAYER MAINTENANT'}
        </button>
        <button onClick={onCancel} className="mt-4 text-[10px] text-gray-500 uppercase font-black hover:text-white transition-colors tracking-widest">ANNULER</button>
      </div>
    </div>
  );
};

const Shop: React.FC = () => {
  const { user, gainDiamonds, spendDiamonds, addCard, refillHeartsWithDiamonds, unlockTheme, gainBoosters } = useGame();
  const [notification, setNotification] = useState<string | null>(null);
  const [openingPack, setOpeningPack] = useState(false);
  const [statusMsg, setStatusMsg] = useState("INITIALISATION...");
  const [newCard, setNewCard] = useState<AnimeCard | null>(null);
  const [paymentItem, setPaymentItem] = useState<any | null>(null);

  const showNotification = (msg: string) => { setNotification(msg); setTimeout(() => setNotification(null), 3000); };

  const triggerCardGeneration = async (rarityCap: CardRarity) => {
    setOpeningPack(true);
    setStatusMsg("GÉNÉRATION UNITÉ TOP 100...");
    
    try {
      const card = await (async () => {
        try {
          const data = await callGeminiWithRetry(async (ai) => {
            const res = await ai.models.generateContent({
              model: getModelForTask('text'),
              contents: `Génère une carte d'unité d'anime aléatoire issue du Top 100 mondial. Rareté: ${rarityCap}. 
              Format JSON: { name, anime, rarity, pwr, spd, int, eng }`,
              config: { responseMimeType: 'application/json' }
            });
            return JSON.parse(res.text || '{}');
          });
          
          const imgData = await generateAnimeImage(`Ultra high-fidelity anime art: ${data.name} from "${data.anime}". Iconic character design.`, data.name);
          
          return {
            id: `card_${Date.now()}`,
            characterName: data.name || "Guerrier Inconnu",
            anime: data.anime || "Anime Matrix",
            rarity: (data.rarity as CardRarity) || rarityCap,
            baseStats: { power: data.pwr || 700, speed: data.spd || 700, intelligence: data.int || 700, energy: data.eng || 700 },
            stats: { power: data.pwr || 700, speed: data.spd || 700, intelligence: data.int || 700, energy: data.eng || 700 },
            imageUrl: imgData,
            level: 1,
            currentXp: 0,
            xpToNextLevel: 1000
          };
        } catch (e) {
          const fallbackStats = { power: 800, speed: 800, intelligence: 800, energy: 800 };
          return {
            id: `fallback_${Date.now()}`,
            characterName: "Sentinel Zero",
            anime: "Top 100 Archives",
            rarity: rarityCap,
            baseStats: fallbackStats,
            stats: fallbackStats,
            imageUrl: "https://cdn.pixabay.com/photo/2023/04/24/09/27/ai-generated-7947654_1280.jpg",
            level: 1,
            currentXp: 0,
            xpToNextLevel: 1000
          };
        }
      })();

      setNewCard(card);
      playSound('success', user.settings.volume);
    } catch (err) {
      showNotification("ERREUR DE FLUX NEURAL.");
    } finally {
      setOpeningPack(false);
    }
  };

  const processRealPayment = async () => {
    const item = paymentItem;
    if (!item) return;

    setPaymentItem(null);
    setOpeningPack(true);
    setStatusMsg("SYNCHRONISATION PREMIUM...");

    try {
      if (item.id === 'starter') {
        gainDiamonds(500);
        unlockTheme('blue_horizon');
        await triggerCardGeneration('Rare');
      } else if (item.id === 'elite') {
        gainDiamonds(2000);
        unlockTheme('blood_shinobi');
        await triggerCardGeneration('Epic');
      } else if (item.id === 'god') {
        gainDiamonds(10000);
        unlockTheme('void_infinity');
        await triggerCardGeneration('Divine');
      } else if (item.id === 'theme_only') {
        unlockTheme(item.themeId);
        setOpeningPack(false);
        showNotification("THÈME DÉBLOQUÉ");
      }
    } catch (e) {
      setOpeningPack(false);
      showNotification("ERREUR DE SYNCHRONISATION.");
    }
  };

  const handleDrawWithDiamonds = async (rarityCap: CardRarity, cost: number) => {
    if (user.diamonds < cost) { showNotification("DIAMANTS INSUFFISANTS"); return; }
    spendDiamonds(cost);
    await triggerCardGeneration(rarityCap);
  };

  const handleBuyBoosters = (amount: number, cost: number) => {
    if (user.diamonds < cost) { showNotification("DIAMANTS INSUFFISANTS"); return; }
    spendDiamonds(cost);
    gainBoosters(amount);
    showNotification(`${amount} BOOSTERS ACQUIS`);
  };

  const finalizeCardAcquisition = () => {
    if (newCard) {
      addCard(newCard);
      setNewCard(null);
      showNotification("UNITÉ TRANSFÉRÉE AU DECK");
    }
  };

  const interfaceThemes = [
    { id: 'cyber_nexus', name: 'Cyber Nexus', price: 0.99, icon: '🌌', color: 'bg-cyan-500' },
    { id: 'sakura_bloom', name: 'Sakura Bloom', price: 0.99, icon: '🌸', color: 'bg-pink-500' },
    { id: 'void_infinity', name: 'Void Infinity', price: 1.49, icon: '🌑', color: 'bg-indigo-900' },
    { id: 'golden_age', name: 'Golden Age', price: 1.99, icon: '🏆', color: 'bg-yellow-500' },
    { id: 'blood_shinobi', name: 'Blood Shinobi', price: 1.49, icon: '🩸', color: 'bg-red-800' }
  ];

  return (
    <div className="pt-32 px-6 min-h-screen max-w-6xl mx-auto page-transition pb-24">
      {paymentItem && <SecurePaymentOverlay item={paymentItem} onConfirm={processRealPayment} onCancel={() => setPaymentItem(null)} />}
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-5xl font-orbitron font-black text-white italic uppercase tracking-tighter leading-none">DATA <span className="theme-text">HUB</span></h1>
          <p className="text-gray-500 text-[10px] uppercase tracking-[0.4em] font-bold">Acquisition de Ressources Premium</p>
        </div>
        <div className="flex gap-4">
           <div className="theme-bg px-6 py-3 border theme-border text-white font-orbitron font-black text-xl flex items-center gap-3 shadow-xl">
             <span className="text-yellow-400">💎</span> {user.diamonds}
           </div>
           <div className="bg-blue-600 px-6 py-3 border border-blue-400 text-white font-orbitron font-black text-xl flex items-center gap-3 shadow-xl">
             <span className="text-white">⚡</span> {user.boosters}
           </div>
        </div>
      </div>

      {notification && (
        <div className="fixed top-24 right-8 bg-zinc-900 border theme-border px-6 py-3 text-xs font-black text-white uppercase italic animate-in slide-in-from-right z-[100] shadow-2xl">
          {notification}
        </div>
      )}

      {/* Rétablissement Vital */}
      <div className="mb-16 glass-panel p-8 border-red-600/20 bg-gradient-to-r from-red-600/5 to-transparent flex flex-col md:flex-row items-center justify-between gap-6">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-red-600/20 flex items-center justify-center text-4xl rounded-sm border border-red-500/30 animate-pulse">❤️</div>
            <div>
              <h3 className="text-xl font-orbitron font-black text-white uppercase italic">INTÉGRITÉ VITALE</h3>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Rétablissement du flux neural</p>
            </div>
         </div>
         <button onClick={() => !refillHeartsWithDiamonds() && showNotification("DIAMANTS INSUFFISANTS")} className="w-full md:w-auto px-12 py-5 bg-white text-black font-black uppercase text-xs hover:theme-bg hover:text-white transition-all shadow-lg active:scale-95">30 💎</button>
      </div>

      {/* Boosters (NOUVEAU) */}
      <h2 className="text-xl font-orbitron font-black text-white italic mb-8 border-l-4 border-blue-500 pl-4 uppercase">MOTEURS DE CROISSANCE (BOOSTERS)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        <div className="glass-panel p-8 border-blue-500/20 flex items-center justify-between group hover:border-blue-500/50 transition-all">
          <div className="flex items-center gap-6">
            <span className="text-4xl group-hover:scale-110 transition-transform">⚡</span>
            <div>
              <h3 className="font-orbitron font-black text-white uppercase italic">UNIT BOOST</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Incrémentation de 500 XP par booster</p>
            </div>
          </div>
          <button onClick={() => handleBuyBoosters(1, 50)} className="px-10 py-4 bg-blue-600 text-white font-black uppercase text-xs hover:bg-blue-500 transition-all shadow-lg">50 💎</button>
        </div>
        <div className="glass-panel p-8 border-blue-400/20 flex items-center justify-between group hover:border-blue-400/50 transition-all bg-blue-400/5">
          <div className="flex items-center gap-6">
            <span className="text-4xl group-hover:scale-110 transition-transform">⚡⚡⚡</span>
            <div>
              <h3 className="font-orbitron font-black text-white uppercase italic">OVERDRIVE PACK</h3>
              <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Lot de 5 Boosters tactiques</p>
            </div>
          </div>
          <button onClick={() => handleBuyBoosters(5, 200)} className="px-10 py-4 bg-white text-black font-black uppercase text-xs hover:theme-bg hover:text-white transition-all shadow-lg">200 💎</button>
        </div>
      </div>

      {/* Packs Premium Groupés */}
      <h2 className="text-xl font-orbitron font-black text-white italic mb-8 border-l-4 theme-border pl-4 uppercase">PACKS DE SURCHARGE (FEDAPAY)</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
         <div className="glass-panel p-8 border-white/5 flex flex-col items-center group relative overflow-hidden transition-all hover:border-[var(--primary-color)]/30">
            <div className="absolute top-0 right-0 px-3 py-1 theme-bg text-[8px] font-black text-white italic uppercase">Starter</div>
            <span className="text-5xl mb-6 group-hover:scale-110 transition-transform">📦</span>
            <h3 className="text-lg font-orbitron font-black text-white italic mb-1 uppercase text-center">STARTER PACK</h3>
            <p className="text-[9px] text-gray-500 font-bold mb-6 text-center uppercase tracking-widest">500 💎 + Thème + 1 Carte Rare+</p>
            <button onClick={() => setPaymentItem({id: 'starter', title: "Starter Pack", price: 1.99})} className="w-full py-4 bg-white text-black font-black uppercase text-xs hover:theme-bg hover:text-white transition-all">1.99€</button>
         </div>
         <div className="glass-panel p-8 border-purple-500/20 flex flex-col items-center group relative overflow-hidden transition-all hover:border-purple-500/50">
            <div className="absolute top-0 right-0 px-3 py-1 bg-purple-600 text-[8px] font-black text-white italic uppercase">Popular</div>
            <span className="text-5xl mb-6 group-hover:scale-110 transition-transform">⚔️</span>
            <h3 className="text-lg font-orbitron font-black text-white italic mb-1 uppercase text-center">ELITE BUNDLE</h3>
            <p className="text-[9px] text-gray-500 font-bold mb-6 text-center uppercase tracking-widest">2000 💎 + Thème + 1 Carte Epic+</p>
            <button onClick={() => setPaymentItem({id: 'elite', title: "Elite Bundle", price: 4.99})} className="w-full py-4 bg-purple-600 text-white font-black uppercase text-xs hover:bg-purple-500 transition-all">4.99€</button>
         </div>
         <div className="glass-panel p-8 border-yellow-500/20 flex flex-col items-center group relative overflow-hidden transition-all hover:border-yellow-500/50">
            <div className="absolute top-0 right-0 px-3 py-1 bg-yellow-600 text-[8px] font-black text-white italic uppercase">Legend</div>
            <span className="text-5xl mb-6 group-hover:scale-110 transition-transform">⚡</span>
            <h3 className="text-lg font-orbitron font-black text-white italic mb-1 uppercase text-center">GOD-MODE PACK</h3>
            <p className="text-[9px] text-gray-500 font-bold mb-6 text-center uppercase tracking-widest">10000 💎 + Thème + 1 Carte Divine+</p>
            <button onClick={() => setPaymentItem({id: 'god', title: "God-Mode Pack", price: 14.99})} className="w-full py-4 bg-yellow-600 text-black font-black uppercase text-xs hover:bg-yellow-500 transition-all">14.99€</button>
         </div>
      </div>

      {/* Thèmes Individuels (RESTAURÉS) */}
      <h2 className="text-xl font-orbitron font-black text-white italic mb-8 border-l-4 border-cyan-500 pl-4 uppercase">SPECTRES VISUELS (THÈMES)</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-16">
        {interfaceThemes.map(theme => {
          const isUnlocked = user.unlockedThemes.includes(theme.id);
          return (
            <div key={theme.id} className={`glass-panel p-6 flex flex-col items-center border-white/5 relative group transition-all ${isUnlocked ? 'opacity-50 grayscale' : 'hover:border-white/20'}`}>
              <span className="text-3xl mb-4">{theme.icon}</span>
              <h4 className="text-[10px] font-black text-white uppercase mb-4 text-center">{theme.name}</h4>
              <div className={`w-8 h-8 rounded-full ${theme.color} mb-6 shadow-lg`}></div>
              <button 
                onClick={() => !isUnlocked && setPaymentItem({id: 'theme_only', title: `Thème ${theme.name}`, price: theme.price, themeId: theme.id})}
                className={`w-full py-2 text-[10px] font-black uppercase tracking-widest transition-all ${isUnlocked ? 'bg-zinc-800 text-gray-500' : 'bg-white text-black hover:theme-bg hover:text-white'}`}
              >
                {isUnlocked ? 'ACQUIS' : `${theme.price}€`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Invocations Top 100 */}
      <h2 className="text-xl font-orbitron font-black text-white italic mb-8 border-l-4 theme-border pl-4 uppercase">UNITÉS TOP 100 (DIAMANTS)</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="glass-panel p-8 flex flex-col items-center border-white/5 hover:theme-border transition-all group">
          <span className="text-6xl mb-6 group-hover:rotate-12 transition-transform">📦</span>
          <h3 className="text-lg font-orbitron font-black text-white mb-2 italic">STANDARD</h3>
          <p className="text-[9px] text-gray-500 font-bold mb-6 uppercase tracking-widest text-center">TIRAGE UNITÉ RARE+</p>
          <button onClick={() => handleDrawWithDiamonds('Rare', 100)} className="w-full py-4 bg-white text-black font-black uppercase text-xs hover:theme-bg hover:text-white transition-all">100 💎</button>
        </div>
        <div className="glass-panel p-8 flex flex-col items-center border-purple-500/30 bg-purple-500/5 hover:border-purple-400 transition-all group">
          <span className="text-6xl mb-6 group-hover:rotate-12 transition-transform">🔥</span>
          <h3 className="text-lg font-orbitron font-black text-white mb-2 italic">ELITE</h3>
          <p className="text-[9px] text-gray-500 font-bold mb-6 uppercase tracking-widest text-center">TIRAGE UNITÉ EPIC+</p>
          <button onClick={() => handleDrawWithDiamonds('Epic', 500)} className="w-full py-4 bg-purple-600 text-white font-black uppercase text-xs hover:bg-purple-500 transition-all">500 💎</button>
        </div>
        <div className="glass-panel p-8 flex flex-col items-center border-yellow-500/30 bg-yellow-500/5 hover:border-yellow-400 transition-all group">
          <span className="text-6xl mb-6 group-hover:rotate-12 transition-transform">✨</span>
          <h3 className="text-lg font-orbitron font-black text-white mb-2 italic uppercase text-center">DIVINE</h3>
          <p className="text-[9px] text-gray-500 font-bold mb-6 uppercase tracking-widest text-center">TIRAGE UNITÉ DIVINE+</p>
          <button onClick={() => handleDrawWithDiamonds('Divine', 2000)} className="w-full py-4 bg-yellow-600 text-black font-black uppercase text-xs hover:bg-yellow-500 transition-all">2000 💎</button>
        </div>
      </div>

      {openingPack && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center flex-col animate-in fade-in duration-500 backdrop-blur-md">
          <div className="w-24 h-24 border-t-2 theme-border rounded-full animate-spin mb-8"></div>
          <span className="text-white font-orbitron font-black italic tracking-[0.5em] animate-pulse uppercase">{statusMsg}</span>
        </div>
      )}

      {newCard && (
        <div className="fixed inset-0 z-[250] bg-black/98 flex items-center justify-center p-6 animate-in zoom-in duration-500 backdrop-blur-md">
          <div className="max-w-xs w-full glass-panel p-5 border-white/30 flex flex-col items-center shadow-2xl">
            <h2 className="text-2xl font-orbitron font-black text-white mb-6 animate-bounce uppercase italic">SIGNAL IDENTIFIÉ</h2>
            <div className="w-full aspect-[3/4] relative mb-6 overflow-hidden border border-white/10 shadow-inner">
              <img src={newCard.imageUrl} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"></div>
              <div className="absolute bottom-4 left-0 w-full text-center">
                <span className="px-4 py-1 theme-bg text-[10px] font-black text-white uppercase tracking-widest">{newCard.rarity}</span>
              </div>
            </div>
            <div className="text-center w-full mb-8">
              <h3 className="text-xl font-orbitron font-black text-white uppercase italic truncate leading-none px-2">{newCard.characterName}</h3>
              <p className="text-[8px] text-gray-500 font-black uppercase tracking-[0.3em] mt-2">{newCard.anime}</p>
            </div>
            <button onClick={finalizeCardAcquisition} className="w-full py-5 bg-white text-black font-black uppercase text-xs tracking-widest hover:theme-bg hover:text-white transition-all shadow-xl">TRANSMETTRE AU DECK</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shop;