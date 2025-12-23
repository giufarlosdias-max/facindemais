import React, { useState, useEffect } from 'react';
import { User, Sale, Expense } from '../types';
import {
  DollarSign,
  Cpu,
  Timer,
  ArrowDownCircle,
  Share2,
  TrendingUp,
  AlertTriangle,
  Package
} from 'lucide-react';

/**
 * URL pública do sistema
 * ⚠️ SUBSTITUA pela URL real da Vercel se necessário
 */
const APP_URL = 'https://SEU-PROJETO.vercel.app';

interface DashboardProps {
  user: User;
  sales: Sale[];
  expenses: Expense[];
}

const Dashboard: React.FC<DashboardProps> = ({ user, sales, expenses }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const pendingRevenue = sales.reduce(
    (acc, s) => acc + (s.remainingBalance || 0),
    0
  );
  const netBalance = totalRevenue - totalExpenses - pendingRevenue;

  const sendExecutiveReport = () => {
    const report =
      `📊 *EXECUTIVE SUMMARY - NEXUS OS*%0A%0A` +
      `🏢 *UNIDADE:* ${user.officeName?.toUpperCase()}%0A` +
      `📅 *DATA:* ${new Date().toLocaleDateString()}%0A%0A` +
      `💰 *RECEITA BRUTA:* R$ ${totalRevenue.toFixed(2)}%0A` +
      `📉 *CUSTOS TOTAIS:* R$ ${totalExpenses.toFixed(2)}%0A` +
      `⏳ *SALDO EM ABERTO:* R$ ${pendingRevenue.toFixed(2)}%0A` +
      `✅ *LUCRO LÍQUIDO REAL:* R$ ${netBalance.toFixed(2)}%0A%0A` +
      `📈 *ATIVIDADE:* ${sales.length} vendas / ${expenses.length} logs de gasto.%0A%0A` +
      `🚀 _Gerado por Nexus Core Protocol v2.5_%0A%0A` +
      `🔗 *ACESSAR O SISTEMA:*%0A${APP_URL}`;

    const phone = user.phone ? user.phone.replace(/\D/g, '') : '';
    window.open(`https://wa.me/55${phone}?text=${report}`, '_blank');
  };

  return (
    <div className="space-y-10 animate-in fade-in overflow-y-auto min-h-[calc(100vh-6rem)]">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-cyber-neon/10 border border-cyber-neon/30 flex items-center justify-center shadow-neon-cyan">
            <Cpu className="text-cyber-neon" size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white font-orbitron uppercase tracking-tighter">
              {user.officeName || 'Nexus Core'}
            </h2>
            <p className="text-[10px] font-orbitron text-cyber-neon tracking-widest uppercase opacity-70">
              Operação em Conformidade
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={sendExecutiveReport}
            className="glass px-6 py-4 rounded-2xl border border-cyber-neon/40 flex items-center gap-3 shadow-neon-cyan hover:bg-cyber-neon hover:text-black transition-all text-cyber-neon font-orbitron text-[9px] font-black uppercase tracking-widest group"
          >
            <Share2 size={16} className="group-hover:rotate-12 transition-transform" />
            Relatório Zap
          </button>

          <div className="glass px-8 py-4 rounded-2xl border border-cyber-neon/20 flex flex-col items-center">
            <div className="text-3xl font-black digital-font text-white">
              {time.getHours().toString().padStart(2, '0')}:
              {time.getMinutes().toString().padStart(2, '0')}:
              {time.getSeconds().toString().padStart(2, '0')}
            </div>
          </div>
        </div>
      </header>

      {/* MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Receita Bruta"
          value={`R$ ${totalRevenue.toLocaleString()}`}
          color="neon"
          icon={<DollarSign />}
        />
        <MetricCard
          title="Gastos Log"
          value={`R$ ${totalExpenses.toLocaleString()}`}
          color="pink"
          icon={<ArrowDownCircle />}
        />
        <MetricCard
          title="Pendente"
          value={`R$ ${pendingRevenue.toLocaleString()}`}
          color="yellow"
          icon={<AlertTriangle />}
        />
        <MetricCard
          title="Lucro Real"
          value={`R$ ${netBalance.toLocaleString()}`}
          color="neon"
          icon={<TrendingUp />}
        />
      </div>

      {/* PAINÉIS INFERIORES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
        {/* TRANSAÇÕES RECENTES */}
        <div className="glass p-8 rounded-3xl border border-white/5 bg-black/40 shadow-sm">
          <h3 className="text-sm font-orbitron font-black text-white mb-6 uppercase tracking-widest flex items-center gap-3">
            <Timer size={18} className="text-cyber-neon" />
            Transações Recentes
          </h3>

          <div className="space-y-2">
            {sales.slice(0, 5).map(sale => (
              <div
                key={sale.id}
                className="flex justify-between items-center bg-white/5 p-4 rounded-xl border-l-2 border-cyber-neon hover:bg-white/10 transition-colors"
              >
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white uppercase">
                    {sale.customerName}
                  </span>
                  <span className="text-[8px] text-gray-500">
                    {new Date(sale.date).toLocaleDateString()}
                  </span>
                </div>
                <span className="text-xs font-black digital-font text-cyber-neon">
                  R$ {sale.total.toFixed(2)}
                </span>
              </div>
            ))}

            {sales.length === 0 && (
              <p className="text-center py-10 opacity-20 uppercase text-[10px] tracking-widest">
                Sem protocolos de venda no ciclo atual.
              </p>
            )}
          </div>
        </div>

        {/* RESUMO ALMOXARIFADO */}
        <div className="glass p-8 rounded-3xl border border-white/5 bg-black/40 shadow-sm flex flex-col">
          <h3 className="text-sm font-orbitron font-black text-white mb-8 uppercase tracking-widest flex items-center gap-3">
            <Package size={18} className="text-cyber-neon" />
            Resumo Almoxarifado
          </h3>

          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <div className="w-24 h-24 rounded-full border-4 border-cyber-neon/20 flex items-center justify-center relative">
              <div className="absolute inset-0 border-4 border-cyber-neon border-t-transparent rounded-full animate-spin-slow"></div>
              <span className="text-2xl font-black font-orbitron text-white">
                {sales.length}
              </span>
            </div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">
              Saídas Processadas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, color, icon }: any) => (
  <div className="p-6 rounded-3xl border border-white/5 bg-black/40 card-neo shadow-sm">
    <div className="flex justify-between items-center mb-3">
      <span className="text-[8px] font-orbitron text-gray-500 uppercase tracking-widest">
        {title}
      </span>
      <div
        className={
          color === 'neon'
            ? 'text-cyber-neon'
            : color === 'pink'
            ? 'text-cyber-pink'
            : 'text-cyber-yellow'
        }
      >
        {icon}
      </div>
    </div>
    <p className="text-xl font-black font-orbitron text-white truncate">
      {value}
    </p>
  </div>
);

export default Dashboard;
