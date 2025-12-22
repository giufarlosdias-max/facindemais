
import React, { useState } from 'react';
import { Customer, Sale, User } from '../types';
import { UserPlus, Search, Phone, Mail, DollarSign, History, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';

interface CRMProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  sales: Sale[];
  currentUser: User;
}

const CRM: React.FC<CRMProps> = ({ customers, setCustomers, sales, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newCust, setNewCust] = useState({ name: '', phone: '', email: '' });
  
  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  const handleAdd = () => {
    if (!newCust.name || !newCust.phone) return;
    const c: Customer = {
      id: 'C-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      name: newCust.name.toUpperCase(),
      phone: newCust.phone,
      email: newCust.email || 'n/a',
      totalSpent: 0,
      debt: 0,
      officeName: currentUser.officeName || 'Central'
    };
    setCustomers(prev => [...prev, c]);
    setIsAdding(false);
    setNewCust({ name: '', phone: '', email: '' });
  };

  const deleteCust = (id: string) => {
    if (confirm('REMOVER REGISTRO? Todos os logs vinculados serão mantidos nos relatórios gerais.')) {
      setCustomers(prev => prev.filter(c => c.id !== id));
    }
  };

  return (
    <div className="space-y-8 pb-32 animate-in fade-in">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-orbitron font-black text-white tracking-widest uppercase">Fichário <span className="text-cyber-neon">Clientes</span></h2>
          <p className="text-gray-500 text-[9px] tracking-[0.3em] uppercase mt-2">Base de Dados: {currentUser.officeName}</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="bg-cyber-neon text-black px-8 py-4 rounded-xl font-black font-orbitron text-[10px] tracking-widest shadow-neon-cyan hover:scale-105 transition-all flex items-center gap-2">
          <UserPlus size={18} /> INICIALIZAR CONTATO
        </button>
      </header>

      {isAdding && (
        <div className="glass p-10 rounded-3xl border border-cyber-neon/30 grid grid-cols-1 md:grid-cols-4 gap-6 animate-in slide-in-from-top bg-black/60 shadow-neon-cyan">
          <div className="space-y-1">
            <label className="text-[8px] text-gray-500 font-orbitron uppercase ml-1">Identidade</label>
            <input placeholder="Nome Completo" value={newCust.name} onChange={e => setNewCust({...newCust, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-cyber-neon outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-[8px] text-gray-500 font-orbitron uppercase ml-1">WhatsApp</label>
            <input placeholder="11999999999" value={newCust.phone} onChange={e => setNewCust({...newCust, phone: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-cyber-neon outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-[8px] text-gray-500 font-orbitron uppercase ml-1">Email Nexus</label>
            <input placeholder="Opcional" value={newCust.email} onChange={e => setNewCust({...newCust, email: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-cyber-neon outline-none" />
          </div>
          <div className="flex items-end gap-2">
             <button onClick={handleAdd} className="flex-1 bg-cyber-neon text-black font-black rounded-xl uppercase text-[9px] tracking-widest h-[54px] shadow-sm hover:brightness-110">GRAVAR</button>
             <button onClick={() => setIsAdding(false)} className="px-4 text-gray-500 uppercase text-[9px] font-black h-[54px] hover:text-white transition-colors">SAIR</button>
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
        <input 
          placeholder="Localizar registro por nome ou protocolo telefônico..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-black/60 border border-white/10 rounded-2xl pl-14 pr-6 py-5 focus:outline-none focus:border-cyber-neon text-white text-sm shadow-inner"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
           <div className="col-span-full p-20 text-center opacity-30 font-orbitron uppercase text-[10px] tracking-[0.4em]">BANCO DE DADOS VAZIO</div>
        ) : filtered.map(customer => (
          <div key={customer.id} className="glass p-6 rounded-3xl border border-white/5 hover:border-cyber-neon transition-all group relative overflow-hidden bg-black/40 shadow-sm">
             {customer.debt > 0 ? (
              <div className="absolute top-0 right-0 bg-cyber-pink/20 text-cyber-pink text-[8px] px-3 py-1.5 font-black rounded-bl-xl border-b border-l border-cyber-pink/40 shadow-neon-pink flex items-center gap-1">
                <AlertCircle size={10}/> PENDÊNCIA: R$ {customer.debt.toFixed(2)}
              </div>
            ) : (
              <div className="absolute top-0 right-0 bg-cyber-neon/10 text-cyber-neon text-[8px] px-3 py-1.5 font-black rounded-bl-xl border-b border-l border-cyber-neon/40 flex items-center gap-1">
                <ShieldCheck size={10}/> CONFORMIDADE
              </div>
            )}

            <div className="flex items-center gap-4 mb-6 mt-2">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-cyber-neon font-orbitron text-xl shadow-inner">
                {customer.name.charAt(0)}
              </div>
              <div className="flex-1 overflow-hidden">
                <h4 className="text-sm font-black uppercase tracking-widest text-white truncate group-hover:text-cyber-neon transition-colors">{customer.name}</h4>
                <p className="text-[10px] text-gray-500 font-mono mt-1 flex items-center gap-2">
                  <Phone size={10}/> {customer.phone}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
               <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-[8px] uppercase text-gray-500 mb-1">Volume Gasto</p>
                  <p className="text-xs font-black text-white digital-font">R$ {customer.totalSpent.toFixed(2)}</p>
               </div>
               <div className={`p-3 rounded-xl border ${customer.debt > 0 ? 'bg-cyber-pink/5 border-cyber-pink/10' : 'bg-cyber-neon/5 border-cyber-neon/10'}`}>
                  <p className="text-[8px] uppercase text-gray-400 mb-1">Saldo Devedor</p>
                  <p className={`text-xs font-black digital-font ${customer.debt > 0 ? 'text-cyber-pink' : 'text-cyber-neon'}`}>R$ {customer.debt.toFixed(2)}</p>
               </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/5">
              <div className="flex gap-2">
                <button 
                  onClick={() => window.open(`https://wa.me/55${customer.phone.replace(/\D/g, '')}`, '_blank')}
                  className="p-2.5 hover:bg-cyber-neon/10 text-gray-400 hover:text-cyber-neon rounded-lg transition-all" 
                  title="Enviar Mensagem Nexus"
                >
                  <Phone size={16}/>
                </button>
                <button className="p-2.5 hover:bg-white/5 text-gray-400 hover:text-white rounded-lg transition-all" title="Logs de Transação"><History size={16}/></button>
              </div>
              <button onClick={() => deleteCust(customer.id)} className="p-2.5 hover:bg-cyber-pink/10 text-gray-600 hover:text-cyber-pink rounded-lg transition-all"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CRM;
