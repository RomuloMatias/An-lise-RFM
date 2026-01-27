
import { GoogleGenAI } from "@google/genai";
import { SegmentSummary } from "../types";

export const getAIInsights = async (summaries: SegmentSummary[]): Promise<string> => {
  // Fix: Initializing GoogleGenAI with named parameter and direct process.env.API_KEY as per guidelines.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Analise os seguintes segmentos de clientes baseados em uma análise RFM (Recência, Frequência, Valor Monetário):
    ${JSON.stringify(summaries, null, 2)}

    Com base nesses dados, forneça:
    1. Uma visão geral da saúde da base de clientes.
    2. Identifique os 2 segmentos mais críticos que precisam de intervenção imediata.
    3. Sugira 3 estratégias de marketing personalizadas para os 'Campeões'.
    4. Sugira uma estratégia para reativar clientes 'Em Risco'.
    
    Responda em Português do Brasil com um tom profissional e acionável. Use formatação Markdown (negritos, listas).
  `;

  try {
    // Fix: Using ai.models.generateContent with correct model name and prompt structure.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    });

    // Fix: Accessing .text as a property directly (not a method).
    return response.text || "Não foi possível gerar insights no momento.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Erro ao conectar com a inteligência artificial. Verifique se a chave API está configurada.";
  }
};
