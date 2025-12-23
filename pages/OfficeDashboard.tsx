import React, { useState, useEffect, useMemo } from 'react';
import { VirtualOffice } from '../types';
import { NeonCard } from '../components/NeonCard';
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShoppingCart,
  FileText,
  X,
  Filter,
  Loader2
} from 'lucide-react';

/* =========================
   MENU MOBILE (☰)
========================= */
const MobileMenu: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Botão ☰ (somente mobile) */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed bottom-4 right-4 z-[200]
                   bg-cyan-500 text-black text-2xl font-black
                   w-14 h-14 rounded-full shadow-xl"
      >
        ☰
      </button>

      {open && (
        <div className="fixed inset-0 z-[300] bg-black/95 p-6 overflow-y-auto">
          <button
            onClick={() => setOpen(false)}
            className="mb-6 text-cyan-400 font-bold text-lg"
          >
            ✕ Fechar
          </button>
          {children}
        </div>
      )}
    </>
  );
};

/* =========================
   DASHBOARD
========================= */
export const OfficeDashboard: React.FC<{ office: VirtualOffice }> = ({ office }) => {
  const [time, setTime] = useState(new Date());
  const [detailView, setDetailView] = useState<{
    open: boolean;
    title: string;
    filter: 'total' | 'received' | 'toReceive' | 'overdue';
  }>({ open: false, title: '', filter: 'total' });

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isThisWeek = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
    return date >= sevenDaysAgo;
  };

  const financialData = useMemo(() => {
    if (!office?.sales) return { total: 0, received: 0, toReceive: 0, overdue: 0 };
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return office.sales.reduce(
      (acc, sale) => {
        const debt = Math.max(0, sale.total - sale.amountPaid);
        const isOverdue =
          sale.paymentDueDate &&
          new Date(sale.paymentDueDate) < today &&
          sale.status !== 'PAID';

        acc.total += sale.total;
        acc.received += sale.amountPaid;

        if (debt > 0) {
          isOverdue ? (acc.overdue += debt) : (acc.toReceive += debt);
        }

        return acc;
      },
      { total: 0, received: 0, toReceive: 0, overdue: 0 }
    );
  }, [office]);

  const filteredSalesForDetail = useMemo(() => {
    if (!office?.sales) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return office.sales
      .filter(sale => {
        const debt = Math.max(0, sale.total - sale.amountPaid);
        const isOverdue =
          sale.paymentDueDate &&
          new Date(sale.paymentDueDate) < today &&
          sale.status !== 'PAID';

        if (detailView.filter === 'received') return sale.amountPaid > 0;
        if (detailView.filter === 'toReceive') return debt > 0 && !isOverdue;
        if (detailView.filter === 'overdue') return isOverdue;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [office, detailView]);

  if (!office)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-cyan-500" />
      </div>
    );

  return (
    <div className="space-y-6 animate-fade-in pb-20">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-black/60 p-6 rounded-2xl border border-gray-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
        <div>
          <h2 className="text-4xl font-black text-white uppercase">{office.companyName}</h2>
          <p className="text-gray-500 uppercase text-[10px] font-bold tracking-[0.2em] mt-1">
            Escritório Virtual • Gestão em Tempo Real
          </p>
        </div>
        <div className="text-center md:text-right font-mono">
          <div className="text-3xl font-bold text-white">{time.toLocaleTimeString()}</div>
          <div className="text-[10px] uppercase text-cyan-500 font-black tracking-[0.2em]">
            {time.toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            })}
          </div>
        </div>
      </div>

      {/* CARDS – DESKTOP / MOBILE MENU */}
      <MobileMenu>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* TOTAL */}
          <div onClick={() => setDetailView({ open: true, title: 'Total de Vendas', filter: 'total' })}>
            <NeonCard variant="cyan">
              <TrendingUp className="text-cyan-500" />
              <p className="text-3xl font-black text-white">R$ {financialData.total.toFixed(2)}</p>
            </NeonCard>
          </div>

          {/* RECEBIDO */}
          <div onClick={() => setDetailView({ open: true, title: 'Recebido', filter: 'received' })}>
            <NeonCard variant="green">
              <CheckCircle2 className="text-green-500" />
              <p className="text-3xl font-black text-green-400">R$ {financialData.received.toFixed(2)}</p>
            </NeonCard>
          </div>

          {/* A RECEBER */}
          <div onClick={() => setDetailView({ open: true, title: 'A Receber', filter: 'toReceive' })}>
            <NeonCard variant="yellow">
              <Clock className="text-yellow-500" />
              <p className="text-3xl font-black text-yellow-400">R$ {financialData.toReceive.toFixed(2)}</p>
            </NeonCard>
          </div>

          {/* VENCIDOS */}
          <div onClick={() => setDetailView({ open: true, title: 'Vencidos', filter: 'overdue' })}>
            <NeonCard variant="red" glow={financialData.overdue > 0}>
              <AlertCircle className="text-red-500" />
              <p className="text-3xl font-black text-red-500">R$ {financialData.overdue.toFixed(2)}</p>
            </NeonCard>
          </div>
        </div>
      </MobileMenu>

      {/* MODAL */}
      {detailView.open && (
        <div className="fixed inset-0 z-[400] bg-black/90 p-4 flex justify-center items-center">
          <div className="bg-[#130b1e] w-full max-w-4xl rounded-2xl border border-cyan-500 overflow-hidden">
            <div className="p-6 flex justify-between items-center border-b border-gray-800">
              <h3 className="text-white text-2xl font-bold">{detailView.title}</h3>
              <button onClick={() => setDetailView({ ...detailView, open: false })}>
                <X className="text-red-500" size={28} />
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {filteredSalesForDetail.map((sale, i) => (
                <NeonCard key={i} className="mb-3">
                  <p className="text-white font-bold">{sale.buyerName}</p>
                  <p className="text-gray-400 text-sm">R$ {sale.total.toFixed(2)}</p>
                </NeonCard>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
