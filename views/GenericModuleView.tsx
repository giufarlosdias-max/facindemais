import React from 'react';
import { ArrowLeft, Activity, Info } from 'lucide-react';

interface GenericModuleViewProps {
  title: string;
  icon: React.ReactNode;
  onBack: () => void;
  description?: string;
}

const GenericModuleView: React.FC<GenericModuleViewProps> = ({ title, icon, onBack, description }) => {
  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <div className="flex items-center gap-6">
        <button 
          onClick={onBack}
          className="p-4 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-brand-cyan hover:border-brand-cyan/50 transition-all"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <div className="flex items-center gap-4">
             <div className="text-brand-cyan">{icon}</div>
             <h2 className="text-4xl font-black text-brand-blue italic tracking-tighter glow-brand-cyan leading-none uppercase">{title}</h2>
          </div>
          <p className="text-slate-500 font-bold text-sm tracking-widest uppercase mt-4">
            {description || "Módulo operacional em processamento de rede."}
          </p>
        </div>
      </div>

      <div className="nexus-card p-12 min-h-[400px] flex flex-col items-center justify-center border-dashed border-2 border-white/5">
        <Activity size={64} className="text-white/5 mb-8 animate-pulse" />
        <div className="text-center max-w-md">
          <h3 className="text-xl font-black text-brand-blue uppercase italic mb-4">Sincronizando Banco de Dados...</h3>
          <p className="text-slate-600 font-bold text-sm uppercase leading-relaxed">
            Este terminal está aguardando a entrada de dados específicos para gerar telemetria. Certifique-se de que os cadastros base foram realizados.
          </p>
        </div>
        
        <div className="mt-12 p-6 bg-brand-cyan/5 rounded-2xl border border-brand-cyan/10 flex items-center gap-4">
          <Info size={20} className="text-brand-cyan" />
          <span className="text-[10px] font-black text-brand-cyan uppercase tracking-widest">Protocolo NEXUS v2.0 - Módulo {title}</span>
        </div>
      </div>
    </div>
  );
};

export default GenericModuleView;