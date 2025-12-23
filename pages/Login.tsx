import React, { useState } from 'react';
import { User, OfficeUnit } from '../types';
import { Lock, ShieldCheck, RefreshCw } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  offices: OfficeUnit[];
}

const Login: React.FC<LoginProps> = ({ onLogin, offices }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));

    const emailLower = email.toLowerCase();

    // ===== SUPER ADMIN FIXO =====
    if (
      emailLower === 'giufarlosdias@hotmail.com' &&
      (password === '123' || password === '123456')
    ) {
      onLogin({
        id: 'MASTER',
        email: emailLower,
        name: 'SuperAdmin',
        role: 'SUPER_ADMIN',
        activated: true,
        balance: 0,
        referralCode: 'ROOT',
        referralCount: 0,
        monthlyFee: 0,
        officeName: 'NEXUS MASTER'
      });
      setLoading(false);
      return;
    }

    // ===== BUSCA REAL: props + localStorage =====
    const storedOffices: OfficeUnit[] = JSON.parse(
      localStorage.getItem('f_offices') || '[]'
    );

    const allOffices = [...offices, ...storedOffices];

    const office = allOffices.find(
      o => o.ownerEmail.toLowerCase() === emailLower
    );

    // ===== LOGIN PADRÃO MVP =====
    if (office && (password === '123' || password === '123456')) {
      if (!office.active) {
        setError('UNIDADE BLOQUEADA.');
        setLoading(false);
        return;
      }

      onLogin({
        id: office.id,
        email: emailLower,
        name: office.name,
        role: 'USER_ADMIN',
        officeName: office.name,
        activated: true,
        balance: 0,
        referralCode: 'REF-' + office.id,
        referralCount: 0,
        monthlyFee: 150,
        phone: office.phone
      });
    } else {
      setError('ACESSO NEGADO: CREDENCIAIS INVÁLIDAS.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-cyber-black cyber-grid">
      <div className="w-full max-w-sm glass p-10 rounded-3xl border border-cyber-neon/20 shadow-neon-cyan">
        <div className="text-center mb-10">
          <div className="inline-block p-4 rounded-2xl bg-cyber-neon/5 border border-cyber-neon/20 mb-6 shadow-neon-cyan">
            <Lock size={32} className="text-cyber-neon" />
          </div>
          <h1 className="text-3xl font-orbitron font-black text-white">
            FACINDEMAIS
          </h1>
          <p className="text-gray-500 text-[8px] font-orbitron tracking-widest uppercase mt-2 opacity-80">
            Terminal de Acesso Nexus
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white text-sm focus:border-cyber-neon outline-none"
            placeholder="Seu e-mail cadastrado"
          />

          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white text-sm focus:border-cyber-neon outline-none"
            placeholder="Senha (padrão 123)"
          />

          {error && (
            <p className="text-red-500 text-[10px] font-bold text-center uppercase animate-pulse">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyber-neon text-black font-black py-5 rounded-xl font-orbitron uppercase text-[10px] tracking-widest shadow-neon-cyan flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {loading ? <RefreshCw className="animate-spin" /> : <ShieldCheck size={18} />}
            {loading ? 'AUTENTICANDO...' : 'INICIAR PROTOCOLO'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
