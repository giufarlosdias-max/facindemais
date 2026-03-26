
import React, { useState, useEffect } from 'react';
import { Activity, DollarSign, Package, ShoppingCart } from 'lucide-react';
import { auth, dbService } from '../services/firebase';

const DashboardView: React.FC = () => {
  const [data, setData] = useState({ sales: 0, products: 0, revenue: 0 });

  useEffect(() => {
    if(!auth.currentUser) return;
    const unsubSales = dbService.sync('orders', auth.currentUser.uid, (orders) => {
       const total = orders.filter(o => o.status === 'PAID').reduce((s,o) => s + o.total, 0);
       setData(prev => ({ ...prev, sales: orders.length, revenue: total }));
    });
    const unsubProds = dbService.sync('products', auth.currentUser.uid, (prods) => {
       setData(prev => ({ ...prev, products: prods.length }));
    });
    return () => { unsubSales(); unsubProds(); };
  }, []);

  const cards = [
    { label: 'Faturamento Total', value: `R$ ${data.revenue.toFixed(2)}`, icon: <DollarSign className="text-brand-cyan"/> },
    { label: 'Itens no Inventário', value: data.products, icon: <Package className="text-brand-cyan"/> },
    { label: 'Fluxo de Vendas', value: data.sales, icon: <ShoppingCart className="text-brand-cyan"/> },
  ];

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-brand-blue italic tracking-tighter glow-brand-cyan leading-none">STATUS DO NÚCLEO</h2>
          <p className="text-slate-500 font-bold text-sm tracking-widest uppercase mt-4">Monitoramento em tempo real.</p>
        </div>
        <div className="bg-brand-cyan/5 border border-brand-cyan/20 px-6 py-3 rounded-xl flex items-center gap-3">
          <div className="w-2 h-2 bg-brand-cyan rounded-full animate-ping"></div>
          <span className="text-[10px] font-black text-brand-cyan uppercase tracking-widest">Ativo</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {cards.map((c, i) => (
          <div key={i} className="glass-panel p-8 border border-white/5 hover:border-brand-cyan/30 transition-all group">
            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              {c.icon}
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">{c.label}</p>
            <p className="text-3xl font-black text-brand-blue tracking-tighter italic">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="glass-panel p-10 border border-white/5 h-[300px] flex flex-col items-center justify-center">
         <Activity size={48} className="text-white/5 mb-6" />
         <p className="text-slate-700 font-black uppercase text-xs tracking-[0.4em]">Aguardando telemetria avançada</p>
      </div>
    </div>
  );
};

export default DashboardView;
