import React, { useState, useEffect } from 'react';
import { useGame } from '../lib/gameStore';
import { playSound } from '../lib/audio';
import { callGeminiWithRetry, getModelForTask } from '../lib/ai';

const Personality: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { setPersonality, user } = useGame();
  const [questions, setQuestions] = useState<{ question: string; options: { text: string; trait: string }[] }[]>([]);
  const [step, setStep] = useState(0);
  const [choices, setChoices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(user.personalityMatch || null);
  const [isTakingTest, setIsTakingTest] = useState(!user.personalityMatch);

  const fetchAIQuestions = async () => {
    setLoading(true);
    setIsTakingTest(true);
    try {
      const data = await callGeminiWithRetry(async (ai) => {
        const res = await ai.models.generateContent({
          model: getModelForTask('text'),
          contents: "Génère 5 questions de personnalité totalement imprévisibles et créatives sur l'univers des anime. Mélange des situations de vie quotidienne, des dilemmes moraux et des choix métaphysiques. Langue : Français. Format JSON strict : { questions: Array<{ question: string, options: Array<{ text: string, trait: string }> }> }",
          config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(res.text || '{"questions":[]}');
      }, `personality_quiz_v1`);
      
      setQuestions(data.questions);
    } catch (err) {
      console.error("Erreur questions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user.personalityMatch && !result) {
      fetchAIQuestions();
    }
  }, [user.personalityMatch]);

  const handleChoice = async (option: any) => {
    const nextChoices = [...choices, `${option.text} (${option.trait})`];
    setChoices(nextChoices);
    playSound('click', user.settings.volume);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setAnalyzing(true);
      try {
        const data = await callGeminiWithRetry(async (ai) => {
          const analysis = await ai.models.generateContent({
            model: getModelForTask('text'),
            contents: `Analyse psychologique : [${nextChoices.join(", ")}]. 
            MISSION : Identifie le personnage ICONIQUE appartenant EXCLUSIVEMENT aux TOP 100 ANIME mondiaux (ex: Naruto, L, Levi, Guts, Luffy, Alucard, etc.) qui correspond à ce profil. 
            VÉRIFIE : Le nom de l'anime doit être exact et reconnu.
            Format JSON : { name, anime, description, rarity, visualContext }`,
            config: { responseMimeType: 'application/json' }
          });
          return JSON.parse(analysis.text || '{}');
        });

        const finalData = {
          name: data.name || "Guerrier Légendaire",
          anime: data.anime || "Anime Top 100",
          description: data.description || "Un esprit complexe dont la destinée est liée aux plus grandes épopées.",
          rarity: "Legendary",
          visualContext: data.visualContext || "cinematic anime style"
        };

        const imgUrl = await callGeminiWithRetry(async (ai) => {
          const imgRes = await ai.models.generateContent({
            model: getModelForTask('image'),
            contents: { parts: [{ text: `High-end anime key visual: ${finalData.name} from "${finalData.anime}". Masterpiece production, iconic pose, atmospheric, 8k. NO TEXT.` }] },
            config: { imageConfig: { aspectRatio: "3:4" } }
          });
          for (const part of imgRes.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
          }
          return "https://picsum.photos/seed/personality/400/600";
        });

        const resObj = { ...finalData, imageUrl: imgUrl };
        setResult(resObj);
        setPersonality(resObj);
        setIsTakingTest(false);
      } catch (err) {
        console.error("Erreur d'analyse:", err);
      } finally {
        setAnalyzing(false);
      }
    }
  };

  if (loading || analyzing) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black">
      <div className="w-16 h-16 border-t-2 border-[var(--primary-color)] rounded-full animate-spin mb-8"></div>
      <p className="theme-text font-orbitron font-black text-[10px] tracking-[0.5em] animate-pulse uppercase">
        {loading ? "INITIALISATION NEURALE..." : "SCAN DES ARCHIVES TOP 100..."}
      </p>
    </div>
  );

  if (result && !isTakingTest) return (
    <div className="flex flex-col items-center justify-center min-h-screen py-24 px-6 bg-black page-transition">
      <div className="max-w-md w-full glass-panel rounded-sm overflow-hidden shadow-2xl animate-in zoom-in duration-500">
        <div className="relative group overflow-hidden">
          <img src={result.imageUrl} className="w-full aspect-[3/4] object-cover" alt={result.name} />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
          <span className="absolute top-4 right-4 px-4 py-1 bg-[var(--primary-color)] text-[10px] font-black italic text-white uppercase tracking-widest border-l-4 border-white">
            {result.rarity}
          </span>
        </div>
        <div className="p-8 text-center bg-zinc-950/90 border-t border-white/5">
          <h2 className="text-4xl font-orbitron font-black text-white mb-1 italic tracking-tighter uppercase leading-none">{result.name}</h2>
          <p className="theme-text font-bold text-[10px] uppercase tracking-[0.5em] mb-6">{result.anime}</p>
          <p className="text-gray-300 text-sm leading-relaxed mb-8 italic px-4">{result.description}</p>
          
          <div className="flex flex-col gap-3">
            <button onClick={() => onNavigate('home')} className="w-full py-5 bg-white text-black font-black uppercase tracking-[0.4em] text-xs hover:bg-[var(--primary-color)] hover:text-white transition-all">RETOUR HUB</button>
            <button onClick={fetchAIQuestions} className="w-full py-3 text-gray-500 font-bold text-[10px] uppercase tracking-widest hover:text-white transition-colors">NOUVELLE ANALYSE</button>
          </div>
        </div>
      </div>
    </div>
  );

  const currentQ = questions[step];
  if (!currentQ) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen pt-24 px-6 max-w-2xl mx-auto page-transition">
      <div className="w-full mb-12">
        <span className="text-[10px] theme-text font-black tracking-[0.4em] uppercase">Moteur de Personnalité v2.0</span>
        <h2 className="text-5xl font-orbitron font-black italic tracking-tighter text-white uppercase">SONDAGE <span className="theme-text">{step + 1}</span></h2>
      </div>

      <div className="w-full glass-panel p-10 border-[var(--primary-color)]/20 mb-8">
        <h3 className="text-2xl md:text-3xl font-black text-white uppercase italic leading-tight">{currentQ.question}</h3>
      </div>

      <div className="grid grid-cols-1 gap-4 w-full">
        {currentQ.options.map((opt, i) => (
          <button key={i} onClick={() => handleChoice(opt)} className="group p-6 text-left border border-white/5 bg-white/5 hover:bg-[var(--primary-color)]/10 hover:border-[var(--primary-color)]/50 transition-all">
            <span className="text-gray-400 group-hover:text-white font-bold transition-colors text-lg uppercase tracking-tight italic">{opt.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Personality;