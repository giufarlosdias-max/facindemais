
import React, { useState } from 'react';
import { User } from '../types';
import { Save, Camera, CreditCard, Lock, MapPin, Smartphone, CheckCircle2, RefreshCw } from 'lucide-react';

interface SettingsProps {
  user: User;
  onUpdate: (data: Partial<User>) => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    officeName: user.officeName || '',
    phone: user.phone || '',
    address: user.address || '',
    pixKey: user.pixKey || '',
    avatar: user.avatar || '',
    currentPassword: '',
    newPassword: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1000)); // Simulation
    onUpdate(formData);
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-orbitron font-black text-white tracking-widest uppercase">CONFIGURAÇÕES DO <span className="text-cyber-neon">ESCRITÓRIO</span></h2>
        <p className="text-gray-500 text-sm mt-2 uppercase tracking-widest opacity-80">Personalize seu mundo operacional exclusivo.</p>
      </header>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Profile Card */}
        <div className="glass p-10 rounded-3xl border border-white/5 relative overflow-hidden group shadow-neon-cyan bg-black/40">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-cyber-neon"><Camera size={120}/></div>
          <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
            <div className="relative group/avatar">
              <img 
                src={formData.avatar || 'https://via.placeholder.com/150'} 
                className="w-32 h-32 rounded-3xl border-2 border-cyber-neon/60 object-cover" 
                alt="Avatar"
              />
              <button type="button" className="absolute inset-0 bg-black/80 rounded-3xl opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-cyber-neon">
                <Camera size={32} />
              </button>
            </div>
            <div className="flex-1 space-y-6 w-full text-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-orbitron text-gray-500 uppercase tracking-widest ml-1">Identidade do Gestor</label>
                  <input 
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-4 text-white focus:border-cyber-neon outline-none"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-orbitron text-gray-500 uppercase tracking-widest ml-1">Nome da Unidade Nexus</label>
                  <input 
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-4 text-white focus:border-cyber-neon outline-none"
                    value={formData.officeName}
                    onChange={e => setFormData({...formData, officeName: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass p-8 rounded-3xl border border-white/5 space-y-6">
            <h3 className="text-sm font-orbitron font-black text-white flex items-center gap-3 tracking-widest">
              <CreditCard size={18} className="text-cyber-neon"/> FINANCEIRO & CONTATO
            </h3>
            <div className="space-y-4">
              <div className="relative">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  placeholder="WhatsApp Contato"
                  className="w-full bg-black/60 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white focus:border-cyber-neon outline-none text-sm"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  placeholder="Endereço Operacional"
                  className="w-full bg-black/60 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white focus:border-cyber-neon outline-none text-sm"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="glass p-8 rounded-3xl border border-white/5 space-y-6">
            <h3 className="text-sm font-orbitron font-black text-white flex items-center gap-3 tracking-widest">
              <Lock size={18} className="text-cyber-pink"/> SEGURANÇA DE ACESSO
            </h3>
            <div className="space-y-4">
              <input 
                type="password"
                placeholder="Senha Atual"
                className="w-full bg-black/60 border border-white/10 rounded-xl p-4 text-white focus:border-cyber-pink outline-none text-sm"
                value={formData.currentPassword}
                onChange={e => setFormData({...formData, currentPassword: e.target.value})}
              />
              <input 
                type="password"
                placeholder="Nova Senha"
                className="w-full bg-black/60 border border-white/10 rounded-xl p-4 text-white focus:border-cyber-pink outline-none text-sm"
                value={formData.newPassword}
                onChange={e => setFormData({...formData, newPassword: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-6 items-center">
          {saved && (
            <span className="text-green-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 size={16} /> CONFIGURAÇÕES SINCRONIZADAS
            </span>
          )}
          <button 
            type="submit"
            disabled={isSaving}
            className="bg-cyber-neon text-black px-10 py-5 rounded-2xl font-black font-orbitron tracking-widest uppercase shadow-neon-cyan hover:scale-105 transition-all flex items-center gap-3"
          >
            {isSaving ? <RefreshCw className="animate-spin"/> : <Save size={20}/>}
            Salvar Alterações
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
