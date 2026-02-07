import { GoogleGenAI } from "@google/genai";

const MAX_RETRIES = 4;
const INITIAL_DELAY = 4000;

const responseCache: Record<string, any> = {};

const getSafeApiKey = () => {
  // 1. Check process.env (Standard Node/Webpack/Parcel)
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  // 2. Check import.meta.env (Vite Standard)
  try {
    // @ts-ignore
    if (import.meta && import.meta.env && import.meta.env.VITE_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_API_KEY;
    }
  } catch (e) {}

  // 3. Fallback si l'utilisateur a configuré 'API_KEY' dans Vercel mais utilise Vite (qui requiert VITE_)
  // Note: Ceci ne fonctionnera que si le bundler est configuré pour exposer API_KEY, mais c'est une sécurité.
  try {
    // @ts-ignore
    if (import.meta && import.meta.env && import.meta.env.API_KEY) {
      // @ts-ignore
      return import.meta.env.API_KEY;
    }
  } catch (e) {}

  return "";
};

export const callGeminiWithRetry = async (
  task: (ai: GoogleGenAI) => Promise<any>,
  cacheKey?: string,
  onRetry?: (attempt: number, delay: number) => void
): Promise<any> => {
  if (cacheKey && responseCache[cacheKey]) return responseCache[cacheKey];

  let lastError: any;
  const apiKey = getSafeApiKey();
  
  if (!apiKey) {
    console.warn("API Key manquante. Vérifiez la configuration Vercel (API_KEY).");
  }

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const result = await task(ai);
      if (cacheKey) responseCache[cacheKey] = result;
      return result;
    } catch (error: any) {
      lastError = error;
      const errorMsg = error?.message?.toLowerCase() || "";
      const isQuotaError = errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("exhausted");
      
      if (isQuotaError && i < MAX_RETRIES - 1) {
        const delay = INITIAL_DELAY * Math.pow(2, i);
        if (onRetry) onRetry(i + 1, delay);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
};

export const getModelForTask = (type: 'text' | 'image' | 'pro') => {
  if (type === 'image') return 'gemini-2.5-flash-image';
  if (type === 'pro') return 'gemini-3-pro-preview';
  return 'gemini-3-flash-preview';
};

export const generateAnimeImage = async (prompt: string, fallbackSeed: string) => {
  try {
    return await callGeminiWithRetry(async (ai) => {
      const imgRes = await ai.models.generateContent({
        model: getModelForTask('image'),
        contents: { parts: [{ text: `OFFICIAL ANIME ART: ${prompt}. Studio high-quality key visual, 4K, no text.` }] },
        config: { imageConfig: { aspectRatio: "16:9" } }
      });
      for (const part of imgRes.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
      throw new Error("No image data");
    }, `img_${prompt.slice(0, 30)}`);
  } catch (e) {
    return `https://picsum.photos/seed/${fallbackSeed}/800/450?grayscale`;
  }
};