
import { Quiz } from '../types';

export const QUIZZES: Quiz[] = [
  {
    id: "quiz_001",
    type: "image",
    difficulty: 1,
    images: ["https://picsum.photos/seed/naruto_leaf/800/450"],
    question: "Dans Naruto, quel est le titre donné au chef du village caché de la Feuille (Konoha) ?",
    choices: ["Kazekage", "Hokage", "Raikage", "Mizukage"],
    answer: "Hokage",
    xp: 50
  },
  {
    id: "quiz_002",
    type: "image",
    difficulty: 2,
    images: ["https://picsum.photos/seed/onepiece_fruit/800/450"],
    question: "Quel est le véritable nom du Fruit du Démon mangé par Monkey D. Luffy ?",
    choices: ["Gomu Gomu no Mi", "Hito Hito no Mi, Modèle: Nika", "Mera Mera no Mi", "Hana Hana no Mi"],
    answer: "Hito Hito no Mi, Modèle: Nika",
    acceptedAnswers: ["Hito Hito no Mi Model Nika", "Sun God Nika"],
    xp: 75
  },
  {
    id: "quiz_003",
    type: "image",
    difficulty: 3,
    images: ["https://picsum.photos/seed/jujutsu_domain/800/450"],
    question: "Comment s'appelle l'Extension du Territoire de Satoru Gojo ?",
    choices: ["Reliquaire Maléfique", "Vide Infini", "Jardin des Ombres Chimériques", "Auto-incarnation de la Perfection"],
    answer: "Vide Infini",
    xp: 100
  },
  {
    id: "quiz_004",
    type: "image",
    difficulty: 2,
    images: ["https://picsum.photos/seed/aot_basement/800/450"],
    question: "Dans L'Attaque des Titans, quel est le secret caché dans la cave du père d'Eren ?",
    choices: ["L'existence des murs", "L'origine des Titans", "L'existence d'une civilisation extérieure", "Le pouvoir du Titan Colossal"],
    answer: "L'existence d'une civilisation extérieure",
    xp: 80
  },
  {
    id: "quiz_005",
    type: "image",
    difficulty: 4,
    images: ["https://picsum.photos/seed/hxh_nen/800/450"],
    question: "Dans Hunter x Hunter, à quelle catégorie de Nen appartient Kurapika lorsqu'il utilise ses 'Scarlet Eyes' ?",
    choices: ["Matérialisation", "Renforcement", "Spécialisation", "Manipulation"],
    answer: "Spécialisation",
    xp: 150
  }
];
