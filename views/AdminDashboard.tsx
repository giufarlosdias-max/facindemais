import React from 'react';
import { UserProfile, Order, Expense, Product } from '../types';
import { 
  ShoppingCart, TrendingUp, Package, 
  WalletMinimal, AlertTriangle, ArrowUpRight, 
  ArrowDownRight, Zap 
} from 'lucide-react';

interface AdminDashboardProps {
  profile: UserProfile;
  orders: Order[];
  expenses: Expense[];
  products: Product[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ profile, orders, expenses, products }) => {
  const totalRevenue = orders.filter(o => o.status === 'PAID').reduce((acc, o) => acc + o.total, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  
  const lowStock = products.filter(p => p.type === 'PRODUCT' && p.stock <= 5);

  const stats = [
    { 
      label: 'Faturamento Total', 
      value: `R$ ${totalRevenue.toFixed(2)}`, 
      icon: <ShoppingCart className="text-brand-cyan"/>,
      trend: <ArrowUpRight size={14} className="text-brand-green"/> 
    },
    { 
      label: 'Despesas Acumuladas', 
      value: `R$ ${totalExpenses.toFixed(2)}`, 
      icon: <WalletMinimal className="text-rose-400"/>,
      trend: <ArrowDownRight size={14} className="text-rose-400"/> 
    },
    { 
      label: 'Lucro Líquido', 
      value: `R$ ${netProfit.toFixed(2)}`, 
      icon: <TrendingUp className="text-brand-green"/>,
      trend: <Zap size={14} className="text-brand-cyan"/> 
    },
  ];

  return (
    <div className="space-y-12 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-black text-white italic tracking-tighter text-glow-brand-cyan leading-none uppercase">{profile.officeName}</h2>
          <p className="text-slate-500 font-bold text-sm tracking-widest uppercase mt-4">Monitor de Operações NEXUS.</p>
        </div>
        <div className="bg-brand-green/10 border border-brand-green/30 px-6 py-3 rounded-xl flex items-center gap-3">
          <div className="w-2 h-2 bg-brand-green rounded-full animate-pulse"></div>
          <span className="text-[10px] font-black text-brand-green uppercase tracking-widest">Sistema Operacional</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((s, i) => (
          <div key={i} className="glass-panel p-10 border border-white/5 hover:border-brand-cyan/20 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-50">{s.trend}</div>
            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              {s.icon}
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{s.label}</p>
            <p className="text-4xl font-black text-white italic tracking-tighter">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-panel p-10 border border-white/5">
           <h3 className="font-terminal text-sm font-black text-glow-brand-cyan uppercase mb-10">Últimas Movimentações</h3>
           <div className="space-y-4">
              {orders.slice(0, 5).map(o => (
                <div key={o.id} className="flex justify-between items-center bg-black/40 p-6 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-brand-cyan/10 text-brand-cyan rounded-xl"><ShoppingCart size={18}/></div>
                    <div>
                      <p className="text-white font-black uppercase text-sm">Venda #{o.id.substring(0,6).toUpperCase()}</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase">{o.paymentMethod} • {o.createdAt?.toDate().toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className="text-xl font-black text-brand-cyan italic">R$ {o.total.toFixed(2)}</p>
                </div>
              ))}
              {orders.length === 0 && <p className="text-center text-slate-800 font-black uppercase text-xs py-10">Sem vendas recentes.</p>}
           </div>
        </div>

        <div className="glass-panel p-10 border border-white/5">
           <h3 className="font-terminal text-sm font-black text-rose-500 uppercase mb-8 flex items-center gap-3">
             <AlertTriangle size={18}/> Alertas NEXUS
           </h3>
           <div className="space-y-6">
              {lowStock.length > 0 ? lowStock.map(p => (
                <div key={p.id} className="p-4 bg-rose-500/5 rounded-2xl border border-rose-500/20">
                  <p className="text-white font-black text-xs uppercase mb-1">{p.name}</p>
                  <p className="text-[9px] text-rose-400 font-bold uppercase tracking-widest">Estoque Crítico: {p.stock} UN</p>
                </div>
              )) : (
                <div className="text-center py-10">
                   <Package size={40} className="mx-auto text-slate-800 mb-4" />
                   <p className="text-slate-700 font-black text-[10px] uppercase tracking-widest">Nenhum alerta de estoque.</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;