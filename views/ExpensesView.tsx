import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Wallet, Trash2, X, Loader2, Zap, MessageCircle, Calendar, 
  ArrowUpCircle, ArrowDownCircle, FileText, ShoppingCart, 
  PieChart, AlertTriangle, ChevronRight, CheckCircle2, TrendingUp, TrendingDown
} from 'lucide-react';
import { FinRecord, Order, UserProfile } from '../types';
import { dbService } from '../services/firebase';

interface ExpensesViewProps {
  expenses: any[]; // Mantido para compatibilidade, mas usaremos a nova coleção
  userId: string;
  profile: UserProfile;
}

type FinTab = 'INCOMES' | 'EXPENSES' | 'FIXED' | 'PURCHASES' | 'SUMMARY';

const ExpensesView: React.FC<ExpensesViewProps> = ({ userId, profile }) => {
  const userName = profile.fullName || profile.officeName || profile.email;
  const [activeTab, setActiveTab] = useState<FinTab>('SUMMARY');
  const [records, setRecords] = useState<FinRecord[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    type: 'EXPENSE' as any,
    date: new Date().toISOString().split('T')[0],
    description: '',
    contactName: '',
    category: 'Geral',
    amount: '',
    paymentMethod: 'PIX',
    status: 'PAID' as any,
    dueDate: '',
    referenceCode: '',
    quantity: '1',
    notes: ''
  });

  useEffect(() => {
    const unsubFin = dbService.sync('finances', userId, (data) => {
      setRecords(data as FinRecord[]);
      setLoading(false);
    });
    const unsubOrders = dbService.sync('orders', userId, (data) => {
      setOrders((data as Order[]).filter(o => o.status === 'PAID'));
    });
    return () => { unsubFin(); unsubOrders(); };
  }, [userId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await dbService.add('finances', userId, {
        ...formData,
        amount: parseFloat(formData.amount),
        quantity: parseInt(formData.quantity)
      }, userName);
      setIsModalOpen(false);
      resetForm();
    } catch (err) { alert("Erro ao salvar registro."); } finally { setIsSaving(false); }
  };

  const resetForm = () => {
    setFormData({
      type: 'EXPENSE',
      date: new Date().toISOString().split('T')[0],
      description: '',
      contactName: '',
      category: 'Geral',
      amount: '',
      paymentMethod: 'PIX',
      status: 'PAID',
      dueDate: '',
      referenceCode: '',
      quantity: '1',
      notes: ''
    });
  };

  const totals = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const filteredRecords = records.filter(r => {
      const d = new Date(r.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const orderIncomes = orders.filter(o => {
      const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date();
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).reduce((acc, o) => acc + o.total, 0);

    const manualIncomes = filteredRecords.filter(r => r.type === 'INCOME' && r.status === 'RECEIVED').reduce((acc, r) => acc + r.amount, 0);
    const expenses = filteredRecords.filter(r => r.type === 'EXPENSE' && r.status === 'PAID').reduce((acc, r) => acc + r.amount, 0);
    const fixed = filteredRecords.filter(r => r.type === 'FIXED_BILL' && r.status === 'PAID').reduce((acc, r) => acc + r.amount, 0);
    const purchases = filteredRecords.filter(r => r.type === 'PURCHASE' && r.status === 'PAID').reduce((acc, r) => acc + r.amount, 0);

    const totalReceived = orderIncomes + manualIncomes;
    const totalSpent = expenses + fixed + purchases;
    const balance = totalReceived - totalSpent;

    const overdueCount = records.filter(r => r.status === 'OVERDUE' || (r.dueDate && new Date(r.dueDate) < new Date() && r.status === 'PENDING')).length;

    return { totalReceived, totalSpent, balance, overdueCount };
  }, [records, orders]);

  const TabButton = ({ id, icon: Icon, label }: { id: FinTab, icon: any, label: string }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${activeTab === id ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
    >
      <Icon size={14} />
      <span className="hidden md:block">{label}</span>
    </button>
  );

  return (
    <div className="space-y-10 animate-fade pb-24 px-2 lg:px-0">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Gestão Financeira</p>
          <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase">NEXUS Finance Hub</h2>
        </div>
        <div className="flex flex-wrap gap-2">
           <TabButton id="SUMMARY" icon={PieChart} label="Resumo" />
           <TabButton id="INCOMES" icon={ArrowUpCircle} label="Entradas" />
           <TabButton id="EXPENSES" icon={ArrowDownCircle} label="Saídas" />
           <TabButton id="FIXED" icon={FileText} label="Fixas" />
           <TabButton id="PURCHASES" icon={ShoppingCart} label="Compras" />
        </div>
      </header>

      {activeTab === 'SUMMARY' && (
        <div className="space-y-8 animate-fade">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="nexus-card p-8 border-emerald-100 bg-emerald-50/30">
                 <div className="flex justify-between items-start mb-4">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Total Recebido</p>
                    <TrendingUp className="text-emerald-500" size={20}/>
                 </div>
                 <p className="text-3xl font-black text-slate-900 italic tracking-tighter">R$ {totals.totalReceived.toFixed(2)}</p>
                 <p className="text-[9px] text-emerald-600 font-bold uppercase mt-2 tracking-widest">Mês Vigente</p>
              </div>
              <div className="nexus-card p-8 border-rose-100 bg-rose-50/30">
                 <div className="flex justify-between items-start mb-4">
                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Total Gasto</p>
                    <TrendingDown className="text-rose-500" size={20}/>
                 </div>
                 <p className="text-3xl font-black text-slate-900 italic tracking-tighter">R$ {totals.totalSpent.toFixed(2)}</p>
                 <p className="text-[9px] text-rose-600 font-bold uppercase mt-2 tracking-widest">Mês Vigente</p>
              </div>
              <div className={`nexus-card p-8 border-slate-900 ${totals.balance >= 0 ? 'bg-slate-900 text-white' : 'bg-rose-600 text-white'}`}>
                 <div className="flex justify-between items-start mb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo do Mês</p>
                    <Wallet size={20} className="text-orange-500"/>
                 </div>
                 <p className="text-3xl font-black italic tracking-tighter">R$ {totals.balance.toFixed(2)}</p>
                 <p className="text-[9px] font-bold uppercase mt-2 tracking-widest">{totals.balance >= 0 ? 'Superávit Operacional' : 'Déficit no Período'}</p>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="nexus-card p-8 space-y-6">
                 <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><AlertTriangle size={16} className="text-amber-500"/> Alertas & Pendências</h4>
                 <div className="space-y-3">
                    {totals.overdueCount > 0 ? (
                      <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center font-black">{totals.overdueCount}</div>
                        <div>
                          <p className="text-xs font-bold text-rose-600 uppercase">Contas em Atraso</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Regularize para evitar juros e suspensão.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-10 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                         <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-3" />
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tudo em conformidade!</p>
                      </div>
                    )}
                 </div>
              </div>

              <div className="nexus-card p-8 bg-slate-900 text-white border-slate-900">
                 <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Anotações do Mês</h4>
                 <textarea 
                   placeholder="Escreva aqui insights financeiros, metas ou lembretes..." 
                   className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-medium h-32 resize-none focus:border-orange-500 outline-none transition-all"
                 />
                 <button className="w-full mt-4 py-3 bg-orange-500 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all">Salvar Observações</button>
              </div>
           </div>
        </div>
      )}

      {activeTab !== 'SUMMARY' && (
        <div className="space-y-6 animate-fade">
           <div className="flex justify-between items-center bg-slate-50 p-6 rounded-[2rem] border border-slate-200">
              <h3 className="text-xl font-black text-slate-900 italic uppercase">
                {activeTab === 'INCOMES' ? 'Entradas (Recebimentos)' :
                 activeTab === 'EXPENSES' ? 'Saídas (Gastos)' :
                 activeTab === 'FIXED' ? 'Contas Fixas e Boletos' :
                 'Compras (Fornecedores)'}
              </h3>
              <button 
                onClick={() => {
                  setFormData({ ...formData, type: activeTab.slice(0, -1) as any });
                  setIsModalOpen(true);
                }} 
                className="btn-orange px-6 py-3 rounded-xl font-bold text-[10px] uppercase flex items-center gap-2"
              >
                <Plus size={16}/> Novo Registro
              </button>
           </div>

           <div className="grid grid-cols-1 gap-4">
              {records.filter(r => r.type === (activeTab === 'INCOMES' ? 'INCOME' : activeTab === 'EXPENSES' ? 'EXPENSE' : activeTab === 'FIXED' ? 'FIXED_BILL' : 'PURCHASE')).map(record => (
                <div key={record.id} className="nexus-card p-6 border-slate-100 flex flex-col md:flex-row items-center justify-between group hover:border-orange-200 transition-all">
                   <div className="flex items-center gap-6">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black ${record.status === 'PAID' || record.status === 'RECEIVED' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                         {record.type === 'INCOME' ? <ArrowUpCircle size={24}/> : <ArrowDownCircle size={24}/>}
                      </div>
                      <div>
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{record.date} • {record.category}</p>
                         <h4 className="text-lg font-black text-slate-900 uppercase italic tracking-tight">{record.description}</h4>
                         <p className="text-[9px] font-bold text-slate-400 uppercase">{record.contactName || 'Sem identificação'} • {record.paymentMethod}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-8 mt-4 md:mt-0">
                      <div className="text-right">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valor Operacional</p>
                         <p className={`text-2xl font-black italic tracking-tighter ${record.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>R$ {record.amount.toFixed(2)}</p>
                      </div>
                      <div className="flex gap-2">
                         <button onClick={() => {
                           const nextStatus = (record.status === 'PAID' || record.status === 'RECEIVED') ? 'PENDING' : (record.type === 'INCOME' ? 'RECEIVED' : 'PAID');
                           dbService.update('finances', record.id, { status: nextStatus }, userId, userName);
                         }} className={`p-2 rounded-lg transition-all ${record.status === 'PAID' || record.status === 'RECEIVED' ? 'text-emerald-500 bg-emerald-50' : 'text-slate-300 bg-slate-50 hover:text-orange-500'}`}>
                            <CheckCircle2 size={20}/>
                         </button>
                         <button onClick={() => dbService.del('finances', record.id)} className="p-2 text-slate-300 bg-slate-50 rounded-lg hover:text-rose-500 hover:bg-rose-50 transition-all">
                            <Trash2 size={20}/>
                         </button>
                      </div>
                   </div>
                </div>
              ))}
              {records.filter(r => r.type === (activeTab === 'INCOMES' ? 'INCOME' : activeTab === 'EXPENSES' ? 'EXPENSE' : activeTab === 'FIXED' ? 'FIXED_BILL' : 'PURCHASE')).length === 0 && (
                <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Nenhum registro para esta categoria.</p>
                </div>
              )}
           </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="nexus-card w-full max-w-2xl p-8 border-brand-orange/40 my-auto animate-fade">
             <div className="flex justify-between items-center mb-10 border-b border-slate-100 pb-4">
                <h3 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter flex items-center gap-3"><Zap className="text-brand-orange"/> Novo Registro Financeiro</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-500"><X size={24}/></button>
             </div>

             <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo de Fluxo</label>
                    <select value={formData.type} onChange={e=>setFormData({...formData, type: e.target.value as any})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold uppercase">
                       <option value="INCOME">ENTRADA (RECEBIMENTO)</option>
                       <option value="EXPENSE">SAÍDA (GASTO)</option>
                       <option value="FIXED_BILL">CONTA FIXA / BOLETO</option>
                       <option value="PURCHASE">COMPRA / FORNECEDOR</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Data do Evento</label>
                    <input type="date" value={formData.date} onChange={e=>setFormData({...formData, date: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Descrição Curta</label>
                  <input required placeholder="EX: ALUGUEL, COMPRA DE PEÇAS, VENDA DE SERVIÇO" value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold uppercase" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Cliente / Fornecedor</label>
                      <input value={formData.contactName} onChange={e=>setFormData({...formData, contactName: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold uppercase" placeholder="NOME DA FONTE" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Categoria / Classificação</label>
                      <input value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold uppercase" placeholder="EX: OPERACIONAL, INFRA" />
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Valor R$</label>
                      <input required type="number" step="0.01" value={formData.amount} onChange={e=>setFormData({...formData, amount: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black italic" placeholder="0,00" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Forma</label>
                      <select value={formData.paymentMethod} onChange={e=>setFormData({...formData, paymentMethod: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold uppercase">
                         <option>PIX</option>
                         <option>DINHEIRO</option>
                         <option>BOLETO</option>
                         <option>CARTÃO</option>
                         <option>TRANSFERÊNCIA</option>
                      </select>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Status</label>
                      <select value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value as any})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold uppercase">
                         {formData.type === 'INCOME' ? (
                           <>
                             <option value="RECEIVED">RECEBIDO</option>
                             <option value="PENDING">PENDENTE</option>
                           </>
                         ) : (
                           <>
                             <option value="PAID">PAGO</option>
                             <option value="PENDING">EM ABERTO</option>
                             <option value="OVERDUE">ATRASADO</option>
                           </>
                         )}
                      </select>
                   </div>
                </div>

                {formData.type === 'FIXED_BILL' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Vencimento</label>
                      <input type="date" value={formData.dueDate} onChange={e=>setFormData({...formData, dueDate: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Código / Referência</label>
                      <input value={formData.referenceCode} onChange={e=>setFormData({...formData, referenceCode: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold uppercase" placeholder="BARRAS OU ID" />
                    </div>
                  </div>
                )}

                {formData.type === 'PURCHASE' && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Quantidade de Itens</label>
                    <input type="number" value={formData.quantity} onChange={e=>setFormData({...formData, quantity: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" />
                  </div>
                )}

                <button disabled={isSaving} type="submit" className="w-full btn-brand-orange py-6 rounded-2xl font-black text-sm flex items-center justify-center gap-3">
                   {isSaving ? <Loader2 className="animate-spin" size={24}/> : <CheckCircle2 size={24}/>} SINCRONIZAR OPERAÇÃO
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesView;