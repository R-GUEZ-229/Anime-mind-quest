
import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../lib/gameStore';
import { QUIZZES as STATIC_QUIZZES } from '../data/quizzes';
import { Quiz } from '../types';
import ProgressBar from '../components/ProgressBar';
import { playSound } from '../lib/audio';
import { callGeminiWithRetry, getModelForTask, generateAnimeImage } from '../lib/ai';

const TOP_100_ANIME = [
  "Attack on Titan", "Death Note", "Naruto", "One Piece", "Dragon Ball", "Jujutsu Kaisen", "Demon Slayer", "Fullmetal Alchemist", "Hunter x Hunter", "Bleach", "Berserk", "Evangelion", "Code Geass", "Steins;Gate", "Vinland Saga", "JoJo’s Bizarre Adventure", "Chainsaw Man", "Tokyo Ghoul", "Akira", "Cyberpunk Edgerunners",
  "My Hero Academia", "Black Clover", "Fairy Tail", "Sword Art Online", "Re:Zero", "No Game No Life", "Dr Stone", "Fire Force", "Blue Lock", "Haikyuu", "Monster", "Psycho-Pass", "Gurren Lagann", "Fate/Zero", "Fate/Stay Night", "Magi", "Made in Abyss", "Tokyo Revengers", "Erased", "Parasyte", "Devilman Crybaby", "Dororo", "Samurai Champloo", "Cowboy Bebop", "Trigun", "Black Lagoon", "Elfen Lied", "Great Teacher Onizuka", "Death Parade", "Violet Evergarden", "Mushoku Tensei", "Overlord", "The Promised Neverland", "Hellsing Ultimate", "Inuyasha", "Yu Yu Hakusho", "Dorohedoro", "Angel Beats", "Clannad", "Akame ga Kill",
  "Blue Exorcist", "Noragami", "Soul Eater", "Assassination Classroom", "Tower of God", "God of High School", "Seraph of the End", "Baki", "Kengan Ashura", "Record of Ragnarok", "Zankyou no Terror", "FLCL", "Ergo Proxy", "Another", "Charlotte", "Future Diary", "Beastars", "Ajin", "Pluto", "Odd Taxi", "Ranking of Kings", "91 Days", "Banana Fish", "Texhnolyze", "Kaiji", "Hajime no Ippo", "Initial D", "Megalo Box", "Slam Dunk", "One Punch Man", "Mob Psycho 100", "Tower of God", "Classroom of the Elite", "Highschool of the Dead", "Afro Samurai", "Devil May Cry", "Kuroko no Basket", "Great Pretender", "Bungo Stray Dogs", "Solo Leveling"
];

const Play: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user, addXP, loseHeart, completeQuiz, gainDiamonds, refillHeartsWithDiamonds } = useGame();
  const [quizBuffer, setQuizBuffer] = useState<Quiz[]>([]);
  const [currentIdxInLevel, setCurrentIdxInLevel] = useState(user.completedQuizzes.length);
  const [timeLeft, setTimeLeft] = useState(25);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("Synchronisation du Lore...");
  const [effect, setEffect] = useState<'shake' | 'flash' | 'red-flash' | 'critical' | null>(null);
  
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFetchingRef = useRef(false);

  const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").replace(/\s+/g, " ").trim();

  const fetchQuizBatch = async (startIndex: number) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);

    try {
      const levelProgress = Math.min(100, Math.floor(startIndex / 1) + 1);
      const targetAnime = TOP_100_ANIME[(levelProgress - 1) % TOP_100_ANIME.length];
      
      setStatusMessage(`ACCÈS AUX ARCHIVES : ${targetAnime.toUpperCase()}...`);

      // RATIO : 95% QCM / 5% Saisie (si niveau > 75)
      const forceInput = levelProgress > 75 && Math.random() < 0.05; 
      const quizTypeConstraint = forceInput ? "input (réponse texte courte)" : "image (QCM avec 4 choix)";

      const data = await callGeminiWithRetry(async (ai) => {
        const response = await ai.models.generateContent({
          model: getModelForTask('text'),
          contents: `Génère 5 questions de niveau ${levelProgress}/100. 
          THÈME CENTRAL : "${targetAnime}".
          DIVERSITÉ REQUISE : Citations cultes, Arcs narratifs majeurs, Techniques secrètes, Objets/Artefacts, Scènes emblématiques.
          TYPE : ${quizTypeConstraint}.
          Langue : Français.
          Format JSON : { questions: Array<{ id, type, question, choices, answer, acceptedAnswers, animeTitle, visualSceneDescription }> }`,
          config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(response.text || '{"questions":[]}');
      }, `quizzes_v12_${levelProgress}_${Date.now()}`);

      const imagePromises = data.questions.map(async (bp: any, i: number) => {
        const imgPrompt = `Cinematic high-fidelity anime scene: ${bp.visualSceneDescription} from "${bp.animeTitle}". Studio production quality, 4K, no text.`;
        const imgData = await generateAnimeImage(imgPrompt, bp.animeTitle || targetAnime);
        
        return {
          id: `ai_${Date.now()}_${i}`,
          type: bp.type,
          difficulty: Math.min(5, Math.ceil(levelProgress / 20)),
          images: [imgData],
          question: bp.question,
          choices: bp.choices,
          answer: bp.answer,
          acceptedAnswers: bp.acceptedAnswers || [bp.answer],
          xp: 100 + (levelProgress * 2)
        };
      });
      
      const fullQuizzes = await Promise.all(imagePromises);
      setQuizBuffer(prev => [...prev, ...fullQuizzes]);
      setLoading(false);
    } catch (err) {
      setQuizBuffer(prev => [...prev, ...STATIC_QUIZZES]);
      setLoading(false);
    } finally { 
      isFetchingRef.current = false; 
    }
  };

  useEffect(() => {
    if (user.hearts > 0 && quizBuffer.length === 0 && !isFetchingRef.current) fetchQuizBatch(currentIdxInLevel);
  }, [user.hearts, currentIdxInLevel, quizBuffer.length]);

  useEffect(() => {
    if (timeLeft > 0 && !selectedAnswer && !loading && user.hearts > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => { if(timerRef.current) clearTimeout(timerRef.current); };
    } else if (timeLeft === 0 && !selectedAnswer && !loading && user.hearts > 0) {
      handleAnswer('TIMEOUT_VOID');
    }
  }, [timeLeft, selectedAnswer, loading, user.hearts]);

  const handleAnswer = (answer: string) => {
    const currentQuiz = quizBuffer[0];
    if (selectedAnswer || !currentQuiz) return;

    const isInputType = currentQuiz.type === 'input' || !currentQuiz.choices || currentQuiz.choices.length === 0;
    const normalizedInput = normalize(answer);
    const correct = isInputType 
      ? (currentQuiz.acceptedAnswers?.some(a => normalize(a) === normalizedInput) || normalize(currentQuiz.answer) === normalizedInput)
      : normalize(answer) === normalize(currentQuiz.answer);

    setSelectedAnswer(answer);
    setIsCorrect(correct);

    if (correct) {
      playSound('success', user.settings.volume);
      setEffect('critical');
      addXP(currentQuiz.xp);
      completeQuiz(currentQuiz.id);
      gainDiamonds(25);
    } else {
      playSound('error', user.settings.volume);
      setEffect('shake');
      loseHeart();
    }

    setTimeout(() => {
      setEffect(null); 
      setSelectedAnswer(null); 
      setInputText(""); 
      setIsCorrect(null);
      setTimeLeft(25); 
      setQuizBuffer(prev => prev.slice(1)); 
      setCurrentIdxInLevel(prev => prev + 1);
    }, 1800);
  };

  if (user.hearts <= 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black px-6 text-center page-transition">
        <h2 className="text-4xl font-orbitron font-black text-red-600 mb-8 italic uppercase tracking-tighter">LIEN NEURAL ROMPU</h2>
        <button onClick={() => refillHeartsWithDiamonds()} className="w-full max-w-xs py-5 bg-[var(--primary-color)] text-white font-black uppercase text-xs tracking-widest shadow-xl">RÉANIMATION (30 💎)</button>
        <button onClick={() => onNavigate('home')} className="mt-4 text-gray-500 uppercase font-bold text-[10px] tracking-widest">RETOUR AU HUB</button>
      </div>
    );
  }

  if (loading || quizBuffer.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black">
      <div className="w-16 h-16 border-t-2 border-[var(--primary-color)] rounded-full animate-spin mb-6"></div>
      <p className="theme-text font-orbitron font-black text-[10px] tracking-[0.5em] animate-pulse uppercase italic">{statusMessage}</p>
    </div>
  );

  const currentQuiz = quizBuffer[0];
  const isInputType = currentQuiz.type === 'input' || !currentQuiz.choices || currentQuiz.choices.length === 0;

  return (
    <div className={`flex flex-col items-center min-h-screen pt-32 pb-20 px-4 max-w-5xl mx-auto page-transition w-full ${effect === 'shake' ? 'animate-shake' : effect === 'critical' ? 'animate-critical' : ''}`}>
      <div className="w-full flex justify-between items-center mb-6">
        <h2 className="text-xl md:text-3xl font-orbitron font-black italic uppercase tracking-tighter text-white">NODE LEVEL {Math.floor(currentIdxInLevel / 1) + 1}</h2>
        <div className={`px-6 py-2 glass-panel border-r-4 ${timeLeft < 7 ? 'border-red-600 animate-pulse' : 'border-[var(--primary-color)]'}`}>
          <span className="font-orbitron font-black text-2xl">{timeLeft}:00</span>
        </div>
      </div>
      
      <div className="w-full mb-10">
        <ProgressBar current={currentIdxInLevel % 10} total={10} color="bg-[var(--primary-color)]" />
      </div>

      <div className="w-full glass-panel rounded-sm overflow-hidden border border-white/5 shadow-2xl relative">
        <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-red-600 text-[8px] font-black text-white italic uppercase tracking-widest">VISUAL LINK</div>
        <div className="relative aspect-video bg-zinc-950">
          <img src={currentQuiz.images[0]} alt="Quiz" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"></div>
        </div>
        
        <div className="p-8">
          <h3 className="text-xl md:text-2xl font-black italic mb-8 uppercase text-center tracking-tight leading-tight text-white">{currentQuiz.question}</h3>
          
          {isInputType ? (
            <form onSubmit={(e) => {e.preventDefault(); handleAnswer(inputText)}} className="space-y-4">
              <input 
                type="text" autoFocus value={inputText} disabled={!!selectedAnswer}
                onChange={(e) => setInputText(e.target.value)} 
                className={`w-full bg-white/5 border-2 p-5 font-orbitron font-black text-xl text-center outline-none uppercase transition-all ${isCorrect === true ? 'border-green-500 text-green-400' : isCorrect === false ? 'border-red-500 text-red-400' : 'border-white/10 focus:border-[var(--primary-color)] text-white'}`} 
                placeholder="RÉPONSE..." 
              />
              <button type="submit" disabled={!!selectedAnswer || !inputText.trim()} className="w-full py-4 bg-white text-black font-black uppercase tracking-widest hover:theme-bg hover:text-white transition-all theme-border border">ENVOYER</button>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuiz.choices?.map((c, i) => {
                const isSelected = selectedAnswer === c;
                const isCorrectChoice = normalize(c) === normalize(currentQuiz.answer);
                let btnStyle = "border-white/10 bg-white/5 hover:border-[var(--primary-color)]/50";
                if (isSelected) btnStyle = isCorrectChoice ? "bg-green-600/20 border-green-500 text-green-400" : "bg-red-600/20 border-red-500 text-red-400";
                else if (selectedAnswer && isCorrectChoice) btnStyle = "bg-green-600/10 border-green-500/50 text-green-400";
                
                return (
                  <button key={i} disabled={!!selectedAnswer} onClick={() => handleAnswer(c)} className={`py-5 px-8 border font-bold text-lg text-left uppercase transition-all text-white ${btnStyle}`}>
                    {c}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Play;
