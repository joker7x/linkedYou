
import { GoogleGenAI, Type } from "@google/genai";
import { LightDrug, DeepMarketAnalysis } from "../types.ts";



/**
 * Performs deep market analysis using Gemini Pro.
 * Utilizes a structured response schema for consistent results.
 */
export const analyzeFullMarketDeeply = async (allDrugs: LightDrug[], onProgress: (msg: string) => void): Promise<DeepMarketAnalysis> => {
    // Directly access process.env.GEMINI_API_KEY as per guidelines.
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing API Key");
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        onProgress('تحليل سلوكيات الشركات...');
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: `Analyze these drugs market sentiment: ${JSON.stringify(allDrugs.slice(0, 5))}. Return in Arabic JSON.`,
            config: { 
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  sentiment: { type: Type.STRING, description: 'General market sentiment in Arabic' },
                  trend: { type: Type.STRING, description: 'Identified market trend in Arabic' },
                  recommendation: { type: Type.STRING, description: 'Actionable recommendation in Arabic' }
                },
                required: ["sentiment", "trend", "recommendation"]
              }
            }
        });
        
        // Access response.text directly.
        const jsonStr = response.text?.trim() || "{}";
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Gemini AI Market Analysis Error:", e);
        throw new Error("Analysis Failed");
    }
};
