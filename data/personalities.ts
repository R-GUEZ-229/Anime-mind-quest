
import { PersonalityQuestion } from '../types';

export const PERSONALITY_QUESTIONS: PersonalityQuestion[] = [
  {
    id: "p_1",
    question: "Quelle est ta philosophie de combat ?",
    options: [
      { text: "La puissance brute avant tout.", traits: { strength: 5, aggressive: 5 } },
      { text: "L'intelligence et la stratégie.", traits: { intelligence: 5, calm: 3 } },
      { text: "L'instinct et l'improvisation.", traits: { instinct: 5, wild: 3 } },
      { text: "Éviter le combat à tout prix.", traits: { pacifist: 5, clever: 3 } }
    ]
  },
  {
    id: "p_2",
    question: "Qu'est-ce qui te motive à te lever le matin ?",
    options: [
      { text: "Protéger ceux qui me sont chers.", traits: { protective: 5, loyal: 5 } },
      { text: "Devenir le meilleur dans mon domaine.", traits: { ambitious: 5, focus: 5 } },
      { text: "Découvrir de nouveaux horizons.", traits: { curious: 5, adventurous: 4 } },
      { text: "La quête de vengeance ou de justice.", traits: { justice: 5, dark: 3 } }
    ]
  },
  {
    id: "p_3",
    question: "Face à une injustice flagrante, tu...",
    options: [
      { text: "Interviens immédiatement sans réfléchir.", traits: { heroic: 5, impulsive: 4 } },
      { text: "Prépare un plan pour démanteler le système.", traits: { strategist: 5, patient: 4 } },
      { text: "Attends le bon moment pour frapper.", traits: { assassin: 4, cool: 5 } },
      { text: "Hésites car tu as peur des conséquences.", traits: { realistic: 4, fearful: 3 } }
    ]
  },
  {
    id: "p_4",
    question: "Ton type d'environnement idéal ?",
    options: [
      { text: "Une métropole cyberpunk futuriste.", traits: { tech: 5, urban: 4 } },
      { text: "Un village paisible en pleine nature.", traits: { zen: 5, simple: 4 } },
      { text: "Un champ de bataille médiéval.", traits: { warrior: 5, epic: 4 } },
      { text: "Une école mystérieuse.", traits: { magic: 5, school: 3 } }
    ]
  },
  {
    id: "p_5",
    question: "Quel est ton plus grand défaut ?",
    options: [
      { text: "Mon arrogance.", traits: { pride: 5, god_complex: 3 } },
      { text: "Ma naïveté.", traits: { innocent: 5, pure: 4 } },
      { text: "Mon manque d'empathie.", traits: { cold: 5, logic: 5 } },
      { text: "Ma paresse.", traits: { lazy: 5, genius: 4 } }
    ]
  }
];
