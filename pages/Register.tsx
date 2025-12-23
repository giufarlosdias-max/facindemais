
import React, { useState, useEffect } from 'react';
import { OfficeUnit } from '../types';
import { ShieldCheck, User, Mail, Smartphone, Lock, ArrowLeft } from 'lucide-react';

interface RegisterProps {
  onRegister: (office: OfficeUnit) => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    ref: ''
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setFormData(prev => ({ ...prev, ref: params.get('ref') || '' }));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return alert("As senhas não coincidem.");
    
    const newOffice: OfficeUnit = {
      id: 'NX-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      name: formData.name,
      ownerEmail: formData.email.toLowerCase(),
      referrerEmail: formData.ref || undefined,
      revenue: 0,
      active: true,
      status: 'NORMAL',
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      phone: formData.phone
    };

    onRegister(newOffice);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-cyber-black cyber-grid">
      <div className="w-full max-w-lg glass p-10 rounded-3xl border border-cyber-neon/20 shadow-neon-cyan animate-in zoom-in duration-500">
        <button onClick={() => window.location.href = '/'} className="flex items-center gap-2 text-[10px] text-gray-500 hover:text-white uppercase font-black mb-8 transition-colors">
          <ArrowLeft size={14}/> Voltar para Login
        </button>
        
        <div className="text-center mb-10">
          <div className="inline-block p-4 rounded-2xl bg-cyber-neon/5 border border-cyber-neon/20 mb-6 shadow-neon-cyan text-cyber-neon">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-orbitron font-black text-white">CRIAR UNIDADE</h1>
          <p className="text-gray-500 text-[8px] font-orbitron tracking-widest uppercase mt-2 opacity-80">Inicialização de Novo Protocolo Nexus OS</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[8px] text-gray-500 font-orbitron uppercase ml-1">Nome do Escritório</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white text-sm focus:border-cyber-neon outline-none" placeholder="Ex: Nexus Alpha" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[8px] text-gray-500 font-orbitron uppercase ml-1">Email Gestor</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white text-sm focus:border-cyber-neon outline-none" placeholder="ex@nexus.com" />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[8px] text-gray-500 font-orbitron uppercase ml-1">WhatsApp (Para relatórios)</label>
            <div className="relative">
              <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white text-sm focus:border-cyber-neon outline-none" placeholder="11999999999" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[8px] text-gray-500 font-orbitron uppercase ml-1">Senha de Acesso</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white text-sm focus:border-cyber-neon outline-none" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[8px] text-gray-500 font-orbitron uppercase ml-1">Confirmar Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input required type="password" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white text-sm focus:border-cyber-neon outline-none" />
              </div>
            </div>
          </div>

          {formData.ref && (
            <div className="p-4 bg-cyber-neon/10 border border-cyber-neon/30 rounded-xl">
              <p className="text-[8px] text-cyber-neon uppercase font-black tracking-widest">Indicado pelo código: {formData.ref}</p>
            </div>
          )}

          <button type="submit" className="w-full bg-cyber-neon text-black font-black py-5 rounded-xl font-orbitron uppercase text-[10px] tracking-widest shadow-neon-cyan hover:scale-105 transition-all">
            FINALIZAR CADASTRO E ATIVAR UNIDADE
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
