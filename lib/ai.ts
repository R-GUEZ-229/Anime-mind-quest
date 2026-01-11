import { GoogleGenAI } from "@google/genai";

const MAX_RETRIES = 3;
const INITIAL_DELAY = 3000;

const responseCache: Record<string, any> = {};

const getSafeApiKey = () => {
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
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
  
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const result = await task(ai);
      if (cacheKey) responseCache[cacheKey] = result;
      return result;
    } catch (error: any) {
      lastError = error;
      const errorMsg = error?.message?.toLowerCase() || "";
      const isRateLimit = errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("exhausted");
      
      if (isRateLimit && i < MAX_RETRIES - 1) {
        const delay = INITIAL_DELAY * (i + 1);
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
  return 'gemini-flash-lite-latest';
};

export const generateAnimeImage = async (prompt: string, fallbackSeed: string) => {
  try {
    return await callGeminiWithRetry(async (ai) => {
      const imgRes = await ai.models.generateContent({
        model: getModelForTask('image'),
        contents: { parts: [{ text: `OFFICIAL ANIME ART: ${prompt}. Studio high-quality key visual, 4K, no text, accurate character features.` }] },
        config: { imageConfig: { aspectRatio: "16:9" } }
      });
      for (const part of imgRes.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
      throw new Error("No image data");
    }, `img_${prompt}`);
  } catch (e) {
    return `https://cdn.pixabay.com/photo/2023/04/24/09/27/ai-generated-7947654_1280.jpg`;
  }
};