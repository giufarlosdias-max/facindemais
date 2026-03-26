import React, { useState, useEffect } from 'react';
import { dbService, Timestamp } from '../services/firebase';
import { UserProfile } from '../types';
import { 
  Building2, Trash2, Search, DollarSign, Loader2, Zap, CheckCircle, 
  MessageCircle, Users, X, Plus, Wallet, TrendingUp, Lock, Unlock, ShieldAlert
} from 'lucide-react';

interface OfficeManagementProps {
  superAdminProfile: UserProfile;
}

const OfficeManagement: React.FC<OfficeManagementProps> = ({ superAdminProfile }) => {
  const [offices, setOffices] = useState<UserProfile[]>([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState<string | null>(null);
  const [isModalCreateOpen, setIsModalCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const [newOffice, setNewOffice] = useState({
    email: '',
    officeName: '',
    phone: '',
    subscriptionStatus: 'TRIAL' as 'TRIAL' | 'PAID'
  });

  const currentOffice = offices.find(o => o.uid === selectedOfficeId);

  useEffect(() => {
    const unsub = dbService.watchNetwork((data) => {
      setOffices(data as UserProfile[]);
    });
    return () => unsub();
  }, []);

  const getL1 = (uid?: string) => offices.filter(o => o.referredBy === (uid || superAdminProfile.uid));
  const getL2 = (l1Id: string) => offices.filter(o => o.referredBy === l1Id);
  const getL3 = (l2Id: string) => offices.filter(o => o.referredBy === l2Id);

  const calculateOfficeGains = (officeUid: string) => {
    const l1 = offices.filter(u => u.lineage?.l1 === officeUid && u.subscriptionStatus === 'PAID').length;
    const l2 = offices.filter(u => u.lineage?.l2 === officeUid && u.subscriptionStatus === 'PAID').length;
    const l3 = offices.filter(u => u.lineage?.l3 === officeUid && u.subscriptionStatus === 'PAID').length;
    return (l1 * 1.00) + (l2 * 0.50) + (l3 * 0.25);
  };

  const getStatusInfo = (office: UserProfile) => {
    const isExpired = office.subscriptionExpiresAt?.toDate() < new Date();
    if (office.status === 'blocked') return { label: 'BLOQUEADO', color: 'bg-slate-900', text: 'text-white' };
    if (office.subscriptionStatus === 'PAID' && !isExpired) return { label: 'PAGO', color: 'bg-brand-green', text: 'text-white' };
    if (office.subscriptionStatus === 'TRIAL' && !isExpired) return { label: 'TRIAL', color: 'bg-brand-cyan', text: 'text-white' };
    return { label: 'INADIMPLENTE', color: 'bg-brand-orange', text: 'text-white' };
  };

  const handleConfirmPayment = async (uid: string) => {
    if(!confirm('Deseja renovar este escritório por mais 30 dias?')) return;
    const nextExpiry = new Date();
    nextExpiry.setDate(nextExpiry.getDate() + 30);
    const userName = superAdminProfile.fullName || superAdminProfile.officeName || superAdminProfile.email;
    await dbService.update('users', uid, { 
      subscriptionStatus: 'PAID',
      status: 'active',
      subscriptionExpiresAt: Timestamp.fromDate(nextExpiry)
    }, superAdminProfile.uid, userName);
    alert('Escritório renovado com sucesso!');
  };

  const handleToggleBlock = async (uid: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'blocked' : 'active';
    if(!confirm(`Deseja ${nextStatus === 'blocked' ? 'BLOQUEAR' : 'DESBLOQUEAR'} este escritório?`)) return;
    const userName = superAdminProfile.fullName || superAdminProfile.officeName || superAdminProfile.email;
    await dbService.update('users', uid, { status: nextStatus }, superAdminProfile.uid, userName);
  };

  const handleDeleteOffice = async (uid: string) => {
    if(!confirm('ATENÇÃO: Deseja EXCLUIR permanentemente este escritório? Esta ação não pode ser desfeita.')) return;
    await dbService.del('users', uid);
    setSelectedOfficeId(null);
    alert('Escritório excluído.');
  };

  const OfficeNode = ({ office, label, sublabel, size = "md" }: { office: UserProfile, label: string, sublabel: string, size?: "lg" | "md" | "sm" }) => {
    const status = getStatusInfo(office);
    return (
      <div className="flex flex-col items-center group animate-fade relative">
        <div 
          onClick={() => setSelectedOfficeId(office.uid)}
          className={`cursor-pointer transition-all duration-300 hover:scale-105 flex flex-col items-center z-10`}
        >
          <div className={`rounded-full shadow-2xl flex items-center justify-center border-4 border-white/20 bg-gradient-to-b from-brand-blue to-brand-cyan p-2 mb-2 ${size === 'lg' ? 'w-24 h-24' : size === 'md' ? 'w-16 h-16' : 'w-12 h-12'}`}>
            <div className="w-full h-full rounded-full bg-brand-blue/40 flex items-center justify-center overflow-hidden">
               {office.profilePicUrl ? (
                 <img src={office.profilePicUrl} className="w-full h-full object-cover" />
               ) : (
                 <Building2 size={size === 'lg' ? 44 : 24} className="text-white drop-shadow-lg" />
               )}
            </div>
          </div>
          <div className={`px-4 py-1.5 rounded-full shadow-md border border-white/10 min-w-[140px] text-center ${status.color} transform -translate-y-4`}>
             <p className={`text-[10px] font-black uppercase truncate leading-tight ${status.text}`}>{label}</p>
          </div>
          <div className="mt-[-10px] bg-brand-blue/80 backdrop-blur-sm px-3 py-1 rounded-full border border-brand-blue/30">
             <p className="text-[8px] font-bold text-brand-cyan uppercase tracking-tighter whitespace-nowrap">{sublabel}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-brand-blue rounded-[2.5rem] overflow-hidden shadow-2xl relative p-10">
      <div className="absolute inset-0 bg-gradient-to-b from-brand-cyan/20 via-transparent to-brand-blue/40 pointer-events-none"></div>

      <header className="relative z-20 flex flex-col items-center mb-16">
        <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase mb-2 drop-shadow-2xl">Nosso Time</h2>
        <p className="text-brand-cyan font-bold text-[10px] uppercase tracking-[0.4em] opacity-80 mb-6">Gestão Hierárquica de Escritórios</p>
        <button onClick={() => setIsModalCreateOpen(true)} className="bg-brand-blue text-white px-8 py-4 rounded-full font-black text-[10px] uppercase flex items-center gap-2 shadow-2xl hover:bg-brand-green transition-all transform hover:scale-105 border border-white/10">
          <Plus size={16}/> CADASTRAR TERMINAL
        </button>
      </header>

      <main className="relative z-20 pb-60 px-4 overflow-x-auto custom-scrollbar">
        <div className="min-w-[1400px] flex flex-col items-center">
          
          {/* VOCÊ (ROOT) */}
          <section className="mb-32 relative">
            <OfficeNode office={superAdminProfile} label="Você" sublabel="ESCRITÓRIO LÍDER" size="lg" />
            <div className="absolute bottom-[-80px] left-1/2 -translate-x-1/2 w-px h-[80px] bg-white/30"></div>
          </section>

          {/* GERAÇÃO 1 */}
          <div className="flex justify-center gap-48 relative mb-32">
            {getL1().length > 1 && (
              <div className="absolute top-[-40px] left-[15%] right-[15%] h-px bg-white/30"></div>
            )}
            
            {getL1().map(l1 => (
              <div key={l1.uid} className="flex flex-col items-center relative">
                <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 w-px h-[40px] bg-white/30"></div>
                <OfficeNode office={l1} label={l1.officeName} sublabel="1ª GERAÇÃO" />
                
                {/* LINHA PARA GERAÇÃO 2 */}
                {getL2(l1.uid).length > 0 && (
                  <div className="absolute bottom-[-60px] left-1/2 -translate-x-1/2 w-px h-[60px] bg-white/20"></div>
                )}

                {/* GERAÇÃO 2 */}
                <div className="flex gap-16 mt-24 relative">
                  {getL2(l1.uid).length > 1 && (
                    <div className="absolute top-[-30px] left-[20%] right-[20%] h-px bg-white/20"></div>
                  )}
                  {getL2(l1.uid).map(l2 => (
                    <div key={l2.uid} className="flex flex-col items-center relative">
                      <div className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-px h-[30px] bg-white/20"></div>
                      <OfficeNode office={l2} label={l2.officeName} sublabel="2ª GERAÇÃO" size="sm" />

                      {/* GERAÇÃO 3 */}
                      <div className="flex gap-6 mt-16 relative">
                         {getL3(l2.uid).map(l3 => (
                           <div key={l3.uid} className="flex flex-col items-center relative">
                             <div className="absolute top-[-15px] left-1/2 -translate-x-1/2 w-px h-[15px] bg-white/10"></div>
                             <OfficeNode office={l3} label={l3.officeName} sublabel="3ª GERAÇÃO" size="sm" />
                           </div>
                         ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* MODAL DETALHES DO ESCRITÓRIO */}
      {currentOffice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-brand-blue/90 backdrop-blur-md animate-fade">
           <div className="w-full max-w-6xl bg-white rounded-[3rem] shadow-2xl overflow-hidden border-t-8 border-brand-blue animate-fade-in-up">
              <div className="p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
                 
                 {/* COLUNA 1: INFO E AÇÕES EXATA */}
                 <div className="space-y-8">
                    <div className="flex items-center gap-6">
                       <div className="w-20 h-20 bg-brand-blue/5 text-brand-blue rounded-3xl flex items-center justify-center border border-brand-blue/10">
                          <Building2 size={40}/>
                       </div>
                       <div>
                          <h4 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">{currentOffice.officeName}</h4>
                          <span className={`px-4 py-1 rounded-full text-[8px] font-black uppercase mt-2 inline-block ${getStatusInfo(currentOffice).color} ${getStatusInfo(currentOffice).text}`}>
                            {getStatusInfo(currentOffice).label}
                          </span>
                       </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                       <div className="flex justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Login E-mail</span>
                          <span className="text-xs font-black text-slate-900">{currentOffice.email}</span>
                       </div>
                       <div className="flex justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">WhatsApp</span>
                          <span className="text-xs font-black text-slate-900">{currentOffice.phone || '---'}</span>
                       </div>
                       <div className="flex justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Validade</span>
                          <span className="text-xs font-black text-brand-blue uppercase">{currentOffice.subscriptionExpiresAt?.toDate().toLocaleDateString('pt-BR')}</span>
                       </div>
                    </div>

                    {/* BOTÕES DE AÇÃO SOLICITADOS */}
                    <div className="flex flex-col gap-3">
                       <button onClick={() => handleConfirmPayment(currentOffice.uid)} className="w-full py-5 bg-brand-green text-white rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-brand-green/90 flex items-center justify-center gap-2 transition-all">
                          <CheckCircle size={18}/> RENOVAR (30 DIAS)
                       </button>
                       <div className="grid grid-cols-2 gap-3">
                          <button onClick={() => handleToggleBlock(currentOffice.uid, currentOffice.status)} className={`py-4 rounded-2xl font-black text-[10px] uppercase border flex items-center justify-center gap-2 transition-all ${currentOffice.status === 'active' ? 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20' : 'bg-slate-900 text-white border-slate-900'}`}>
                             {currentOffice.status === 'active' ? <Lock size={16}/> : <Unlock size={16}/>}
                             {currentOffice.status === 'active' ? 'BLOQUEAR' : 'DESBLOQUEAR'}
                          </button>
                          <button onClick={() => handleDeleteOffice(currentOffice.uid)} className="py-4 bg-brand-orange/10 text-brand-orange border border-brand-orange/20 rounded-2xl font-black text-[10px] uppercase hover:bg-brand-orange hover:text-white flex items-center justify-center gap-2 transition-all">
                             <Trash2 size={16}/> EXCLUIR
                          </button>
                       </div>
                       <button onClick={() => setSelectedOfficeId(null)} className="w-full py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-200">FECHAR DETALHES</button>
                    </div>
                 </div>

                 {/* COLUNA 2: PERFORMANCE E GANHOS */}
                 <div className="space-y-8 lg:border-x lg:px-12 border-slate-100">
                    <div>
                       <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                         <TrendingUp size={16} className="text-brand-cyan"/> Performance do Escritório
                       </h5>
                       <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-6 opacity-10"><Wallet size={48}/></div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Comissão Acumulada</p>
                          <p className="text-4xl font-black italic text-brand-cyan tracking-tighter">R$ {calculateOfficeGains(currentOffice.uid).toFixed(2)}</p>
                          <p className="text-[8px] text-slate-500 font-bold uppercase mt-3">Valor gerado pela rede deste escritório</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                       <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Indicados</p>
                          <p className="text-xl font-black text-slate-900">{offices.filter(u => u.referredBy === currentOffice.uid).length}</p>
                       </div>
                       <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Ativos (L1)</p>
                          <p className="text-xl font-black text-brand-green">{offices.filter(u => u.lineage?.l1 === currentOffice.uid && u.subscriptionStatus === 'PAID').length}</p>
                       </div>
                       <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Total Rede</p>
                          <p className="text-xl font-black text-slate-900">
                            {offices.filter(u => u.lineage?.l1 === currentOffice.uid || u.lineage?.l2 === currentOffice.uid || u.lineage?.l3 === currentOffice.uid).length}
                          </p>
                       </div>
                    </div>
                 </div>

                 {/* COLUNA 3: LISTA DE INDICADOS DIRETOS */}
                 <div className="space-y-6">
                    <div className="flex justify-between items-center">
                       <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Users size={16} className="text-brand-blue"/> Seus Indicados Diretos
                       </h5>
                    </div>

                    <div className="max-h-80 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                       {getL1(currentOffice.uid).length > 0 ? getL1(currentOffice.uid).map(ind => (
                         <div key={ind.uid} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-3">
                               <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${getStatusInfo(ind).color} ${getStatusInfo(ind).text}`}>
                                  {ind.officeName.charAt(0).toUpperCase()}
                               </div>
                               <div>
                                  <p className="text-xs font-black text-slate-900 uppercase truncate w-32">{ind.officeName}</p>
                                  <p className="text-[8px] font-bold text-slate-400 uppercase">{getStatusInfo(ind).label}</p>
                               </div>
                            </div>
                            <span className={`px-2 py-1 rounded text-[8px] font-black ${ind.subscriptionStatus === 'PAID' ? 'bg-brand-green/10 text-brand-green' : 'bg-slate-200 text-slate-400'}`}>
                               {ind.subscriptionStatus === 'PAID' ? '+ R$ 1,00' : 'R$ 0,00'}
                            </span>
                         </div>
                       )) : (
                         <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Nenhuma indicação direta.</p>
                         </div>
                       )}
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                       <button onClick={() => {
                          const phone = currentOffice.phone?.replace(/\D/g, '');
                          if (phone) window.open(`https://wa.me/55${phone}?text=Olá ${currentOffice.officeName}!`, '_blank');
                       }} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-3">
                          <MessageCircle size={18}/> COBRAR VIA WHATSAPP
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

          {/* MODAL CRIAÇÃO MANUAL */}
          {isModalCreateOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-brand-blue/90 backdrop-blur-md animate-fade">
               <div className="w-full max-w-md bg-white p-8 rounded-[2rem] shadow-2xl border-t-8 border-brand-blue">
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-2xl font-black text-brand-blue uppercase italic">Cadastrar Escritório</h3>
                     <button onClick={() => setIsModalCreateOpen(false)} className="text-slate-300 hover:text-brand-orange"><X size={28}/></button>
                  </div>

              <form onSubmit={async (e) => {
                 e.preventDefault();
                 setIsCreating(true);
                 try {
                    const tempId = `adm-${Date.now()}`;
                    const exp = new Date();
                    exp.setDate(exp.getDate() + (newOffice.subscriptionStatus === 'PAID' ? 30 : 3));
                    await dbService.updateProfile(tempId, {
                       uid: tempId,
                       email: newOffice.email.toLowerCase(),
                       officeName: newOffice.officeName.toUpperCase(),
                       phone: newOffice.phone,
                       role: 'admin',
                       status: 'active',
                       subscriptionStatus: newOffice.subscriptionStatus,
                       subscriptionExpiresAt: Timestamp.fromDate(exp),
                       createdAt: Timestamp.now(),
                       referralCode: tempId.substring(0,6).toUpperCase(),
                       referredBy: superAdminProfile.uid,
                       lineage: { l1: superAdminProfile.uid, l2: '', l3: '' }
                    });
                    setIsModalCreateOpen(false);
                    alert('Escritório Ativado!');
                 } catch (err) { alert('Erro.'); } finally { setIsCreating(false); }
              }} className="space-y-6">
                 <input required placeholder="E-MAIL DE LOGIN" type="email" value={newOffice.email} onChange={e=>setNewOffice({...newOffice, email: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" />
                 <input required placeholder="NOME DO ESCRITÓRIO" value={newOffice.officeName} onChange={e=>setNewOffice({...newOffice, officeName: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold uppercase" />
                 <div className="grid grid-cols-2 gap-4">
                    <input placeholder="WHATSAPP" value={newOffice.phone} onChange={e=>setNewOffice({...newOffice, phone: e.target.value})} className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" />
                    <select value={newOffice.subscriptionStatus} onChange={e=>setNewOffice({...newOffice, subscriptionStatus: e.target.value as any})} className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold">
                       <option value="TRIAL">TRIAL (3 DIAS)</option>
                       <option value="PAID">PAGO (30 DIAS)</option>
                    </select>
                 </div>
                 <button disabled={isCreating} className="w-full py-5 bg-orange-500 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-orange-600">
                    {isCreating ? <Loader2 className="animate-spin mx-auto"/> : 'ATIVAR TERMINAL AGORA'}
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default OfficeManagement;