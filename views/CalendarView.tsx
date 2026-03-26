import React, { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, Bell, Trash2, Zap, MessageCircle, X, MapPin, User, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { dbService } from '../services/firebase';
import { UserProfile, CalendarEvent } from '../types';

interface CalendarViewProps {
  profile: UserProfile;
  userId: string;
}

const CalendarView: React.FC<CalendarViewProps> = ({ profile, userId }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [reportActive, setReportActive] = useState(true);
  const [filter, setFilter] = useState<'DIA' | 'SEMANA' | 'MÊS'>('DIA');

  const initialForm = {
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    location: '',
    contactName: '',
    contactPhone: '',
    priority: 'MÉDIA' as any,
    status: 'PENDENTE' as any
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    return dbService.sync('calendar_events', userId, (data) => {
      setEvents(data as CalendarEvent[]);
    });
  }, [userId]);

  useEffect(() => {
    if (!reportActive) return;

    const checkReport = async () => {
      const now = new Date();
      const todayKey = now.toLocaleDateString('pt-BR');
      
      // Verifica se já foi enviado hoje via Perfil
      if (profile.lastReportDate === todayKey) return;

      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      
      // Protocolo Matinal Nexus: 06:30 AM
      if (currentHour === 6 && currentMin >= 30) {
        const todayEvents = events.filter(e => {
          const eDate = new Date(e.date + 'T00:00:00').toLocaleDateString('pt-BR');
          return eDate === todayKey;
        });

        if (todayEvents.length > 0) {
          await triggerAutomaticReport(todayEvents);
          const userName = profile.fullName || profile.officeName || profile.email;
          await dbService.update('users', userId, { lastReportDate: todayKey }, userId, userName);
        }
      }
    };

    const interval = setInterval(checkReport, 60000);
    checkReport();
    return () => clearInterval(interval);
  }, [reportActive, events, userId, profile.lastReportDate]);

  const triggerAutomaticReport = async (todayEvents: CalendarEvent[]) => {
    let msg = `*Bom dia!* ☀️\n`;
    msg += `Seus compromissos de hoje (*${new Date().toLocaleDateString('pt-BR')}*) são:\n\n`;
    
    todayEvents
      .sort((a, b) => a.time.localeCompare(b.time))
      .forEach((e, idx) => {
        msg += `${idx + 1}️⃣ *${e.time}* – ${e.title.toUpperCase()} – ${e.contactName || 'Sem Contato'}\n`;
        if (e.location) msg += `📍 Local: ${e.location}\n`;
        msg += `\n`;
      });
    
    msg += `_Relatório gerado automaticamente às 06:30 via Nexus OS_`;

    const phone = profile.phone?.replace(/\D/g, '');
    if (phone) {
      window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const userName = profile.fullName || profile.officeName || profile.email;
    try {
      await dbService.add('calendar_events', userId, formData, userName);
      setIsModalOpen(false);
      setFormData(initialForm);
    } catch (err) { alert("Erro ao agendar."); } finally { setIsSaving(false); }
  };

  const filteredEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 7);

    const monthEnd = new Date(today);
    monthEnd.setMonth(today.getMonth() + 1);

    return events.filter(e => {
      const eDate = new Date(e.date + 'T00:00:00');
      if (filter === 'DIA') return eDate.toLocaleDateString() === today.toLocaleDateString();
      if (filter === 'SEMANA') return eDate >= today && eDate <= weekEnd;
      if (filter === 'MÊS') return eDate >= today && eDate <= monthEnd;
      return true;
    }).sort((a, b) => {
      const dateDiff = a.date.localeCompare(b.date);
      return dateDiff !== 0 ? dateDiff : a.time.localeCompare(b.time);
    });
  }, [events, filter]);

  return (
    <div className="space-y-12 animate-fade-in pb-20 px-2 lg:px-0">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Produtividade & Fluxo</p>
          <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase">Agenda Digital</h2>
        </div>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          {(['DIA', 'SEMANA', 'MÊS'] as const).map(f => (
            <button 
              key={f} 
              onClick={() => setFilter(f)} 
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-white text-brand-orange shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="space-y-6">
           <button onClick={() => setIsModalOpen(true)} className="w-full btn-brand-orange py-5 rounded-2xl font-black text-xs flex items-center justify-center gap-3 shadow-xl shadow-brand-orange/20">
             <Plus size={20}/> NOVO COMPROMISSO
           </button>

           <div className="nexus-card p-6 border-slate-200 bg-slate-50/50">
              <div className="flex justify-between items-center mb-6">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Zap size={14}/> Automação Matinal</h4>
                 <div onClick={() => setReportActive(!reportActive)} className={`w-10 h-5 rounded-full p-1 cursor-pointer transition-all ${reportActive ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                    <div className={`w-3 h-3 bg-white rounded-full transition-all ${reportActive ? 'ml-5' : 'ml-0'}`} />
                 </div>
              </div>
              <p className="text-[9px] text-slate-500 font-bold leading-relaxed uppercase">Envio automático do resumo via WhatsApp às 06:30 para o terminal cadastrado.</p>
              {profile.lastReportDate === new Date().toLocaleDateString('pt-BR') && (
                <div className="mt-4 flex items-center gap-2 text-emerald-500 font-black text-[9px] uppercase">
                   <CheckCircle2 size={12}/> Relatório Hoje Enviado
                </div>
              )}
           </div>

           <div className="nexus-card p-6 border-slate-200">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Legenda de Prioridade</h4>
              <div className="space-y-3">
                 <div className="flex items-center gap-2 text-[9px] font-bold uppercase"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Alta Prioridade</div>
                 <div className="flex items-center gap-2 text-[9px] font-bold uppercase"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Média Prioridade</div>
                 <div className="flex items-center gap-2 text-[9px] font-bold uppercase"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Baixa Prioridade</div>
              </div>
           </div>
        </aside>

        <main className="lg:col-span-3 space-y-4">
           {filteredEvents.map(event => (
             <div key={event.id} className="nexus-card p-6 border-slate-100 flex flex-col md:flex-row items-center gap-6 group hover:border-brand-orange/20 transition-all">
                <div className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-white border border-slate-100 shadow-sm shrink-0">
                   <span className="text-[9px] font-black text-slate-400 uppercase">{new Date(event.date + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' })}</span>
                   <span className="text-3xl font-black text-brand-blue">{event.date.split('-')[2]}</span>
                </div>
                
                <div className="flex-1 space-y-2 text-center md:text-left">
                   <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <h4 className="text-xl font-bold text-brand-blue uppercase tracking-tight">{event.title}</h4>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${event.priority === 'ALTA' ? 'bg-rose-100 text-rose-600' : event.priority === 'MÉDIA' ? 'bg-brand-orange/10 text-brand-orange' : 'bg-brand-green/10 text-brand-green'}`}>
                         {event.priority}
                      </span>
                   </div>
                   <div className="flex flex-wrap justify-center md:justify-start gap-4">
                      <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5"><Clock size={12} className="text-brand-orange"/> {event.time}</p>
                      {event.location && <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5"><MapPin size={12} className="text-brand-orange"/> {event.location}</p>}
                      {event.contactName && <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5"><User size={12} className="text-brand-orange"/> {event.contactName}</p>}
                   </div>
                   <p className="text-[10px] text-slate-400 font-medium italic">{event.description}</p>
                </div>

                <div className="flex gap-2">
                   <button 
                     onClick={() => {
                        const userName = profile.fullName || profile.officeName || profile.email;
                        dbService.update('calendar_events', event.id, { status: event.status === 'CONCLUÍDO' ? 'PENDENTE' : 'CONCLUÍDO' }, userId, userName);
                      }}
                     className={`p-3 rounded-xl transition-all ${event.status === 'CONCLUÍDO' ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20' : 'bg-slate-50 text-slate-300 hover:text-brand-green'}`}
                   >
                     <CheckCircle2 size={20}/>
                   </button>
                   <button 
                     onClick={() => { if(confirm('Excluir este compromisso?')) dbService.del('calendar_events', event.id); }}
                     className="p-3 bg-slate-50 text-slate-300 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all"
                   >
                     <Trash2 size={20}/>
                   </button>
                </div>
             </div>
           ))}

           {filteredEvents.length === 0 && (
             <div className="py-24 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center">
                <CalendarIcon size={48} className="text-slate-100 mb-4" />
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhum compromisso para este período.</p>
             </div>
           )}
        </main>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="nexus-card w-full max-w-2xl p-8 border-brand-orange/40 my-auto animate-fade-in">
             <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
                <h3 className="text-2xl font-black text-brand-blue uppercase italic tracking-tighter flex items-center gap-3"><CalendarIcon className="text-brand-orange"/> Novo Agendamento</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-300 hover:text-rose-500"><X size={24}/></button>
             </div>

             <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Título do Compromisso</label>
                  <input required value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold uppercase" placeholder="EX: REUNIÃO DE ALINHAMENTO" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Data</label>
                    <input type="date" required value={formData.date} onChange={e=>setFormData({...formData, date: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Horário</label>
                    <input type="time" required value={formData.time} onChange={e=>setFormData({...formData, time: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Local / Link</label>
                      <input value={formData.location} onChange={e=>setFormData({...formData, location: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold uppercase" placeholder="EX: ESCRITÓRIO CENTRAL" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Prioridade</label>
                      <select value={formData.priority} onChange={e=>setFormData({...formData, priority: e.target.value as any})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold uppercase">
                         <option value="BAIXA">BAIXA</option>
                         <option value="MÉDIA">MÉDIA</option>
                         <option value="ALTA">ALTA</option>
                      </select>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome do Contato</label>
                      <input value={formData.contactName} onChange={e=>setFormData({...formData, contactName: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold uppercase" placeholder="NOME DO CLIENTE" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">WhatsApp Contato</label>
                      <input value={formData.contactPhone} onChange={e=>setFormData({...formData, contactPhone: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" placeholder="11999999999" />
                   </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Descrição / Notas</label>
                  <textarea value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium h-24 resize-none" placeholder="Detalhes importantes do compromisso..." />
                </div>

                <button disabled={isSaving} type="submit" className="w-full btn-brand-orange py-6 rounded-2xl font-black text-sm flex items-center justify-center gap-3">
                   {isSaving ? <Loader2 className="animate-spin"/> : <Zap size={20}/>} CONFIRMAR AGENDAMENTO
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;