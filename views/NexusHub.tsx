
import React, { useState, useEffect } from 'react';
import { 
  Users, ShoppingCart, Package, Wallet, 
  FileText, Gift, Zap, Clock, Wrench, Building2, UserCircle, 
  ArrowUpRight, ChevronRight, AlertCircle, Calendar, Bot, Sparkles, Loader2, BrainCircuit
} from 'lucide-react';
import { ViewState, UserProfile, Order, Expense, Product, FinRecord } from '../types';
import { getFinancialConsultancy } from '../services/gemini';
import { dbService } from '../services/firebase';

interface NexusHubProps {
  setView: (v: ViewState) => void;
  profile: UserProfile;
  orders: Order[];
  expenses: Expense[];
  products: Product[];
}

const NexusHub: React.FC<NexusHubProps> = ({ setView, profile, orders, expenses, products }) => {
  const [insights, setInsights] = useState<string>('');
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [finances, setFinances] = useState<FinRecord[]>([]);
  
  const today = new Date().toLocaleDateString('pt-BR');
  const isSuper = profile.role === 'super-admin';
  
  const todayOrders = orders.filter(o => {
    const d = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString('pt-BR') : '';
    return d === today;
  });
  
  const totalRevenue = orders.filter(o => o.status === 'PAID').reduce((s, o) => s + o.total, 0);
  const totalFinExpenses = finances.filter(f => f.status === 'PAID').reduce((s, e) => s + e.amount, 0);
  const balance = totalRevenue - totalFinExpenses;

  useEffect(() => {
    const unsub = dbService.sync('finances', profile.uid, (data) => {
      setFinances(data as FinRecord[]);
    });
    return () => unsub();
  }, [profile.uid]);

  // IA Insight Trigger - Otimizado para "funcionar na hora"
  useEffect(() => {
    let isMounted = true;
    const generateInitialInsights = async () => {
      // Dispara sempre que o componente montar (abrir o escritório)
      if (isMounted && !isLoadingInsights) {
        setIsLoadingInsights(true);
        try {
          const result = await getFinancialConsultancy(orders, products, finances, profile);
          if (isMounted) setInsights(result);
        } catch (error) {
          console.error("Home AI Load Failed:", error);
        } finally {
          if (isMounted) setIsLoadingInsights(false);
        }
      }
    };

    // Pequeno atraso para aguardar o sync inicial dos dados se necessário
    const timer = setTimeout(generateInitialInsights, 300);
    return () => { 
      isMounted = false; 
      clearTimeout(timer);
    };
  }, [profile.uid]); // Re-roda apenas no mount ou troca de usuário

  const Module = ({ icon, label, onClick }: any) => (
    <button onClick={onClick} className="flex flex-col items-center gap-2 group transition-all animate-fade">
      <div className="circle-btn shadow-sm group-hover:bg-brand-blue group-hover:text-white group-hover:border-brand-blue transition-colors">{icon}</div>
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-brand-blue">{label}</span>
    </button>
  );

  return (
    <div className="space-y-8 pb-10">
      <header className="flex justify-between items-start">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Visão Geral</p>
          <h2 className="text-3xl font-extrabold text-brand-blue tracking-tight">{profile.officeName}</h2>
        </div>
        <div className="bg-brand-blue/5 px-4 py-2 rounded-full flex items-center gap-2 border border-brand-blue/10">
           <div className="w-1.5 h-1.5 bg-brand-cyan rounded-full"></div>
           <span className="text-[10px] font-bold text-brand-blue uppercase tracking-widest">v3.1 Profissional</span>
        </div>
      </header>

      {/* IA PULSE WIDGET INTEGRADO */}
      <section className="nexus-card overflow-hidden bg-brand-blue text-white border-brand-blue shadow-2xl">
        <div className="p-8 border-b border-white/5 bg-gradient-to-r from-brand-blue to-brand-cyan flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shadow-lg">
                <BrainCircuit size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase italic tracking-tight flex items-center gap-2">
                  NEXUS AI Advisor <Sparkles size={16} className="text-brand-orange" />
                </h3>
                <p className="text-[8px] text-white/50 font-black uppercase tracking-[0.2em]">Sincronização Ativa de Insights</p>
              </div>
           </div>
           <button onClick={() => setView('AI_ASSISTANT')} className="text-[10px] font-black text-white/60 hover:text-white flex items-center gap-2 uppercase transition-all">
              Painel Completo <ChevronRight size={14}/>
           </button>
        </div>
        
        <div className="p-8 max-h-[400px] overflow-y-auto custom-scrollbar bg-brand-blue/30">
           {isLoadingInsights ? (
             <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="animate-spin text-brand-cyan" size={32} />
                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest animate-pulse">Consultando Core de Inteligência...</p>
             </div>
           ) : (
             <div className="prose prose-invert prose-sm max-w-none">
                <div className="text-slate-100 font-medium leading-relaxed whitespace-pre-line text-xs">
                   {insights || "Processando dados do terminal para gerar seu relatório estratégico..."}
                </div>
             </div>
           )}
        </div>
        
        {!isLoadingInsights && insights && (
          <div className="px-8 py-4 bg-white/5 border-t border-white/5 flex items-center gap-3">
             <div className="w-2 h-2 bg-brand-green rounded-full animate-ping"></div>
             <span className="text-[8px] font-black text-brand-cyan uppercase tracking-widest">Relatório Atualizado com base em dados reais</span>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="nexus-card p-6 bg-white">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Receita do Dia</p>
            <div className="p-1.5 bg-slate-50 text-slate-400 rounded-lg"><ArrowUpRight size={14}/></div>
          </div>
          <p className="text-2xl font-bold text-brand-blue">R$ {todayOrders.reduce((s,o)=>s+o.total,0).toFixed(2)}</p>
          <div className="flex items-center gap-1.5 mt-2 text-[10px] font-semibold text-slate-400">
             <ShoppingCart size={10}/> {todayOrders.length} vendas hoje
          </div>
        </div>
        <div className="nexus-card p-6 bg-white">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Saldo em Caixa</p>
            <div className="p-1.5 bg-slate-50 text-slate-400 rounded-lg"><Wallet size={14}/></div>
          </div>
          <p className="text-2xl font-bold text-brand-blue">R$ {balance.toFixed(2)}</p>
          <p className="text-[10px] text-slate-400 font-semibold mt-2 uppercase">Líquido Atual (Mês)</p>
        </div>
        <div className="nexus-card p-6 bg-white">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Agenda</p>
            <div className="p-1.5 bg-slate-50 text-slate-400 rounded-lg"><Clock size={14}/></div>
          </div>
          <p className="text-2xl font-bold text-brand-blue">Sincronizada</p>
          <p className="text-[10px] text-slate-400 font-semibold mt-2 uppercase">Protocolo Cloud Ativo</p>
        </div>
      </section>

      <section className="nexus-card p-8 bg-white">
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Atalhos Operacionais</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-y-10 gap-x-4">
          {isSuper && <Module icon={<Building2 size={22}/>} label="Escritórios" onClick={() => setView('OFFICES')} />}
          <Module icon={<Package size={22}/>} label="Estoque" onClick={() => setView('STOCK')} />
          <Module icon={<ShoppingCart size={22}/>} label="Vendas" onClick={() => setView('SALES')} />
          <Module icon={<Wrench size={22}/>} label="O.S." onClick={() => setView('SERVICE_ORDERS')} />
          <Module icon={<Users size={22}/>} label="Clientes" onClick={() => setView('CUSTOMERS')} />
          <Module icon={<FileText size={22}/>} label="Orçamentos" onClick={() => setView('QUOTES')} />
          <Module icon={<Wallet size={22}/>} label="Financeiro" onClick={() => setView('FINANCIAL')} />
          <Module icon={<Calendar size={22}/>} label="Agenda" onClick={() => setView('AGENDA')} />
          <Module icon={<Gift size={22}/>} label="Indicações" onClick={() => setView('REFERRALS')} />
          <Module icon={<Bot size={22}/>} label="IA Assistente" onClick={() => setView('AI_ASSISTANT')} />
          <Module icon={<UserCircle size={22}/>} label="Perfil" onClick={() => setView('PROFILE')} />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="nexus-card p-6">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-bold text-brand-blue uppercase tracking-widest">Atividades Recentes</h3>
              <button onClick={()=>setView('SALES')} className="text-[10px] font-bold text-slate-400 hover:text-brand-blue flex items-center gap-1 transition-colors uppercase">Ver Tudo <ChevronRight size={12}/></button>
           </div>
           <div className="space-y-3">
              {orders.slice(0, 3).map(o => (
                <div key={o.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-brand-blue/20 transition-colors">
                   <div>
                     <p className="text-brand-blue font-bold text-sm uppercase">{o.guestName || 'Venda Rápida'}</p>
                     <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">{o.paymentMethod} • {o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString('pt-BR') : 'Agora'}</p>
                   </div>
                   <p className="text-sm font-bold text-brand-blue">R$ {o.total.toFixed(2)}</p>
                </div>
              ))}
              {orders.length === 0 && <p className="text-center text-[10px] text-slate-400 uppercase py-6 font-semibold">Nenhuma venda registrada.</p>}
           </div>
        </div>

        <div className="nexus-card p-6 border-slate-100 flex flex-col items-center justify-center text-center bg-slate-50/50">
           <AlertCircle size={24} className="text-slate-300 mb-3" />
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nenhum Alerta Importante</p>
           <p className="text-[9px] text-slate-400 mt-1 uppercase font-semibold">Tudo operando sob conformidade.</p>
        </div>
      </section>
    </div>
  );
};

export default NexusHub;
