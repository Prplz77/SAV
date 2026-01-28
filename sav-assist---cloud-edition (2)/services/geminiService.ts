
import { GoogleGenAI, Type } from "@google/genai";
import { CallSummary } from "../types";

/**
 * Résumé rapide utilisant gemini-2.5-flash-lite pour une latence minimale.
 */
export const summarizeCall = async (
  rawNotes: string, 
  technicalDetails?: { productType: string; brand: string; gatewayReplaced: boolean }
): Promise<CallSummary> => {
  // On initialise l'IA juste avant l'appel pour plus de sécurité sur Vercel
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite-latest',
    contents: `Tu es un expert SAV CVC (Chauffage Ventilation Climatisation). 
    Contexte technique - Marque: ${technicalDetails?.brand}, Produit: ${technicalDetails?.productType}.
    Instructions : Analyse les notes suivantes et produis un rapport structuré au format JSON uniquement.
    Notes à analyser : ${rawNotes}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING, description: "Titre court de l'intervention" },
          issue: { type: Type.STRING, description: "Description du problème rencontré" },
          solution: { type: Type.STRING, description: "Actions entreprises par le technicien" },
          nextSteps: { type: Type.STRING, description: "Préconisations ou pièces à commander" },
          sentiment: { type: Type.STRING, enum: ["positive", "neutral", "negative"] }
        },
        required: ["subject", "issue", "solution", "nextSteps", "sentiment"]
      }
    }
  });

  return JSON.parse(response.text || '{}') as CallSummary;
};

/**
 * Analyse complexe utilisant gemini-3-pro-preview avec thinkingBudget pour les diagnostics difficiles.
 */
export const deepAnalyzeCall = async (
  rawNotes: string,
  technicalDetails: { brand: string; productType: string }
): Promise<CallSummary> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `ANALYSE EXPERTE SAV.
    Notes du technicien : ${rawNotes}
    Équipement : ${technicalDetails.brand} - ${technicalDetails.productType}.
    Produis un diagnostic approfondi en JSON.`,
    config: {
      thinkingConfig: { thinkingBudget: 32768 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING },
          issue: { type: Type.STRING, description: "Analyse des causes racines et probabilités" },
          solution: { type: Type.STRING, description: "Tests avancés et mesures électriques à effectuer" },
          nextSteps: { type: Type.STRING, description: "Solution définitive préconisée" },
          sentiment: { type: Type.STRING, enum: ["positive", "neutral", "negative"] }
        },
        required: ["subject", "issue", "solution", "nextSteps", "sentiment"]
      }
    }
  });

  return JSON.parse(response.text || '{}') as CallSummary;
};
