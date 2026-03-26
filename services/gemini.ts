
import { GoogleGenAI } from "@google/genai";
import { Order, Product, FinRecord, UserProfile } from "../types";

export async function getFinancialConsultancy(
  orders: Order[], 
  products: Product[], 
  finances: FinRecord[], 
  profile: UserProfile
) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const today = new Date().toLocaleDateString('pt-BR');
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const costs = finances.filter(f => f.status === 'PAID').reduce((s, f) => s + f.amount, 0);
  
  const prompt = `
    Aja como o FACINDEMAIS AI ADVISOR. Analise RÁPIDO o escritório: "${profile.officeName}".
    DATA: ${today}

    MÉTRICAS:
    - Faturamento: R$ ${revenue.toFixed(2)}
    - Gastos: R$ ${costs.toFixed(2)}
    - Lucro Est.: R$ ${(revenue - costs).toFixed(2)}
    - Vendas: ${orders.length}
    - Estoque: ${products.length} itens

    FORNEÇA UM RELATÓRIO CURTO (4 TÓPICOS):
    1. 📊 **Status Financeiro**: Diagnóstico ultra-rápido do caixa.
    2. ⚠️ **Alerta Crítico**: O que precisa de atenção imediata (estoque ou gastos).
    3. 🚀 **Ação do Dia**: Uma sugestão para aumentar o faturamento hoje.
    4. 📈 **Projeção**: Tendência para os próximos dias.

    Linguagem: Profissional, ultra-direta e motivadora. Use Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error: any) {
    console.error("AI Assistant Failure:", error);
    if (error?.status === "RESOURCE_EXHAUSTED" || error?.code === 429) {
      return "### Limite de Cota Atingido\nAguarde um instante para nova análise.";
    }
    return "### Falha na Conexão Neural\nConsultor indisponível no momento.";
  }
}
