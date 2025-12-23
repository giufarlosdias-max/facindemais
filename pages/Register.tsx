import React, { useState, useEffect } from 'react';
import { OfficeUnit } from '../types';
import { ShieldCheck, User, Mail, Smartphone, Lock, ArrowLeft, RefreshCw } from 'lucide-react';

interface RegisterProps {
  onRegister: (office: OfficeUnit) => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister }) => {
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));

    const newOffice: OfficeUnit = {
      id: 'NX-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      name: formData.name.toUpperCase(),
      ownerEmail: formData.email.toLowerCase(),
      referrerEmail: formData.ref || undefined,
      revenue: 0,
      active: true,
      status: 'NORMAL',
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      phone: formData.phone
    };

    // ===== CORREÇÃO CRÍTICA =====
    // CRIA O USUÁRIO PARA O LOGIN FUNCIONAR
    const users = JSON.parse(localStorage.getItem('facindemais_users') || '[]');

    users.push({
      id: 'U-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      name: formData.name.toUpperCase(),
      email: formData.email.toLowerCase(),
      password: formData.password,
      role: 'USER_ADMIN',
      officeId: newOffice.id,
      officeName: newOffice.name
    });

    localStorage.setItem('facindemais_users', JSON.stringify(users));
    // ===========================

    onRegister(newOffice);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-cyber-black cyber-grid">
      <div className="w-full max-w-lg glass p-10 rounded-3xl border border-cyber-neon/20 shadow-neon-cyan animate-in zoom-in">
        <button
          onClick={() => window.location.href = window.location.origin}
          className="flex items-center gap-2 text-[10px] text-gray-500 hover:text-white uppercase font-black mb-8 transition-colors"
        >
          <ArrowLeft size={14} /> Voltar ao Terminal
        </button>

        <div className="text-center mb-10">
          <div className="inline-block p-4 rounded-2xl bg-cyber-neon/5 border border-cyber-neon/20 mb-6 shadow-neon-cyan text-cyber-neon">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-orbitron font-black text-white">ATIVAR UNIDADE</h1>
          <p className="text-gray-500 text-[8px] font-orbitron tracking-widest uppercase mt-2 opacity-80">
            Inicialização de Protocolo Nexus OS
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[8px] text-gray-500 font-orbitron uppercase ml-1">
                Nome Fantasia
              </label>
              <input
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-cyber-neon outline-none"
                placeholder="Ex: Nexus Alpha"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[8px] text-gray-500 font-orbitron uppercase ml-1">
                E-mail do Gestor
              </label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-cyber-neon outline-none"
                placeholder="ex@nexus.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[8px] text-gray-500 font-orbitron uppercase ml-1">
              WhatsApp Operacional
            </label>
            <input
              required
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-cyber-neon outline-none"
              placeholder="11999999999"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[8px] text-gray-500 font-orbitron uppercase ml-1">
                Senha de Acesso
              </label>
              <input
                required
                type="password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-cyber-neon outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[8px] text-gray-500 font-orbitron uppercase ml-1">
                Confirmar Senha
              </label>
              <input
                required
                type="password"
                value={formData.confirmPassword}
                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-cyber-neon outline-none"
              />
            </div>
          </div>

          {formData.ref && (
            <div className="p-4 bg-cyber-neon/10 border border-cyber-neon/30 rounded-xl text-center">
              <p className="text-[8px] text-cyber-neon uppercase font-black tracking-widest">
                Indicado por: {formData.ref}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyber-neon text-black font-black py-5 rounded-xl font-orbitron uppercase text-[10px] tracking-widest shadow-neon-cyan hover:scale-105 transition-all flex items-center justify-center gap-3"
          >
            {loading && <RefreshCw className="animate-spin" />}
            {loading ? 'SINCRONIZANDO PROTOCOLO...' : 'ATIVAR AGORA'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
