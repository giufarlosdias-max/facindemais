
import React, { useState } from 'react';
import { Sale, Installment } from '../types';
import { FileText, Search, Download, Trash2, CheckCircle, XCircle, ChevronDown, ChevronUp, Calendar, CreditCard, DollarSign } from 'lucide-react';

interface ReportsProps {
  sales: Sale[];
  setSales?: React.Dispatch<React.SetStateAction<Sale[]>>;
}

const Reports: React.FC<ReportsProps> = ({ sales, setSales }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = sales.filter(s => 
    s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteSale = (id: string) => {
    if (confirm('Deseja excluir permanentemente esta nota e todas as suas parcelas?')) {
      if (setSales) setSales(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleMarkInstallmentPaid = (saleId: string, installmentNumber: number) => {
    if (!setSales) return;
    setSales(prev => prev.map(s => {
      if (s.id !== saleId || !s.installments) return s;

      const newInstallments = s.installments.map(inst => 
        inst.number === installmentNumber ? { ...inst, status: 'PAID' as const } : inst
      );

      // Recalcular saldo restante
      const paidAmount = newInstallments
        .filter(i => i.status === 'PAID')
        .reduce((acc, i) => acc + i.amount, 0);
      
      const newRemaining = s.total - paidAmount;
      const newStatus = newRemaining <= 0 ? 'PAID' : 'PENDING';

      return { 
        ...s, 
        installments: newInstallments, 
        remainingBalance: Math.max(0, newRemaining), 
        paymentStatus: newStatus 
      };
    }));
  };

  const handleDeleteInstallment = (saleId: string, installmentNumber: number) => {
    if (!setSales || !confirm('Excluir esta parcela permanentemente? O saldo total da nota será ajustado.')) return;
    
    setSales(prev => prev.map(s => {
      if (s.id !== saleId || !s.installments) return s;

      const instToDelete = s.installments.find(i => i.number === installmentNumber);
      if (!instToDelete) return s;

      const newInstallments = s.installments.filter(inst => inst.number !== installmentNumber);
      
      // Ao excluir uma parcela, reduzimos o valor total da venda para que o saldo bata
      const newTotal = s.total - instToDelete.amount;
      const paidAmount = newInstallments
        .filter(i => i.status === 'PAID')
        .reduce((acc, i) => acc + i.amount, 0);
      
      const newRemaining = newTotal - paidAmount;
      const newStatus = newRemaining <= 0 ? 'PAID' : 'PENDING';

      return { 
        ...s, 
        total: newTotal,
        installments: newInstallments, 
        remainingBalance: Math.max(0, newRemaining), 
        paymentStatus: newStatus 
      };
    }));
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in">
      <header>
        <h2 className="text-2xl font-orbitron font-black text-white uppercase tracking-widest">Histórico <span className="text-cyber-neon">Notas</span></h2>
        <p className="text-gray-500 text-[10px] tracking-[0.3em] uppercase mt-2">Logs de Transações e Parcelamentos</p>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
        <input placeholder="Procurar por ID ou Cliente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:border-cyber-neon text-white outline-none" />
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center p-20 opacity-20 font-orbitron uppercase text-xs tracking-widest">Nenhuma transação registrada.</div>
        ) : filtered.map(sale => (
          <div key={sale.id} className={`glass rounded-3xl border transition-all ${expandedId === sale.id ? 'border-cyber-neon shadow-neon-cyan bg-black/80' : 'border-white/5 hover:border-white/20'}`}>
            <div onClick={() => setExpandedId(expandedId === sale.id ? null : sale.id)} className="p-5 flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sale.paymentStatus === 'PAID' ? 'bg-green-400/10 text-green-400 border border-green-400/20' : 'bg-cyber-pink/10 text-cyber-pink border border-cyber-pink/20'}`}>
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs uppercase truncate max-w-[150px] group-hover:text-cyber-neon transition-colors">{sale.customerName}</h4>
                  <p className="text-[9px] text-gray-500 font-mono tracking-widest">{sale.id} • {new Date(sale.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-white">Total: R$ {sale.total.toFixed(2)}</p>
                <p className={`text-[8px] font-black ${sale.paymentStatus === 'PAID' ? 'text-green-400' : 'text-cyber-pink'}`}>RESTANTE: R$ {sale.remainingBalance.toFixed(2)}</p>
              </div>
            </div>

            {expandedId === sale.id && (
              <div className="px-5 pb-5 pt-2 border-t border-white/5 animate-in slide-in-from-top duration-300 space-y-6">
                {/* Itens da Venda */}
                <div>
                  <h5 className="text-[8px] font-orbitron text-gray-500 uppercase tracking-widest mb-3">Itens do Protocolo</h5>
                  <div className="bg-white/5 rounded-2xl p-4 space-y-2">
                    {sale.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-[10px] tracking-widest text-gray-400">
                        <span className="uppercase">{it.name} x{it.quantity}</span>
                        <span className="text-white font-bold">R$ {(it.price * it.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lista de Parcelas */}
                {sale.installments && sale.installments.length > 0 && (
                  <div>
                    <h5 className="text-[8px] font-orbitron text-gray-500 uppercase tracking-widest mb-3">Cronograma de Parcelas</h5>
                    <div className="space-y-2">
                      {sale.installments.map((inst) => (
                        <div key={inst.number} className={`flex items-center justify-between p-3 rounded-xl border ${inst.status === 'PAID' ? 'bg-green-500/5 border-green-500/20' : 'bg-cyber-pink/5 border-cyber-pink/20'}`}>
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${inst.status === 'PAID' ? 'text-green-500' : 'text-cyber-pink'}`}>
                              <Calendar size={14}/>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-white uppercase tracking-widest">Parcela #{inst.number}</p>
                              <p className="text-[8px] text-gray-500 font-mono uppercase">Vencimento: {new Date(inst.dueDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <span className={`text-xs font-black digital-font ${inst.status === 'PAID' ? 'text-green-500' : 'text-white'}`}>R$ {inst.amount.toFixed(2)}</span>
                            <div className="flex gap-2">
                              {inst.status === 'PENDING' && (
                                <button 
                                  onClick={() => handleMarkInstallmentPaid(sale.id, inst.number)}
                                  className="p-2 hover:bg-green-500/20 text-green-500 rounded-lg transition-all"
                                  title="Marcar como Pago"
                                >
                                  <CheckCircle size={16}/>
                                </button>
                              )}
                              <button 
                                onClick={() => handleDeleteInstallment(sale.id, inst.number)}
                                className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition-all"
                                title="Excluir Parcela"
                              >
                                <Trash2 size={16}/>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-white/5 flex gap-3">
                  <button onClick={() => handleDeleteSale(sale.id)} className="w-full bg-red-500/10 border border-red-500/20 py-4 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black text-red-500 hover:bg-red-500 hover:text-white transition-all uppercase tracking-widest">
                    <Trash2 size={18}/> Excluir Registro Total
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reports;
