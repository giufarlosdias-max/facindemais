import React, { useState } from 'react';
import { updatePassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, dbService } from '../services/firebase';
// Fix: Added missing Zap icon import from lucide-react to resolve "Cannot find name 'Zap'" error
import { 
  Settings, Key, ShieldCheck, Loader2, Save, CheckCircle2, AlertTriangle, 
  Cpu, Building2, Smartphone, MapPin, CreditCard, Image as ImageIcon, 
  Upload, User, Lock, Bell, Globe, FileText, History, Trash2, 
  Eye, EyeOff, Briefcase, Plus, FileUp, ExternalLink, Zap
} from 'lucide-react';
import { UserProfile } from '../types';

interface SettingsViewProps { profile: UserProfile; }

type TabType = 'PERSONAL' | 'COMPANY' | 'SECURITY' | 'PREFERENCES' | 'DOCUMENTS' | 'HISTORY';

const SettingsView: React.FC<SettingsViewProps> = ({ profile }) => {
  const [activeTab, setActiveTab] = useState<TabType>('PERSONAL');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Form states
  const [personalData, setPersonalData] = useState({
    fullName: profile.fullName || '',
    username: profile.username || '',
    phone: profile.phone || '',
    whatsapp: profile.whatsapp || '',
    profilePicUrl: profile.profilePicUrl || ''
  });

  const [companyData, setCompanyData] = useState({
    officeName: profile.officeName || '',
    cnpj: profile.cnpj || '',
    address: profile.address || '',
    segment: profile.segment || 'Tecnologia',
    logoUrl: profile.logoUrl || ''
  });

  const [securityData, setSecurityData] = useState({
    newPassword: '',
    confirmPassword: '',
    showPass: false
  });

  const [prefData, setPrefData] = useState({
    language: profile.settings?.language || 'pt-BR',
    theme: profile.settings?.theme || 'light',
    notifEmail: profile.settings?.notifications?.email ?? true,
    notifWA: profile.settings?.notifications?.whatsapp ?? true,
    notifSys: profile.settings?.notifications?.system ?? true
  });

  // Sync state when profile prop updates (from real-time listener in App.tsx)
  React.useEffect(() => {
    setPersonalData({
      fullName: profile.fullName || '',
      username: profile.username || '',
      phone: profile.phone || '',
      whatsapp: profile.whatsapp || '',
      profilePicUrl: profile.profilePicUrl || ''
    });
    setCompanyData({
      officeName: profile.officeName || '',
      cnpj: profile.cnpj || '',
      address: profile.address || '',
      segment: profile.segment || 'Tecnologia',
      logoUrl: profile.logoUrl || ''
    });
    setPrefData({
      language: profile.settings?.language || 'pt-BR',
      theme: profile.settings?.theme || 'light',
      notifEmail: profile.settings?.notifications?.email ?? true,
      notifWA: profile.settings?.notifications?.whatsapp ?? true,
      notifSys: profile.settings?.notifications?.system ?? true
    });
  }, [profile]);

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handleUpdateProfile = async (data: any, silent: boolean = true) => {
    setIsSaving(true);
    try {
      // Log activity
      const logEntry = {
        id: `log-${Date.now()}`,
        action: 'Atualização de Perfil',
        timestamp: new Date(),
        details: 'Alteração de dados via SettingsView'
      };
      
      const logs = profile.activityLogs ? [logEntry, ...profile.activityLogs.slice(0, 19)] : [logEntry];

      const userName = profile.fullName || profile.officeName || profile.email;
      await dbService.updateProfile(profile.uid, { ...data, activityLogs: logs }, profile.uid, userName);
      if (!silent) showMsg('Perfil sincronizado com sucesso!', 'success');
    } catch (err) {
      showMsg('Erro ao salvar alterações.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (securityData.newPassword.length < 8) return showMsg('Mínimo 8 caracteres.', 'error');
    if (securityData.newPassword !== securityData.confirmPassword) return showMsg('Senhas não conferem!', 'error');
    
    setIsSaving(true);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, securityData.newPassword);
        showMsg('Senha alterada com sucesso!', 'success');
        setSecurityData({ ...securityData, newPassword: '', confirmPassword: '' });
      }
    } catch (err: any) {
      showMsg('Erro de autenticação. Tente relogar.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetRequest = async () => {
    if (!profile.email) return;
    try {
      await sendPasswordResetEmail(auth, profile.email);
      showMsg('Link de redefinição enviado para seu e-mail.', 'success');
    } catch (err) {
      showMsg('Erro ao enviar solicitação.', 'error');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'LOGO' | 'PROFILE' | 'DOC') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (target === 'LOGO') {
        setCompanyData({ ...companyData, logoUrl: base64 });
        handleUpdateProfile({ logoUrl: base64 });
      }
      if (target === 'PROFILE') {
        setPersonalData({ ...personalData, profilePicUrl: base64 });
        handleUpdateProfile({ profilePicUrl: base64 });
      }
      if (target === 'DOC') {
        const newDoc = {
          id: `doc-${Date.now()}`,
          name: file.name,
          type: file.type,
          url: base64,
          createdAt: new Date()
        };
        const docs = profile.documents ? [...profile.documents, newDoc] : [newDoc];
        const userName = profile.fullName || profile.officeName || profile.email;
        dbService.updateProfile(profile.uid, { documents: docs }, profile.uid, userName);
      }
    };
    reader.readAsDataURL(file);
  };

  const TabButton = ({ id, icon: Icon, label }: { id: TabType, icon: any, label: string }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-3 px-6 py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${activeTab === id ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
    >
      <Icon size={16} />
      <span className="hidden md:block">{label}</span>
    </button>
  );

  return (
    <div className="space-y-10 animate-fade pb-20">
      <header>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Escritório Virtual</p>
        <h2 className="text-3xl font-black text-brand-blue italic tracking-tighter uppercase">Perfil do Terminal</h2>
      </header>

      <nav className="flex flex-wrap gap-2 overflow-x-auto pb-2 custom-scrollbar">
        <TabButton id="PERSONAL" icon={User} label="Dados Pessoais" />
        <TabButton id="COMPANY" icon={Building2} label="Empresa" />
        <TabButton id="SECURITY" icon={ShieldCheck} label="Segurança" />
        <TabButton id="PREFERENCES" icon={Settings} label="Preferências" />
        <TabButton id="DOCUMENTS" icon={FileText} label="Documentos" />
        <TabButton id="HISTORY" icon={History} label="Atividades" />
      </nav>

      <main className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'PERSONAL' && (
            <div className="nexus-card p-8 space-y-8">
              <div className="flex flex-col md:flex-row items-center gap-8 border-b border-slate-100 pb-8">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-3xl bg-slate-100 overflow-hidden border-2 border-white shadow-inner flex items-center justify-center">
                    {personalData.profilePicUrl ? (
                      <img src={personalData.profilePicUrl} className="w-full h-full object-cover" />
                    ) : (
                      <User size={40} className="text-slate-300" />
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 p-2 bg-brand-blue text-white rounded-xl cursor-pointer shadow-lg hover:bg-brand-green transition-all">
                    <Upload size={14} />
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'PROFILE')} />
                  </label>
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-xl font-bold text-brand-blue">{profile.email}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{profile.role === 'super-admin' ? 'Acesso Master' : 'Operador Administrativo'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                  <input 
                    value={personalData.fullName} 
                    onChange={e=>setPersonalData({...personalData, fullName: e.target.value})} 
                    onBlur={() => handleUpdateProfile({ fullName: personalData.fullName })}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-brand-cyan outline-none transition-all" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome de Usuário (@)</label>
                  <input 
                    value={personalData.username} 
                    onChange={e=>setPersonalData({...personalData, username: e.target.value})} 
                    onBlur={() => handleUpdateProfile({ username: personalData.username })}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-brand-cyan outline-none transition-all" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">WhatsApp</label>
                  <input 
                    value={personalData.whatsapp} 
                    onChange={e=>setPersonalData({...personalData, whatsapp: e.target.value})} 
                    onBlur={() => handleUpdateProfile({ whatsapp: personalData.whatsapp })}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-brand-cyan outline-none transition-all" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail (Leitura)</label>
                  <input readOnly value={profile.email} className="w-full p-4 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-400 cursor-not-allowed" />
                </div>
              </div>

              <button disabled={isSaving} onClick={() => handleUpdateProfile(personalData, false)} className="btn-primary px-8 py-4 rounded-xl font-bold text-xs flex items-center gap-3">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} ATUALIZAR DADOS PESSOAIS
              </button>
            </div>
          )}

          {activeTab === 'COMPANY' && (
            <div className="nexus-card p-8 space-y-8">
              <div className="flex flex-col md:flex-row items-center gap-8 border-b border-slate-100 pb-8">
                <div className="w-32 h-20 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
                  {companyData.logoUrl ? (
                    <img src={companyData.logoUrl} className="max-h-full max-w-full object-contain" />
                  ) : (
                    <Building2 size={32} className="text-slate-200" />
                  )}
                </div>
                <label className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest cursor-pointer hover:bg-slate-800">
                  Alterar Logotipo
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'LOGO')} />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Razão Social / Nome Fantasia</label>
                  <input 
                    value={companyData.officeName} 
                    onChange={e=>setCompanyData({...companyData, officeName: e.target.value})} 
                    onBlur={() => handleUpdateProfile({ officeName: companyData.officeName })}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold uppercase" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">CNPJ</label>
                  <input 
                    value={companyData.cnpj} 
                    onChange={e=>setCompanyData({...companyData, cnpj: e.target.value})} 
                    onBlur={() => handleUpdateProfile({ cnpj: companyData.cnpj })}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" 
                    placeholder="00.000.000/0000-00" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Segmento</label>
                  <input 
                    value={companyData.segment} 
                    onChange={e=>setCompanyData({...companyData, segment: e.target.value})} 
                    onBlur={() => handleUpdateProfile({ segment: companyData.segment })}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold uppercase" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Endereço Fiscal</label>
                  <input 
                    value={companyData.address} 
                    onChange={e=>setCompanyData({...companyData, address: e.target.value})} 
                    onBlur={() => handleUpdateProfile({ address: companyData.address })}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold uppercase" 
                  />
                </div>
              </div>

              <button disabled={isSaving} onClick={() => handleUpdateProfile(companyData, false)} className="btn-primary px-8 py-4 rounded-xl font-bold text-xs flex items-center gap-3">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} ATUALIZAR EMPRESA
              </button>
            </div>
          )}

          {activeTab === 'SECURITY' && (
            <div className="nexus-card p-8 space-y-10">
              <form onSubmit={handleChangePassword} className="space-y-6 max-w-md">
                <h4 className="text-xs font-black text-brand-blue uppercase tracking-widest flex items-center gap-2"><Lock size={14}/> Alterar Senha</h4>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Nova Senha (Mín. 8 caracteres)</label>
                  <div className="relative">
                    <input 
                      type={securityData.showPass ? 'text' : 'password'}
                      value={securityData.newPassword} 
                      onChange={e=>setSecurityData({...securityData, newPassword: e.target.value})}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold pr-12" 
                    />
                    <button type="button" onClick={()=>setSecurityData({...securityData, showPass: !securityData.showPass})} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                      {securityData.showPass ? <EyeOff size={18}/> : <Eye size={18}/>}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Confirmar Nova Senha</label>
                  <input 
                    type={securityData.showPass ? 'text' : 'password'} 
                    value={securityData.confirmPassword} 
                    onChange={e=>setSecurityData({...securityData, confirmPassword: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" 
                  />
                </div>
                <button type="submit" disabled={isSaving} className="btn-primary px-8 py-4 rounded-xl font-bold text-xs flex items-center gap-3">
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />} DEFINIR NOVA SENHA
                </button>
              </form>

              <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <h4 className="text-xs font-black text-brand-blue uppercase tracking-widest">Recuperação de Conta</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Enviar link de reset para seu e-mail operacional.</p>
                </div>
                <button onClick={handleResetRequest} className="bg-slate-900 text-white px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800">Enviar E-mail Reset</button>
              </div>

              <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <h4 className="text-xs font-black text-brand-blue uppercase tracking-widest">2FA (Confirmação em 2 etapas)</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Exigir código adicional via e-mail.</p>
                </div>
                <div className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-all ${profile.settings?.security2FA ? 'bg-brand-blue' : 'bg-slate-200'}`} onClick={() => handleUpdateProfile({ settings: { ...prefData, security2FA: !profile.settings?.security2FA } })}>
                   <div className={`w-6 h-6 bg-white rounded-lg transition-all ${profile.settings?.security2FA ? 'ml-6' : 'ml-0'}`} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'PREFERENCES' && (
            <div className="nexus-card p-8 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-brand-blue uppercase tracking-widest flex items-center gap-2"><Globe size={14}/> Idioma & Localização</h4>
                  <select 
                    value={prefData.language} 
                    onChange={e=>{
                      const val = e.target.value;
                      setPrefData({...prefData, language: val as any});
                      handleUpdateProfile({ settings: { ...prefData, language: val } });
                    }} 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-brand-cyan outline-none transition-all"
                  >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en">English (US)</option>
                    <option value="es">Español</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black text-brand-blue uppercase tracking-widest flex items-center gap-2"><Zap size={14}/> Tema Visual</h4>
                  <div className="flex gap-2">
                    <button 
                      onClick={()=>{
                        setPrefData({...prefData, theme: 'light'});
                        handleUpdateProfile({ settings: { ...prefData, theme: 'light' } });
                      }} 
                      className={`flex-1 p-4 rounded-xl border font-bold text-xs uppercase ${prefData.theme === 'light' ? 'bg-brand-blue text-white border-brand-blue' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
                    >
                      Claro
                    </button>
                    <button 
                      onClick={()=>{
                        setPrefData({...prefData, theme: 'dark'});
                        handleUpdateProfile({ settings: { ...prefData, theme: 'dark' } });
                      }} 
                      className={`flex-1 p-4 rounded-xl border font-bold text-xs uppercase ${prefData.theme === 'dark' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
                    >
                      Escuro
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100 space-y-6">
                <h4 className="text-xs font-black text-brand-blue uppercase tracking-widest flex items-center gap-2"><Bell size={14}/> Central de Notificações</h4>
                <div className="space-y-4">
                  {[
                    { key: 'notifEmail', label: 'Alertas por E-mail' },
                    { key: 'notifWA', label: 'Relatórios por WhatsApp' },
                    { key: 'notifSys', label: 'Push no Terminal' }
                  ].map(n => (
                    <div key={n.key} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">{n.label}</span>
                      <div 
                        onClick={() => {
                          const newVal = !((prefData as any)[n.key]);
                          setPrefData({...prefData, [n.key]: newVal});
                          handleUpdateProfile({ settings: { ...prefData, [n.key]: newVal } });
                        }}
                        className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all ${((prefData as any)[n.key]) ? 'bg-brand-green' : 'bg-slate-300'}`}
                      >
                         <div className={`w-4 h-4 bg-white rounded-full transition-all ${((prefData as any)[n.key]) ? 'ml-6' : 'ml-0'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button disabled={isSaving} onClick={() => handleUpdateProfile({ settings: prefData }, false)} className="btn-primary px-8 py-4 rounded-xl font-bold text-xs flex items-center gap-3">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} SALVAR PREFERÊNCIAS
              </button>
            </div>
          )}

          {activeTab === 'DOCUMENTS' && (
            <div className="nexus-card p-8 space-y-8">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black text-brand-blue uppercase tracking-widest flex items-center gap-2"><FileText size={14}/> Gestão de Documentos</h4>
                <label className="bg-slate-900 text-white px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-slate-800 flex items-center gap-2">
                  <FileUp size={14}/> Upload Arquivo
                  <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'DOC')} />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(profile.documents || []).map(doc => (
                  <div key={doc.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-white border border-slate-100 rounded-lg text-brand-blue"><FileText size={20}/></div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 truncate w-32 md:w-48">{doc.name}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{doc.type.split('/')[1] || 'DOC'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a href={doc.url} download={doc.name} className="p-2 text-slate-300 hover:text-brand-blue transition-all"><ExternalLink size={16}/></a>
                      <button onClick={() => {
                        const docs = profile.documents?.filter(d => d.id !== doc.id);
                        const userName = profile.fullName || profile.officeName || profile.email;
                        dbService.updateProfile(profile.uid, { documents: docs }, profile.uid, userName);
                      }} className="p-2 text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
                {(profile.documents || []).length === 0 && (
                  <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Nenhum contrato ou relatório arquivado.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'HISTORY' && (
            <div className="nexus-card p-8 space-y-6">
              <h4 className="text-xs font-black text-brand-blue uppercase tracking-widest flex items-center gap-2"><History size={14}/> Logs de Atividade</h4>
              <div className="space-y-3">
                {(profile.activityLogs || []).map(log => (
                  <div key={log.id} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-xl">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{log.action}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{log.details || 'Sem detalhes'}</p>
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">{log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString('pt-BR') : new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                ))}
                {(profile.activityLogs || []).length === 0 && <p className="text-center py-10 text-[10px] font-bold text-slate-300 uppercase tracking-widest">Nenhuma atividade registrada.</p>}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="nexus-card p-6 border-brand-blue/10 bg-brand-blue/5">
            <h5 className="text-[10px] font-black text-brand-blue uppercase tracking-widest mb-4 flex items-center gap-2"><ShieldCheck size={14}/> Status de Acesso</h5>
            <div className="space-y-3">
               <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase"><span>Status</span><span className="text-brand-green">OPERACIONAL</span></div>
               <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase"><span>Assinatura</span><span className="text-slate-900">{profile.subscriptionStatus}</span></div>
               <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase"><span>Expira</span><span className="text-slate-900">{profile.subscriptionExpiresAt?.toDate().toLocaleDateString('pt-BR')}</span></div>
            </div>
          </div>

          <div className="nexus-card p-6 border-slate-900 bg-slate-900 text-white">
             <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Cpu size={14}/> Terminal Core</h5>
             <p className="text-[9px] text-slate-500 leading-relaxed font-bold uppercase tracking-wider mb-4">Sincronização Cloud com Profissional OS v3.1 ativa em tempo real.</p>
             <button onClick={() => auth.signOut()} className="w-full py-4 rounded-xl border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all">Sair do Terminal</button>
          </div>

          {message.text && (
            <div className={`p-4 rounded-xl text-[9px] font-black uppercase text-center border animate-fade ${message.type === 'error' ? 'bg-red-50 text-red-500 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
              {message.text}
            </div>
          )}
        </aside>
      </main>
    </div>
  );
};

export default SettingsView;