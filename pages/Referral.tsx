
import React, { useState } from 'react';
import { User } from '../types';
import { Share2, Gift, Users, Mail, Phone, Lock } from 'lucide-react';

interface ReferralProps {
  user: User;
}

const Referral: React.FC<ReferralProps> = ({ user }) => {
  const [inviteData, setInviteData] = useState({ email: '', phone: '' });
  const inviteLink = `${window.location.origin}/register?ref=${user.referralCode}`;
  
  const handleShare = () => {
    if (!inviteData.email || !inviteData.phone) return alert('Preencha os dados do convidado.');
    
    const text = `🚀 *CONVITE PARA O ECOSSISTEMA FACINDEMAIS*\n\nOlá! Você foi convidado para gerenciar sua operação no *Nexus OS*.\n\n🔹 *Suas Credenciais Temporárias:*\n📧 *Email:* ${inviteData.email}\n🔑 *Senha:* 123456\n\n🔗 *Link de Acesso:* ${inviteLink}\n\n⚠️ _Recomendamos alterar sua senha após o primeiro acesso no terminal de configurações._`;
    
    const cleanPhone = inviteData.phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in pb-32">
      <div className="text-center">
        <div className="inline-block p-6 rounded-3xl bg-cyber-neon/10 border border-cyber-neon/30 mb-8 shadow-neon-cyan">
          <Gift size={48} className="text-cyber-neon" />
        </div>
        <h2 className="text-4xl font-black font-orbitron text-white uppercase tracking-widest">Indique e <span className="text-cyber-neon">Evolua</span></h2>
        <p className="text-gray-500 text-[10px] max-w-xl mx-auto mt-4 uppercase tracking-[0.4em] leading-relaxed opacity-70">Expanda a rede Roots e desbloqueie novos protocolos de bonificação.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass p-10 rounded-3xl border border-white/5 space-y-8 bg-black/40">
           <h3 className="text-xs font-orbitron font-black text-white uppercase tracking-widest flex items-center gap-3">
             <Mail size={16} className="text-cyber-neon"/> Protocolo de Convite
           </h3>
           <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[8px] font-orbitron text-gray-500 uppercase tracking-widest ml-1">Email do Alvo</label>
                <input placeholder="exemplo@nexus.com" value={inviteData.email} onChange={e => setInviteData({...inviteData, email: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-cyber-neon transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[8px] font-orbitron text-gray-500 uppercase tracking-widest ml-1">WhatsApp de Destino</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input placeholder="11999999999" value={inviteData.phone} onChange={e => setInviteData({...inviteData, phone: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white text-sm outline-none focus:border-cyber-neon transition-all" />
                </div>
              </div>
              
              <div className="bg-cyber-neon/5 border border-cyber-neon/20 p-4 rounded-xl">
                 <p className="text-[9px] text-cyber-neon font-mono uppercase tracking-widest leading-relaxed">
                   <Lock size={12} className="inline mr-2 mb-1"/> Senha temporária configurada como: <span className="font-bold underline">123456</span>
                 </p>
              </div>

              <button onClick={handleShare} className="w-full bg-[#25D366] hover:bg-[#1ebd5e] text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-lg transition-all active:scale-95">
                 <Share2 size={20}/> Transmitir Convite
              </button>
           </div>
        </div>

        <div className="glass p-10 rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center shadow-neon-cyan bg-black/60">
           <div className="p-6 rounded-full bg-white/5 mb-6">
             <Users size={50} className="text-cyber-neon opacity-40" />
           </div>
           <p className="text-[10px] font-orbitron text-gray-500 uppercase tracking-[0.3em] mb-2">Ecossistema Conectado</p>
           <p className="text-7xl font-black font-orbitron text-white">00</p>
           <div className="mt-8 px-6 py-2 bg-cyber-neon/10 border border-cyber-neon/30 rounded-full">
              <p className="text-[8px] text-cyber-neon font-black uppercase tracking-[0.2em]">Sincronização Ativa</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Referral;
