import React, { useState, useEffect } from 'react';
import { dbService } from '../services/firebase';
import { UserProfile } from '../types';
import { Search, Loader2, RefreshCw, Trash2, ShieldAlert, UserCheck, Ban, Calendar } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

const AdminView: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = dbService.watchNetwork((data) => {
      setUsers(data as UserProfile[]);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  const handleToggleBlock = async (user: UserProfile) => {
    const newStatus = user.status === 'blocked' ? 'active' : 'blocked';
    dbService.update('users', user.uid, { status: newStatus });
  };

  const handleExtendTrial = async (user: UserProfile) => {
    const newDate = new Date();
    newDate.setMonth(newDate.getMonth() + 1);
    dbService.update('users', user.uid, { subscriptionExpiresAt: Timestamp.fromDate(newDate) });
  };

  const handleDelete = async (uid: string) => {
    dbService.del('users', uid).catch(() => alert("Erro ao excluir."));
  };

  const filteredUsers = users.filter(u => u.email.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-brand-blue rounded-2xl flex items-center justify-center shadow-lg shadow-brand-blue/30">
            <ShieldAlert size={32} className="text-white" />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white italic tracking-tighter text-glow-brand-blue leading-none uppercase">Console Master</h2>
            <p className="text-slate-500 font-bold text-sm tracking-wide uppercase opacity-70">Controle Global da Rede NEXUS.</p>
          </div>
        </div>
        <div className="bg-white/5 px-6 py-4 rounded-2xl border border-white/10">
          <p className="text-[9px] font-black text-brand-cyan uppercase tracking-widest mb-1">Operadores Ativos</p>
          <p className="text-2xl font-black text-white italic">{users.length}</p>
        </div>
      </div>

      <div className="bg-[#1a0a2e]/80 p-6 rounded-3xl border border-brand-blue/20 flex items-center gap-4">
        <Search className="text-brand-blue/50" size={24} />
        <input 
          placeholder="Localizar terminal operacional..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="flex-1 bg-transparent outline-none font-black text-white placeholder:text-slate-700 text-xl" 
        />
      </div>

      <div className="nexus-card overflow-hidden bg-[#0f041a]/90">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="bg-brand-blue/5">
                <th className="px-8 py-6 text-[10px] font-black text-brand-cyan uppercase tracking-widest opacity-60">Operador</th>
                <th className="px-8 py-6 text-[10px] font-black text-brand-cyan uppercase tracking-widest opacity-60">Expiração</th>
                <th className="px-8 py-6 text-[10px] font-black text-brand-cyan uppercase tracking-widest opacity-60">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-brand-cyan uppercase tracking-widest opacity-60 text-right">Controle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr><td colSpan={4} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-brand-blue" /></td></tr>
              ) : filteredUsers.map(user => (
                <tr key={user.uid} className="hover:bg-brand-blue/5 transition-all group">
                  <td className="px-8 py-8">
                    <p className="font-black text-white text-lg tracking-tight">{user.email}</p>
                    <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">ID: {user.uid.substring(0,10)}</p>
                  </td>
                  <td className="px-8 py-8 text-slate-400 text-sm font-bold flex items-center gap-3">
                    <Calendar size={14} className="text-brand-cyan/40" />
                    {user.subscriptionExpiresAt?.toDate().toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-8 py-8">
                     <span className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase border ${user.status === 'active' ? 'bg-brand-green/10 text-brand-green border-brand-green/20' : 'bg-brand-orange/10 text-brand-orange border-brand-orange/20'}`}>
                       {user.status === 'active' ? 'OPERACIONAL' : 'BLOQUEADO'}
                     </span>
                  </td>
                  <td className="px-8 py-8 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleExtendTrial(user)} className="p-3 bg-brand-green/10 text-brand-green rounded-xl hover:bg-brand-green hover:text-black transition-all" title="Estender Acesso"><RefreshCw size={18} /></button>
                      <button onClick={() => handleToggleBlock(user)} className={`p-3 rounded-xl transition-all ${user.status === 'blocked' ? 'bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan hover:text-black' : 'bg-brand-orange/10 text-brand-orange hover:bg-brand-orange hover:text-white'}`} title="Bloquear/Desbloquear">{user.status === 'blocked' ? <UserCheck size={18} /> : <Ban size={18} />}</button>
                      {user.role !== 'super-admin' && (
                        <button onClick={() => handleDelete(user.uid)} className="p-3 bg-white/5 text-slate-500 rounded-xl hover:bg-brand-orange hover:text-white transition-all"><Trash2 size={18} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminView;