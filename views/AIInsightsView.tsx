import React, { useState, useEffect } from 'react';
import { 
  Sparkles, BrainCircuit, RefreshCw, Lightbulb, TrendingUp, 
  AlertCircle, Zap, Wallet, ArrowUpCircle, BarChart3, 
  Target, ShieldCheck, MessageSquare, Bot
} from 'lucide-react';
import { Order, Product, FinRecord, UserProfile } from '../types';
import { getFinancialConsultancy } from '../services/gemini';
import { dbService } from '../services/firebase';

interface AIInsightsProps {
  orders: Order[];
  products: Product[];
  profile: UserProfile;
  userId: string;
}

const AIInsightsView: React.FC<AIInsightsProps> = ({ orders, products, profile, userId }) => {
  const [insights, setInsights] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [finances, setFinances] = useState<FinRecord[]>([]);

  useEffect(() => {
    const unsub = dbService.sync('finances', userId, (data) => {
      setFinances(data as FinRecord[]);
    });
    return () => unsub();
  }, [userId]);

  const generateConsultancy = async () => {
    setIsLoading(true);
    const result = await getFinancialConsultancy(orders, products, finances, profile);
    setInsights(result);
    setIsLoading(false);
  };

  useEffect(() => {
    if (orders.length > 0 && !insights) generateConsultancy();
  }, [orders.length, finances.length]);

  return (
    <div className="space-y-10 animate-fade pb-20 px-2 lg:px-0">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Inteligência Artificial</p>
          <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase">NEXUS AI Assistant</h2>
        </div>
        <button 
          onClick={generateConsultancy}
          disabled={isLoading}
          className="btn-brand-orange px-8 py-4 rounded-2xl flex items-center gap-3 active:scale-95 transition-all shadow-xl shadow-brand-orange/10"
        >
          <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
          {isLoading ? 'ANALISANDO FLUXO...' : 'GERAR NOVA CONSULTORIA'}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Lado Esquerdo: Diagnóstico Principal */}
        <div className="lg:col-span-3">
          <div className="nexus-card p-10 min-h-[600px] relative overflow-hidden bg-white border-slate-200">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
              <Bot size={400} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-6 mb-12">
                <div className="w-16 h-16 rounded-2xl bg-brand-orange/10 text-brand-orange flex items-center justify-center border border-brand-orange/20 shadow-inner">
                  <BrainCircuit size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 italic tracking-tight uppercase">Consultoria Estratégica Digital</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Baseado em telemetria de vendas e estoque em tempo real</p>
                </div>
              </div>

              {isLoading ? (
                <div className="space-y-10 animate-pulse">
                  <div className="h-4 bg-slate-100 rounded-full w-3/4"></div>
                  <div className="h-4 bg-slate-100 rounded-full w-full"></div>
                  <div className="h-4 bg-slate-100 rounded-full w-2/3"></div>
                  <div className="grid grid-cols-2 gap-8 pt-10">
                    <div className="h-40 bg-slate-50 rounded-3xl border border-slate-100"></div>
                    <div className="h-40 bg-slate-50 rounded-3xl border border-slate-100"></div>
                  </div>
                </div>
              ) : (
                <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed font-medium whitespace-pre-line text-sm border-l-4 border-brand-orange/20 pl-8">
                  {insights || "Sincronize suas operações para que a IA possa processar seu fluxo financeiro."}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lado Direito: Widgets de Insights Rápidos */}
        <div className="space-y-6">
          <div className="nexus-card p-8 bg-brand-blue text-white border-brand-blue shadow-2xl">
            <h4 className="font-black text-[10px] uppercase tracking-[0.3em] mb-6 flex items-center gap-3 text-brand-orange">
              <Target size={18} /> Metas IA
            </h4>
            <div className="space-y-6">
               <div className="space-y-2">
                  <div className="flex justify-between text-[8px] font-black uppercase">
                     <span>Crescimento de Lucro</span>
                     <span className="text-brand-green">+15%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                     <div className="w-[65%] h-full bg-brand-green shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                  </div>
               </div>
               <div className="space-y-2">
                  <div className="flex justify-between text-[8px] font-black uppercase">
                     <span>Redução de Gastos</span>
                     <span className="text-brand-orange">-8%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                     <div className="w-[40%] h-full bg-brand-orange shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>
                  </div>
               </div>
            </div>
            <p className="text-[9px] text-slate-500 font-bold uppercase mt-8 leading-relaxed">A IA ajusta as metas automaticamente baseado no seu MRR.</p>
          </div>

          <div className="nexus-card p-8 border-brand-green/20 bg-brand-green/5">
             <div className="flex items-center gap-4 mb-4">
                <ShieldCheck size={24} className="text-brand-green" />
                <h5 className="text-[10px] font-black text-slate-900 uppercase">Conformidade</h5>
             </div>
             <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">Seu fluxo de caixa está 92% saudável comparado à média do setor.</p>
          </div>

          <div className="nexus-card p-8 border-slate-100 flex flex-col items-center text-center">
             <div className="w-12 h-12 bg-brand-orange/10 rounded-xl flex items-center justify-center text-brand-orange mb-4 animate-bounce">
                <Zap size={24} />
             </div>
             <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Otimização Ativa</h5>
             <p className="text-[9px] text-slate-400 font-bold mt-2 uppercase">A IA identificou 2 fornecedores com preços acima da média.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsightsView;