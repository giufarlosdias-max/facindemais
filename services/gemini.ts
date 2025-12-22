
import { GoogleGenAI, Type } from "@google/genai";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const parseVoiceCommand = async (text: string) => {
  const ai = getAIClient();
  const prompt = `Analise o comando de voz: "${text}".
  Extraia a intenção (intent) entre: VENDA, GASTO ou AGENDA.
  
  Extraia:
  - valor: número (ex: 50.0)
  - cliente: nome da pessoa
  - telefone: número do whatsapp se mencionado (apenas números)
  - categoria: tipo (alimentação, estoque, serviços, etc)
  
  Responda estritamente em JSON:
  { "intent": "VENDA|GASTO|AGENDA", "data": { "valor": number, "cliente": string, "telefone": string, "categoria": string } }`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    return null;
  }
};

export const analyzeBusinessMetrics = async (data: any) => {
  const ai = getAIClient();
  const prompt = `Analise estas métricas de negócio e dê 3 insights estratégicos curtos: ${JSON.stringify(data)}`;
  const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
  return response.text || "";
};
