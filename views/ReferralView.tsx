
import React, { useState, useEffect } from 'react';
import { 
  Gift, Share2, Copy, Trophy, Zap, Smartphone, MessageCircle, Mail, 
  ChevronRight, Info, ShieldCheck, DollarSign, Wallet, ArrowUpRight,
  TrendingUp, Users, CheckCircle, FileText, Megaphone, Loader2
} from 'lucide-react';
import { UserProfile } from '../types';
import { dbService } from '../services/firebase';

interface ReferralViewProps { profile: UserProfile; }

const ReferralView: React.FC<ReferralViewProps> = ({ profile }) => {
  const [targetPhone, setTargetPhone] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [network, setNetwork] = useState({ l1: [] as any[], l2: [] as any[], l3: [] as any[] });
  const [activeTab, setActiveTab] = useState<'PANEL' | 'PLAN' | 'MARKETING'>('PANEL');

  useEffect(() => {
    return dbService.watchNetwork((users) => {
      const l1 = users.filter(u => u.lineage?.l1 === profile.uid);
      const l2 = users.filter(u => u.lineage?.l2 === profile.uid);
      const l3 = users.filter(u => u.lineage?.l3 === profile.uid);
      setNetwork({ l1, l2, l3 });
    });
  }, [profile.uid]);

  const referralLink = `${window.location.origin}/?ref=${profile.referralCode}`;
  
  const paidL1 = network.l1.filter(u => u.subscriptionStatus === 'PAID').length;
  const paidL2 = network.l2.filter(u => u.subscriptionStatus === 'PAID').length;
  const paidL3 = network.l3.filter(u => u.subscriptionStatus === 'PAID').length;

  const gainL1 = paidL1 * 1.00;
  const gainL2 = paidL2 * 0.50;
  const gainL3 = paidL3 * 0.25;
  const totalMonthlyRecurring = gainL1 + gainL2 + gainL3;

  const shareWhatsApp = async () => {
    if (!targetPhone || !targetEmail) return alert("Preencha o e-mail e o WhatsApp do indicado.");
    
    setIsSending(true);
    try {
      // Cria o escritório virtual automaticamente
      await dbService.preRegisterReferral(targetEmail, targetPhone, profile);
      
      const message = encodeURIComponent(`Olá! Preparei seu acesso ao *Nexus*. \n\nSeu escritório virtual já está pré-criado com 3 dias de teste grátis!\n\n🔗 Link: ${referralLink}\n📧 Login: ${targetEmail}\n🔑 Senha Temporária: 123\n\nGerencie suas vendas agora de forma profissional!`);
      const cleanPhone = targetPhone.replace(/\D/g, '');
      window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
      
      setTargetEmail('');
      setTargetPhone('');
      alert("Convite enviado e Escritório Virtual pré-ativado por 3 dias!");
    } catch (err) {
      alert("Erro ao processar convite.");
    } finally {
      setIsSending(false);
    }
  };

  const copyLink = () => { 
    navigator.clipboard.writeText(referralLink); 
    alert('Link de Indicação copiado!'); 
  };

  return (
    <div className="space-y-10 animate-fade pb-24 px-2 lg:px-0">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Renda Passiva Recorrente</p>
          <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase">Sistema de Afiliados</h2>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
           <button onClick={() => setActiveTab('PANEL')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'PANEL' ? 'bg-white text-brand-orange shadow-sm' : 'text-slate-400'}`}>Meu Painel</button>
           <button onClick={() => setActiveTab('PLAN')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'PLAN' ? 'bg-white text-brand-orange shadow-sm' : 'text-slate-400'}`}>Regras de Ganho</button>
           <button onClick={() => setActiveTab('MARKETING')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'MARKETING' ? 'bg-white text-brand-orange shadow-sm' : 'text-slate-400'}`}>Divulgação</button>
        </div>
      </header>

      {activeTab === 'PANEL' && (
        <div className="space-y-8">
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <div className="nexus-card p-6 border-slate-100 bg-white">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">🥇 1ª Geração</p>
                <p className="text-2xl font-black text-slate-900 italic">{network.l1.length} <span className="text-[10px] text-slate-400 font-bold not-italic">Membros</span></p>
                <div className="flex justify-between items-center mt-2 border-t border-slate-50 pt-2">
                   <span className="text-[8px] text-emerald-500 font-bold uppercase">{paidL1} Ativos</span>
                   <span className="text-[10px] font-black text-slate-900">R$ {gainL1.toFixed(2)}</span>
                </div>
             </div>
             <div className="nexus-card p-6 border-slate-100 bg-white">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">🥈 2ª Geração</p>
                <p className="text-2xl font-black text-slate-900 italic">{network.l2.length} <span className="text-[10px] text-slate-400 font-bold not-italic">Membros</span></p>
                <div className="flex justify-between items-center mt-2 border-t border-slate-50 pt-2">
                   <span className="text-[8px] text-emerald-500 font-bold uppercase">{paidL2} Ativos</span>
                   <span className="text-[10px] font-black text-slate-900">R$ {gainL2.toFixed(2)}</span>
                </div>
             </div>
             <div className="nexus-card p-6 border-slate-100 bg-white">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">🥉 3ª Geração</p>
                <p className="text-2xl font-black text-slate-900 italic">{network.l3.length} <span className="text-[10px] text-slate-400 font-bold not-italic">Membros</span></p>
                <div className="flex justify-between items-center mt-2 border-t border-slate-50 pt-2">
                   <span className="text-[8px] text-emerald-500 font-bold uppercase">{paidL3} Ativos</span>
                   <span className="text-[10px] font-black text-slate-900">R$ {gainL3.toFixed(2)}</span>
                </div>
             </div>
             <div className="nexus-card p-6 border-brand-orange bg-brand-orange text-white shadow-xl shadow-brand-orange/20">
                <p className="text-[9px] font-black text-orange-100 uppercase tracking-widest mb-2 flex items-center gap-2"><Wallet size={12}/> Total Recorrente</p>
                <p className="text-3xl font-black italic tracking-tighter">R$ {totalMonthlyRecurring.toFixed(2)}</p>
                <p className="text-[8px] text-orange-100 font-bold uppercase mt-1 italic">Estimado por Mês</p>
             </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="nexus-card p-8 bg-slate-50 border-slate-200">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-black uppercase text-slate-900 tracking-widest flex items-center gap-2"><Megaphone size={16} className="text-brand-orange"/> Criar Escritório para Amigo</h3>
                </div>
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center gap-4">
                    <div className="flex-1 w-full">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1 ml-1">Seu Link de Convite</p>
                      <p className="text-xs font-bold text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-100 truncate">{referralLink}</p>
                    </div>
                    <button onClick={copyLink} className="w-full md:w-auto px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase hover:bg-slate-800 transition-all flex items-center justify-center gap-2"><Copy size={14}/> Copiar Link</button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase ml-1">E-mail do Amigo (Login)</label>
                      <input type="email" placeholder="email@amigo.com" value={targetEmail} onChange={e=>setTargetEmail(e.target.value)} className="w-full p-4 rounded-xl border border-slate-200 text-sm font-bold bg-white" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase ml-1">WhatsApp do Amigo</label>
                      <input placeholder="11999999999" value={targetPhone} onChange={e=>setTargetPhone(e.target.value)} className="w-full p-4 rounded-xl border border-slate-200 text-sm font-bold bg-white" />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button 
                      onClick={shareWhatsApp} 
                      disabled={isSending}
                      className="w-full bg-brand-green text-white p-4 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-3 shadow-lg shadow-brand-green/10 hover:bg-brand-green/80 transition-all disabled:opacity-50"
                    >
                      {isSending ? <Loader2 className="animate-spin"/> : <Zap size={18}/>} ATIVAR ESCRITÓRIO E ENVIAR NO ZAP
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase text-center mt-2 italic">A senha temporária dele será "123". Ele terá 3 dias de teste grátis.</p>
                </div>
              </div>

              <div className="nexus-card p-8 border-slate-100 bg-white">
                 <h3 className="text-xs font-black uppercase text-slate-900 tracking-widest mb-6 flex items-center gap-2"><TrendingUp size={16} className="text-brand-orange"/> Crescimento da sua Rede</h3>
                 <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-brand-orange font-black">1º</div>
                          <p className="text-[10px] font-black uppercase text-slate-600">Diretos Ativos</p>
                       </div>
                       <p className="text-sm font-black text-slate-900">{paidL1} / {network.l1.length}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600 font-black">2º</div>
                          <p className="text-[10px] font-black uppercase text-slate-600">Indiretos Nível 2</p>
                       </div>
                       <p className="text-sm font-black text-slate-900">{paidL2} / {network.l2.length}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600 font-black">3º</div>
                          <p className="text-[10px] font-black uppercase text-slate-600">Indiretos Nível 3</p>
                       </div>
                       <p className="text-sm font-black text-slate-900">{paidL3} / {network.l3.length}</p>
                    </div>
                 </div>
              </div>
            </div>

            <aside className="space-y-6">
               <div className="nexus-card p-6 bg-slate-900 text-white border-slate-900">
                  <h4 className="text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2"><DollarSign size={14} className="text-brand-orange"/> Retirada de Ganhos</h4>
                  <ul className="space-y-4">
                    <li className="flex justify-between items-center border-b border-white/5 pb-2">
                       <span className="text-[9px] font-bold text-slate-400 uppercase">Saque Mínimo</span>
                       <span className="text-xs font-black">R$ 50,00</span>
                    </li>
                    <li className="flex justify-between items-center border-b border-white/5 pb-2">
                       <span className="text-[9px] font-bold text-slate-400 uppercase">Ciclo</span>
                       <span className="text-xs font-black">Mensal</span>
                    </li>
                  </ul>
                  <button disabled className="w-full mt-6 py-4 rounded-xl bg-brand-orange/50 text-white/50 font-black text-[10px] uppercase tracking-widest cursor-not-allowed">Solicitar Resgate</button>
                  <p className="text-[8px] text-slate-500 font-bold mt-2 text-center">Disponível assim que atingir R$ 50,00</p>
               </div>

               <div className="nexus-card p-6 border-emerald-100 bg-emerald-50/20">
                  <h4 className="text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 text-emerald-600"><CheckCircle size={14}/> Potencial Ilimitado</h4>
                  <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">
                    Cada escritório ativo na sua rede gera comissão todo mês. Não há limite de indicações!
                  </p>
               </div>
            </aside>
          </div>
        </div>
      )}

      {activeTab === 'PLAN' && (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
           <div className="nexus-card p-10 space-y-10 border-slate-100 bg-white shadow-2xl shadow-slate-200/50">
              <div className="text-center space-y-4 border-b border-slate-100 pb-10">
                 <div className="w-16 h-16 bg-orange-50 text-brand-orange rounded-2xl flex items-center justify-center mx-auto border border-brand-orange/10 shadow-inner">
                    <Trophy size={32}/>
                 </div>
                 <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Sua Renda Extra Mensal</h3>
                 <p className="text-xs text-slate-500 font-bold uppercase tracking-widest max-w-lg mx-auto leading-relaxed">Ganhe comissões recorrentes sobre a ativação mensal do "Escritório Digital" de seus indicados em até 3 níveis.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="p-8 bg-slate-900 rounded-[2rem] text-center border-t-4 border-brand-orange transform hover:-translate-y-1 transition-all">
                    <p className="text-[10px] font-black text-brand-orange uppercase tracking-widest mb-2">🥇 1ª Geração</p>
                    <p className="text-3xl font-black text-white italic">R$ 1,00</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-4 leading-relaxed">Por cada indicado direto ativo/mês</p>
                 </div>
                 <div className="p-8 bg-slate-900 rounded-[2rem] text-center border-t-4 border-slate-500 transform hover:-translate-y-1 transition-all">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">🥈 2ª Geração</p>
                    <p className="text-3xl font-black text-white italic">R$ 0,50</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-4 leading-relaxed">Por cada membro da rede nível 2 ativo/mês</p>
                 </div>
                 <div className="p-8 bg-slate-900 rounded-[2rem] text-center border-t-4 border-slate-700 transform hover:-translate-y-1 transition-all">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">🥉 3ª Geração</p>
                    <p className="text-3xl font-black text-white italic">R$ 0,25</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-4 leading-relaxed">Por cada membro da rede nível 3 ativo/mês</p>
                 </div>
              </div>

              <div className="bg-orange-50 p-8 rounded-3xl border border-orange-100 space-y-4">
                 <h4 className="text-xs font-black uppercase text-orange-900 tracking-widest flex items-center gap-2"><ShieldCheck size={18}/> Como funciona a Recorrência?</h4>
                 <p className="text-[11px] text-orange-800 font-bold leading-relaxed uppercase">
                    O ganho acontece toda vez que um indicado ou subindicado mantém sua assinatura do escritório ativa. Se você indicar 50 pessoas diretas, já garante R$ 50,00 fixos por mês de renda passiva!
                 </p>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'MARKETING' && (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="nexus-card p-8 space-y-6 border-slate-100 bg-white">
                 <h4 className="text-xs font-black uppercase text-slate-900 tracking-widest flex items-center gap-2"><FileText size={18} className="text-orange-500"/> Convite Pronto para WhatsApp</h4>
                 <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                    <p className="text-xs text-slate-600 leading-relaxed italic">
                      "Olá! Descobri uma ferramenta incrível para gerenciar orçamentos e vendas de forma profissional. O *Nexus* automatiza tudo e ainda me permite criar minha própria rede de indicados. Dá uma olhada: {referralLink}"
                    </p>
                    <button onClick={() => { navigator.clipboard.writeText(`Olá! Descobri uma ferramenta incrível para gerenciar orçamentos e vendas de forma profissional. O Nexus automatiza tudo e ainda me permite criar minha própria rede de indicados. Dá uma olhada: ${referralLink}`); alert('Texto copiado!'); }} className="absolute bottom-4 right-4 p-2 bg-slate-900 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"><Copy size={14}/></button>
                 </div>
                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estratégia de Sucesso</p>
                    <ul className="text-[10px] text-slate-500 font-semibold space-y-2">
                       <li className="flex items-center gap-2"><ChevronRight size={10} className="text-orange-500"/> Convide outros profissionais e empresas.</li>
                       <li className="flex items-center gap-2"><ChevronRight size={10} className="text-orange-500"/> Explique que eles também podem ganhar indicando.</li>
                       <li className="flex items-center gap-2"><ChevronRight size={10} className="text-orange-500"/> Foque na organização que o sistema traz.</li>
                    </ul>
                 </div>
              </div>

              <div className="nexus-card p-8 space-y-6 border-slate-100 bg-white flex flex-col justify-center items-center text-center">
                 <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center border border-orange-100 shadow-xl mb-4">
                    <Smartphone size={32}/>
                 </div>
                 <h4 className="text-xl font-black text-slate-900 uppercase italic">Digital Master</h4>
                 <p className="text-xs text-slate-500 font-bold leading-relaxed mb-6">Em breve liberaremos imagens e vídeos personalizados para seus Stories e Feed do Instagram!</p>
                 <button className="w-full py-4 rounded-xl bg-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-widest border border-slate-200 cursor-not-allowed">Material de Apoio (Breve)</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ReferralView;
