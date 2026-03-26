import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, DollarSign, Zap, 
  Activity, PieChart, ShieldCheck, AlertCircle, Ban, Clock
} from 'lucide-react';
import { dbService } from '../services/firebase';

const MasterDashboard: React.FC = () => {
  const [network, setNetwork] = useState({
    totalOffices: 0,
    activeSubscribers: 0,
    delinquentOffices: 0,
    trialOffices: 0,
    mrr: 0,
    payoutTotal: 0
  });

  useEffect(() => {
    return dbService.watchNetwork((users) => {
      const admins = users.filter(u => u.role === 'admin');
      const active = admins.filter(u => u.subscriptionStatus === 'PAID');
      const delinquent = admins.filter(u => u.subscriptionStatus === 'EXPIRED');
      const trials = admins.filter(u => u.subscriptionStatus === 'TRIAL');
      
      const mrr = active.length * 50;
      const l1 = users.filter(u => u.lineage?.l1 && u.subscriptionStatus === 'PAID').length * 1.00;
      const l2 = users.filter(u => u.lineage?.l2 && u.subscriptionStatus === 'PAID').length * 0.50;
      const l3 = users.filter(u => u.lineage?.l3 && u.subscriptionStatus === 'PAID').length * 0.25;

      setNetwork({
        totalOffices: admins.length,
        activeSubscribers: active.length,
        delinquentOffices: delinquent.length,
        trialOffices: trials.length,
        mrr,
        payoutTotal: l1 + l2 + l3
      });
    });
  }, []);

  const stats = [
    { label: 'Total Terminais', value: network.totalOffices, icon: <Users />, color: 'text-white', glow: 'text-glow-brand-cyan' },
    { label: 'Terminais Ativos', value: network.activeSubscribers, icon: <ShieldCheck />, color: 'text-brand-green', glow: 'text-glow-brand-green' },
    { label: 'Inadimplentes', value: network.delinquentOffices, icon: <AlertCircle />, color: 'text-brand-orange', glow: 'text-glow-brand-orange' },
    { label: 'Em Período Trial', value: network.trialOffices, icon: <Clock />, color: 'text-brand-cyan', glow: 'text-glow-brand-cyan' }
  ];

  return (
    <div className="space-y-16 animate-fade-in">
      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-10">
        <div>
          <h2 className="text-5xl lg:text-7xl font-black text-white italic tracking-tighter text-glow-brand-blue leading-none uppercase">NEXUS Master Control</h2>
          <p className="text-slate-500 font-bold text-sm tracking-[0.5em] uppercase mt-8 flex items-center gap-4">
            <Zap size={20} className="text-brand-cyan animate-pulse" /> Monitoramento Global de Terminais Operacionais
          </p>
        </div>
        
        <div className="nexus-card px-10 py-6 border border-white/5 flex gap-12 bg-white/5 box-glow-brand-cyan">
           <div className="text-right">
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">MRR Projetado</p>
             <p className="text-3xl font-black text-white italic tracking-tighter">R$ {network.mrr.toFixed(2)}</p>
           </div>
           <div className="w-px h-12 bg-white/5"></div>
           <div className="text-right">
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Residual Rede</p>
             <p className="text-3xl font-black text-brand-cyan italic tracking-tighter text-glow-brand-cyan">R$ {network.payoutTotal.toFixed(2)}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {stats.map((s, i) => (
          <div key={i} className="nexus-card p-10 group overflow-hidden relative border-white/5 hover:border-white/20 transition-all">
            <div className={`absolute -right-6 -top-6 opacity-10 group-hover:scale-150 transition-transform ${s.color}`}>
              {React.cloneElement(s.icon as React.ReactElement<any>, { size: 120 })}
            </div>
            <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-8 ${s.color} border border-white/10`}>
              {React.cloneElement(s.icon as React.ReactElement<any>, { size: 28 })}
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">{s.label}</p>
            <p className={`text-5xl font-black tracking-tighter italic ${s.color} ${s.glow}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 nexus-card p-12 relative overflow-hidden bg-gradient-to-br from-brand-blue to-black">
           <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none"><Activity size={200} className="text-brand-cyan" /></div>
           <div className="flex justify-between items-center mb-14 relative z-10">
              <h3 className="font-terminal text-sm font-black text-glow-brand-cyan uppercase tracking-widest">Estado da Rede NEXUS</h3>
              <div className="flex items-center gap-3">
                 <div className="w-3 h-3 bg-brand-green rounded-full animate-ping"></div>
                 <span className="text-[10px] font-black text-brand-green uppercase tracking-widest">Sistemas Nominais</span>
              </div>
           </div>
           <div className="space-y-12 relative z-10">
              <div className="flex items-center justify-between group">
                 <div className="flex items-center gap-8">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-brand-green/10 flex items-center justify-center text-brand-green font-black border border-brand-green/20 box-glow-brand-cyan">
                      ATV
                    </div>
                    <div>
                      <p className="text-white font-black uppercase text-base tracking-tight">Escritórios em Dia</p>
                      <p className="text-[10px] text-slate-600 font-bold uppercase mt-1 tracking-widest">Pagamentos processados com sucesso.</p>
                    </div>
                 </div>
                 <p className="text-4xl font-black text-white italic text-glow-brand-cyan">{network.activeSubscribers}</p>
              </div>
              
              <div className="flex items-center justify-between group">
                 <div className="flex items-center gap-8">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-brand-orange/10 flex items-center justify-center text-brand-orange font-black border border-brand-orange/20 box-glow-brand-orange">
                      INA
                    </div>
                    <div>
                      <p className="text-white font-black uppercase text-base tracking-tight">Escritórios Expirados</p>
                      <p className="text-[10px] text-slate-600 font-bold uppercase mt-1 tracking-widest">Acesso pendente de renovação.</p>
                    </div>
                 </div>
                 <p className="text-4xl font-black text-brand-orange italic text-glow-brand-orange">{network.delinquentOffices}</p>
              </div>
           </div>
        </div>

        <div className="nexus-card p-12 relative overflow-hidden group bg-gradient-to-br from-brand-cyan/5 to-transparent border-brand-cyan/10">
           <h3 className="font-terminal text-[10px] font-black text-brand-cyan uppercase tracking-[0.4em] mb-12">Performance de Rede</h3>
           <div className="space-y-8 text-center">
              <div className="p-10 bg-black/40 rounded-[2.5rem] border border-white/5">
                <p className="text-[10px] font-black text-slate-600 uppercase mb-4 tracking-widest">Taxa de Adimplência</p>
                <p className="text-6xl font-black text-brand-green italic tracking-tighter text-glow-brand-cyan">
                  {network.totalOffices > 0 ? ((network.activeSubscribers / network.totalOffices) * 100).toFixed(0) : 0}%
                </p>
              </div>
              <p className="text-[10px] text-slate-700 font-bold uppercase tracking-widest">Dados atualizados em tempo real via NEXUS Core 3.0</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default MasterDashboard;