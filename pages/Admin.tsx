
import React, { useState } from 'react';
import { OfficeUnit, Sale } from '../types';
import { 
  Plus, MessageCircle, Trash2, ShieldAlert, ShieldCheck, 
  ExternalLink, User, Cpu, ChevronDown, ChevronRight, Users 
} from 'lucide-react';

interface AdminProps {
  offices: OfficeUnit[];
  setOffices: React.Dispatch<React.SetStateAction<OfficeUnit[]>>;
  sales: Sale[];
}

const Admin: React.FC<AdminProps> = ({ offices, setOffices, sales }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newOffice, setNewOffice] = useState({ name: '', email: '', phone: '', referrerEmail: '' });

  const handleAddOffice = () => {
    if (!newOffice.name || !newOffice.email) return;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    const unit: OfficeUnit = {
      id: 'NX-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      name: newOffice.name,
      ownerEmail: newOffice.email,
      referrerEmail: newOffice.referrerEmail,
      revenue: 0,
      active: true,
      status: 'NORMAL',
      expiryDate: expiry.toISOString(),
      phone: newOffice.phone
    };
    setOffices(prev => [...prev, unit]);
    setShowAddForm(false);
    setNewOffice({ name: '', email: '', phone: '', referrerEmail: '' });
  };

  const deleteOffice = (id: string) => {
    if (window.confirm("Deseja EXCLUIR permanentemente esta unidade?")) {
      setOffices(prev => prev.filter(o => o.id !== id));
    }
  };

  const toggleStatus = (id: string, active: boolean) => {
    setOffices(prev => prev.map(o => o.id === id ? { ...o, active: !active, status: !active ? 'NORMAL' : 'BLOCKED' } : o));
  };

  const buildTree = () => {
    const map = new Map();
    const roots: any[] = [];
    offices.forEach(o => map.set(o.ownerEmail, { ...o, children: [] }));
    offices.forEach(o => {
      if (o.referrerEmail && map.has(o.referrerEmail)) map.get(o.referrerEmail).children.push(map.get(o.ownerEmail));
      else roots.push(map.get(o.ownerEmail));
    });
    return roots;
  };

  return (
    <div className="space-y-10 animate-in fade-in pb-32">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-orbitron font-black text-white">Rede <span className="text-cyber-neon">Roots</span></h2>
          <p className="text-gray-500 text-[10px] font-orbitron uppercase tracking-widest mt-2">Mapeamento de Escritórios</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="bg-cyber-neon text-black px-8 py-4 rounded-xl font-black font-orbitron text-[10px] tracking-widest flex items-center gap-2 shadow-neon-cyan hover:scale-105 active:scale-95 transition-all">
          <Plus size={18} /> NOVA UNIDADE
        </button>
      </header>

      {showAddForm && (
        <div className="glass p-8 rounded-3xl border border-cyber-neon/30 grid grid-cols-1 md:grid-cols-2 gap-6 shadow-neon-cyan animate-in slide-in-from-top">
          <input placeholder="Nome" className="bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-cyber-neon" value={newOffice.name} onChange={e => setNewOffice({...newOffice, name: e.target.value})}/>
          <input placeholder="Email Gestor" className="bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-cyber-neon" value={newOffice.email} onChange={e => setNewOffice({...newOffice, email: e.target.value})}/>
          <input placeholder="Zap" className="bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-cyber-neon" value={newOffice.phone} onChange={e => setNewOffice({...newOffice, phone: e.target.value})}/>
          <input placeholder="Email Indicador" className="bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-cyber-neon" value={newOffice.referrerEmail} onChange={e => setNewOffice({...newOffice, referrerEmail: e.target.value})}/>
          <div className="md:col-span-2 flex justify-end gap-4">
             <button onClick={() => setShowAddForm(false)} className="text-gray-500 uppercase font-black text-[10px] tracking-widest">Cancelar</button>
             <button onClick={handleAddOffice} className="bg-cyber-neon text-black px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-neon-cyan">Cadastrar</button>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center py-10 w-full overflow-x-auto min-h-[500px]">
        {buildTree().length === 0 ? (
          <div className="text-center opacity-30 mt-20">
            <Users size={64} className="mx-auto text-cyber-neon mb-4" />
            <p className="font-orbitron uppercase tracking-[0.3em] text-xs">Aguardando inicialização da rede.</p>
          </div>
        ) : (
          buildTree().map((root) => (
            <TreeNode key={root.id} node={root} onDelete={deleteOffice} onToggleStatus={toggleStatus} />
          ))
        )}
      </div>
    </div>
  );
};

const TreeNode: React.FC<{ node: any, onDelete: (id: string) => void, onToggleStatus: (id: string, a: boolean) => void }> = ({ node, onDelete, onToggleStatus }) => {
  const [isOpen, setIsOpen] = useState(true);
  const statusColor = node.active ? 'border-cyber-neon shadow-neon-cyan' : 'border-red-500 shadow-lg shadow-red-500/40';
  const handleZap = () => window.open(`https://wa.me/55${node.phone?.replace(/\D/g, '')}`, '_blank');

  return (
    <div className="flex flex-col items-center relative">
      <div className={`relative z-10 w-64 p-5 rounded-2xl border bg-black/80 transition-all ${statusColor}`}>
        <div className="flex flex-col gap-4 text-white">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-black/60 border ${node.active ? 'border-cyber-neon/40 text-cyber-neon' : 'border-red-500/40 text-red-500'}`}>
              <User size={20} />
            </div>
            <div className="flex-1 overflow-hidden">
              <h4 className="text-[10px] font-black font-orbitron uppercase truncate tracking-widest">{node.name}</h4>
              <p className="text-[8px] font-mono text-gray-500 truncate tracking-widest">{node.ownerEmail}</p>
            </div>
            {node.children.length > 0 && (
              <button onClick={() => setIsOpen(!isOpen)} className="text-gray-400 hover:text-white transition-colors">{isOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}</button>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/5">
            <button onClick={() => onDelete(node.id)} className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg flex justify-center transition-colors"><Trash2 size={16}/></button>
            <button onClick={handleZap} className="p-2 hover:bg-green-500/10 text-green-500 rounded-lg flex justify-center transition-colors"><MessageCircle size={16}/></button>
            <button onClick={() => onToggleStatus(node.id, node.active)} className="p-2 hover:bg-yellow-500/10 text-yellow-500 rounded-lg flex justify-center transition-colors">{node.active ? <ShieldAlert size={16}/> : <ShieldCheck size={16}/>}</button>
            <button className="p-2 hover:bg-cyber-neon/10 text-cyber-neon rounded-lg flex justify-center transition-colors"><ExternalLink size={16}/></button>
          </div>
        </div>
      </div>
      {node.children.length > 0 && isOpen && (
        <div className="flex gap-8 mt-12 relative pt-8">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-8 w-px bg-cyber-neon shadow-neon-cyan"></div>
          {node.children.map((child: any) => (
            <div key={child.id} className="relative flex flex-col items-center">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-8 w-px bg-cyber-neon shadow-neon-cyan"></div>
              <TreeNode node={child} onDelete={onDelete} onToggleStatus={onToggleStatus} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Admin;
