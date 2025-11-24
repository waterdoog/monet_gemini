import { GoogleGenAI, Type } from "@google/genai";
import { GeminiCritique, RenderParams } from "../types";
import { GEMINI_MODEL_VISION } from "../constants";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const analyzeScene = async (base64Image: string): Promise<GeminiCritique> => {
  if (!apiKey) {
    throw new Error("API Key is missing");
  }

  // Remove data URL prefix if present
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_VISION,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data
            }
          },
          {
            text: `You are the spirit of Claude Monet. Analyze this image. 
            1. Provide a brief, poetic critique of the composition, light, and mood (max 2 sentences).
            2. Suggest numerical adjustments for a digital painting filter to match this scene's mood.
            
            Return JSON with keys: "critique" (string), "suggestedParams" (object with brushSize (5-30), intensity (20-100), saturation (50-150), luminosity (80-150), styleWeight (20-90)).`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            critique: { type: Type.STRING },
            suggestedParams: {
              type: Type.OBJECT,
              properties: {
                brushSize: { type: Type.NUMBER },
                intensity: { type: Type.NUMBER },
                saturation: { type: Type.NUMBER },
                luminosity: { type: Type.NUMBER },
                styleWeight: { type: Type.NUMBER }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text) as GeminiCritique;

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return {
      critique: "The mists of Giverny obscure my vision currently...",
    };
  }
};
