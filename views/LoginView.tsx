import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, dbService } from '../services/firebase';
import { Zap, Loader2, KeyRound, Mail, MessageCircle } from 'lucide-react';

const LoginView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [refCode, setRefCode] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('ref');
    if (code) setRefCode(code.toUpperCase());
  }, []);

  const handleResetPassword = async () => {
    if (!email) return setMessage({ text: 'Digite seu e-mail operacional.', type: 'error' });
    try {
      await dbService.resetPassword(email);
      setMessage({ text: 'Link de recuperação enviado.', type: 'success' });
    } catch (err) {
      setMessage({ text: 'Erro ao enviar link.', type: 'error' });
    }
  };

  const openWhatsAppSupport = () => {
    const msg = encodeURIComponent("Olá! Preciso de suporte em meu terminal.");
    window.open(`https://wa.me/5511910688022?text=${msg}`, '_blank');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, pass);
          await dbService.initProfile(cred.user.uid, email, refCode);
        } catch (regErr: any) {
          setMessage({ text: 'Falha ao inicializar terminal.', type: 'error' });
        }
      } else {
        setMessage({ text: 'Erro de autenticação.', type: 'error' });
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-white p-6 relative">
      <div className="w-full max-w-sm p-8 animate-fade">
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-brand-blue rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Zap size={24} className="text-white fill-current" />
          </div>
          <h1 className="font-bold text-2xl text-brand-blue tracking-tight uppercase">Profissional OS</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2">Gestão de Negócios v3.1</p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">E-mail Operacional</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-4 text-brand-blue font-semibold outline-none focus:border-brand-cyan focus:bg-white transition-all text-sm" placeholder="exemplo@gmail.com" />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Senha de Acesso</label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input required type="password" value={pass} onChange={e => setPass(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-4 text-brand-blue font-semibold outline-none focus:border-brand-cyan focus:bg-white transition-all text-sm" placeholder="••••••••" />
            </div>
          </div>

          <div className="flex justify-between items-center px-1 text-[10px] font-bold uppercase tracking-widest">
            <button type="button" onClick={handleResetPassword} className="text-slate-400 hover:text-brand-green transition-colors">Esqueci senha</button>
            <button type="button" onClick={openWhatsAppSupport} className="text-slate-400 hover:text-brand-green">Suporte</button>
          </div>

          <button disabled={loading} className="btn-primary w-full py-5 rounded-xl flex items-center justify-center gap-3 mt-4 text-sm shadow-sm">
            {loading ? <Loader2 className="animate-spin" size={18}/> : <span className="uppercase tracking-widest">Acessar Terminal</span>}
          </button>
        </form>

        {message.text && (
            <div className={`mt-6 p-4 rounded-xl text-[10px] font-bold uppercase text-center border ${message.type === 'error' ? 'bg-red-50 text-red-500 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                {message.text}
            </div>
        )}
      </div>
    </div>
  );
};

export default LoginView;