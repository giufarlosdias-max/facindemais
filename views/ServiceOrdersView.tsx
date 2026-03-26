import React, { useState, useEffect } from 'react';
import { dbService } from '../services/firebase';
import { Customer, ServiceOrder, UserProfile } from '../types';
import { Plus, Search, Trash2, Wrench, Clock, CheckCircle, X, Loader2, User, Printer, FileText, ChevronDown, ChevronUp, MessageCircle, CreditCard, Zap, Smartphone, Download } from 'lucide-react';

interface ServiceOrdersViewProps {
  userId: string;
  customers: Customer[];
  profile: UserProfile;
}

const ServiceOrdersView: React.FC<ServiceOrdersViewProps> = ({ userId, customers, profile }) => {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  
  const [formData, setFormData] = useState({
    customerId: '',
    manualCustomerName: '',
    manualCustomerPhone: '',
    manualCustomerCpf: '',
    equipment: '',
    equipmentBrand: '',
    equipmentModel: '',
    equipmentSerial: '',
    description: '',
    informedDefect: '',
    technicalDiagnosis: '',
    executedService: '',
    partsUsed: '',
    cost: '',
    paymentMethod: 'PIX',
    installments: '1',
    deliveryDeadline: '',
    warranty: '90 dias',
    notes: '',
    status: 'OPEN' as any
  });

  useEffect(() => {
    return dbService.sync('service_orders', userId, (data) => setOrders(data as ServiceOrder[]));
  }, [userId]);

  const sendWhatsAppOS = (order: ServiceOrder) => {
    const customerPhone = (order.customerPhone || '').replace(/\D/g, '');
    if (!customerPhone) return alert("Telefone não encontrado para esta O.S.");

    let msg = `*🛠️ ORDEM DE SERVIÇO - ${profile.officeName.toUpperCase()}*\n\n`;
    msg += `Olá *${order.customerName}*! Sua O.S. foi gerada com sucesso.\n\n`;
    msg += `📑 *Nº Controle:* #${order.id.substring(0,8).toUpperCase()}\n`;
    msg += `📱 *Equipamento:* ${order.equipment}\n`;
    msg += `📝 *Descrição:* ${order.description}\n`;
    msg += `💰 *Valor:* R$ ${order.cost.toFixed(2)}\n`;
    msg += `💳 *Forma Pagto:* ${order.paymentMethod} ${order.installments ? `(${order.installments}x)` : ''}\n`;
    msg += `📦 *Entrega:* ${order.deliveryDeadline || 'A combinar'}\n`;
    msg += `🛡️ *Garantia:* ${order.warranty || '90 dias'}\n\n`;
    msg += `_Pode contar conosco! Para mais detalhes, responda esta mensagem._`;

    window.open(`https://wa.me/55${customerPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const customer = customers.find(c => c.id === formData.customerId);
    
    try {
      const orderData = {
        customerId: formData.customerId || 'GUEST',
        customerName: customer?.name || formData.manualCustomerName.toUpperCase() || 'CLIENTE AVULSO',
        customerCpfCnpj: customer?.cpfCnpj || formData.manualCustomerCpf || '',
        customerPhone: customer?.phone || formData.manualCustomerPhone || '',
        customerAddress: customer?.address || '',
        equipment: formData.equipment.toUpperCase(),
        equipmentBrand: formData.equipmentBrand.toUpperCase(),
        equipmentModel: formData.equipmentModel.toUpperCase(),
        equipmentSerial: formData.equipmentSerial.toUpperCase(),
        description: formData.description,
        informedDefect: formData.informedDefect,
        technicalDiagnosis: formData.technicalDiagnosis,
        executedService: formData.executedService,
        partsUsed: formData.partsUsed,
        cost: parseFloat(formData.cost || '0'),
        paymentMethod: formData.paymentMethod,
        installments: parseInt(formData.installments || '1'),
        deliveryDeadline: formData.deliveryDeadline,
        warranty: formData.warranty,
        notes: formData.notes,
        status: formData.status
      };
      
      const userName = profile.fullName || profile.officeName || profile.email;
      const docRef = await dbService.add('service_orders', userId, orderData, userName);
      
      if (sendWhatsApp && orderData.customerPhone) {
        sendWhatsAppOS({ id: docRef.id, ...orderData } as any);
      }

      setIsModalOpen(false);
      resetForm();
    } catch (err) { 
      console.error(err);
      alert("Erro ao salvar O.S."); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      manualCustomerName: '',
      manualCustomerPhone: '',
      manualCustomerCpf: '',
      equipment: '',
      equipmentBrand: '',
      equipmentModel: '',
      equipmentSerial: '',
      description: '',
      informedDefect: '',
      technicalDiagnosis: '',
      executedService: '',
      partsUsed: '',
      cost: '',
      paymentMethod: 'PIX',
      installments: '1',
      deliveryDeadline: '',
      warranty: '90 dias',
      notes: '',
      status: 'OPEN'
    });
  };

  const updateStatus = (id: string, nextStatus: any) => {
    const userName = profile.fullName || profile.officeName || profile.email;
    dbService.update('service_orders', id, { status: nextStatus }, userId, userName);
  };

  const getOSHtml = (order: ServiceOrder) => {
    const date = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
    return `
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Ordem de Serviço #${order.id.substring(0,8)}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #333; line-height: 1.4; font-size: 12px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #ff8000; padding-bottom: 15px; margin-bottom: 20px; }
            .company-info h1 { margin: 0; color: #ff8000; font-size: 22px; text-transform: uppercase; }
            .os-info { text-align: right; }
            .os-number { font-size: 18px; font-weight: bold; color: #333; }
            .section { margin-bottom: 15px; border: 1px solid #ddd; padding: 10px; border-radius: 5px; }
            .section-title { font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #eee; margin-bottom: 8px; padding-bottom: 3px; color: #ff8000; font-size: 10px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .label { font-weight: bold; color: #666; width: 120px; display: inline-block; }
            .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 50px; text-align: center; }
            .sig-line { border-top: 1px solid #000; padding-top: 5px; margin-top: 40px; }
            table { width: 100%; border-collapse: collapse; margin-top: 5px; }
            table th { background: #f5f5f5; text-align: left; padding: 5px; border: 1px solid #ddd; }
            table td { padding: 5px; border: 1px solid #ddd; }
            .footer { margin-top: 20px; font-size: 9px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              <h1>${profile.officeName}</h1>
              <div>CNPJ: ${profile.cnpj || '---'}</div>
              <div>Tel: ${profile.phone || '---'} | Email: ${profile.email}</div>
              <div>End: ${profile.address || '---'}</div>
            </div>
            <div class="os-info">
              <div class="os-number">ORDEM DE SERVIÇO #${order.id.substring(0,8).toUpperCase()}</div>
              <div>Data de Abertura: ${date}</div>
              <div>Status: <strong>${order.status}</strong></div>
            </div>
          </div>
          <div class="section">
            <div class="section-title">Dados do Cliente</div>
            <div class="grid">
              <div><span class="label">Nome:</span> ${order.customerName}</div>
              <div><span class="label">CPF/CNPJ:</span> ${order.customerCpfCnpj || '---'}</div>
              <div><span class="label">Telefone:</span> ${order.customerPhone || '---'}</div>
              <div><span class="label">Endereço:</span> ${order.customerAddress || '---'}</div>
            </div>
          </div>
          <div class="section">
            <div class="section-title">Equipamento / Produto</div>
            <div class="grid">
              <div><span class="label">Equipamento:</span> ${order.equipment}</div>
              <div><span class="label">Marca/Modelo:</span> ${order.equipmentBrand || ''} ${order.equipmentModel || ''}</div>
              <div><span class="label">Nº de Série:</span> ${order.equipmentSerial || '---'}</div>
              <div><span class="label">Prazo Entrega:</span> ${order.deliveryDeadline || 'A combinar'}</div>
            </div>
          </div>
          <div class="section">
            <div class="section-title">Defeito e Diagnóstico</div>
            <p><strong>Defeito informado:</strong> ${order.informedDefect || order.description}</p>
            <p><strong>Diagnóstico técnico:</strong> ${order.technicalDiagnosis || 'Aguardando avaliação.'}</p>
          </div>
          <div class="section">
            <div class="section-title">Serviço e Peças</div>
            <p><strong>Descrição do serviço:</strong> ${order.description}</p>
            <p><strong>Serviço executado:</strong> ${order.executedService || 'Pendente.'}</p>
            <p><strong>Peças utilizadas:</strong> ${order.partsUsed || 'Nenhuma.'}</p>
          </div>
          <div class="section">
            <div class="section-title">Financeiro e Garantia</div>
            <div class="grid">
              <div><span class="label">Valor Total:</span> <strong>R$ ${order.cost.toFixed(2)}</strong></div>
              <div><span class="label">Forma Pagto:</span> ${order.paymentMethod || 'A combinar'} ${order.installments ? `(${order.installments}x)` : ''}</div>
              <div><span class="label">Garantia:</span> ${order.warranty || '90 dias'}</div>
            </div>
            <div style="margin-top:10px;"><strong>Observações gerais:</strong> ${order.notes || '---'}</div>
          </div>
          <div class="signatures">
            <div><div class="sig-line">Assinatura do Cliente</div></div>
            <div><div class="sig-line">Responsável Técnico</div></div>
          </div>
          <div class="footer">Documento gerado pelo sistema NEXUS OS 3.1 - ${new Date().toLocaleString()}</div>
        </body>
        </html>
    `;
  };

  const generateOSPrint = (order: ServiceOrder) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const html = getOSHtml(order);
      printWindow.document.write(html);
      printWindow.document.write('<script>window.onload = () => { window.print(); window.close(); }</script>');
      printWindow.document.close();
    }
  };

  const downloadOS = (order: ServiceOrder) => {
    const execute = () => {
      const htmlContent = getOSHtml(order);
      const opt = {
        margin: 10,
        filename: `OS_${order.id.substring(0,8).toUpperCase()}_${order.customerName.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      // @ts-ignore
      html2pdf().from(htmlContent).set(opt).save();
    };

    if (!(window as any).html2pdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = execute;
      document.head.appendChild(script);
    } else {
      execute();
    }
  };

  const filtered = orders.filter(o => 
    o.customerName.toLowerCase().includes(search.toLowerCase()) || 
    o.equipment.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-black text-brand-blue italic tracking-tighter uppercase">Ordem de Serviço</h2>
          <p className="text-slate-500 font-bold text-xs tracking-widest uppercase mt-2 opacity-70">Gestão Profissional de Manutenção.</p>
        </div>
        <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="btn-orange px-6 py-4 rounded-2xl flex items-center gap-2 shadow-lg"><Plus size={18}/> NOVA O.S.</button>
      </div>

      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center gap-4">
        <Search className="text-orange-500" size={20} />
        <input placeholder="Localizar O.S., Cliente ou Equipamento..." className="bg-transparent flex-1 outline-none text-slate-700 font-bold" value={search} onChange={e=>setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filtered.map(o => {
          const isExpanded = expandedOrderId === o.id;
          return (
            <div key={o.id} className="nexus-card overflow-hidden group border-slate-100">
              <div className="p-6 flex items-center justify-between cursor-pointer hover:bg-brand-blue/5 transition-all" onClick={() => setExpandedOrderId(isExpanded ? null : o.id)}>
                <div className="flex items-center gap-6">
                   <div className={`p-4 rounded-xl ${o.status==='DONE'?'bg-emerald-500/10 text-emerald-500':o.status==='OPEN'?'bg-orange-500/10 text-orange-500':'bg-blue-500/10 text-blue-500'}`}>
                      <Wrench size={24} />
                   </div>
                   <div>
                      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">OS #{o.id.substring(0,8).toUpperCase()} • {o.status}</p>
                      <h4 className="text-xl font-black text-brand-blue italic tracking-tight uppercase">{o.equipment}</h4>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><User size={12}/> {o.customerName}</p>
                   </div>
                </div>
                <div className="flex items-center gap-6">
                   <p className="text-2xl font-black text-orange-500 italic">R$ {o.cost.toFixed(2)}</p>
                   <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); sendWhatsAppOS(o); }} className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all" title="Enviar via WhatsApp"><MessageCircle size={18}/></button>
                      <button onClick={(e) => { e.stopPropagation(); downloadOS(o); }} className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-brand-blue hover:text-white transition-all" title="Baixar O.S. (PDF)"><Download size={18}/></button>
                      <button onClick={(e) => { e.stopPropagation(); generateOSPrint(o); }} className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-brand-blue hover:text-white transition-all" title="Imprimir O.S."><Printer size={18}/></button>
                      {isExpanded ? <ChevronUp className="text-slate-500"/> : <ChevronDown className="text-slate-500"/>}
                   </div>
                </div>
              </div>

              {isExpanded && (
                <div className="p-8 bg-slate-50 border-t border-slate-200 animate-fade-in space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-4">
                        <h5 className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Informações Técnicas</h5>
                        <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-2">
                           <p className="text-slate-600 text-xs"><strong>Defeito:</strong> {o.informedDefect || o.description}</p>
                           <p className="text-slate-600 text-xs"><strong>Diagnóstico:</strong> {o.technicalDiagnosis || '---'}</p>
                           <p className="text-slate-600 text-xs"><strong>Serviço:</strong> {o.executedService || '---'}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h5 className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Peças e Pagamento</h5>
                        <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-2">
                           <p className="text-slate-600 text-xs"><strong>Peças:</strong> {o.partsUsed || '---'}</p>
                           <p className="text-slate-600 text-xs"><strong>Pagamento:</strong> {o.paymentMethod || 'PIX'} {o.installments ? `(${o.installments}x)` : ''}</p>
                           <p className="text-slate-600 text-xs"><strong>Garantia:</strong> {o.warranty || '90 dias'}</p>
                        </div>
                      </div>
                      <div className="flex flex-col justify-end gap-3">
                        <button onClick={()=>updateStatus(o.id, 'DONE')} className={`w-full py-4 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-3 transition-all ${o.status==='DONE'?'bg-emerald-500 text-white':'bg-white text-emerald-500 border border-emerald-500/20 hover:bg-emerald-50'}`}>
                           <CheckCircle size={16}/> Finalizar O.S.
                        </button>
                        <button onClick={()=>updateStatus(o.id, 'IN_PROGRESS')} className={`w-full py-4 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-3 transition-all ${o.status==='IN_PROGRESS'?'bg-blue-500 text-white':'bg-white text-blue-400 border border-blue-400/20 hover:bg-blue-50'}`}>
                           <Clock size={16}/> Iniciar Manutenção
                        </button>
                        <button onClick={()=>dbService.del('service_orders', o.id)} className="w-full py-4 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-3 bg-rose-50 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white">
                           <Trash2 size={16}/> Excluir Registro
                        </button>
                      </div>
                   </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-white/90 backdrop-blur-md overflow-y-auto">
          <div className="nexus-card w-full max-w-4xl p-8 border-slate-200 my-auto shadow-2xl">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
               <h3 className="text-2xl font-black italic uppercase text-brand-blue flex items-center gap-4"><FileText /> Abertura de Ordem de Serviço</h3>
               <button onClick={()=>setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Seção Cliente */}
                 <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <h5 className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Identificação do Cliente</h5>
                     <span className="text-[8px] font-bold text-slate-500 uppercase">Selecione ou digite abaixo</span>
                   </div>
                   
                   <select value={formData.customerId} onChange={e=>setFormData({...formData, customerId: e.target.value})} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm outline-none focus:border-brand-blue">
                      <option value="">+ CLIENTE NÃO CADASTRADO (AVULSO)</option>
                      {customers.map(c=><option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                   </select>

                   {!formData.customerId && (
                     <div className="space-y-3 animate-fade">
                        <input placeholder="NOME DO CLIENTE" value={formData.manualCustomerName} onChange={e=>setFormData({...formData, manualCustomerName: e.target.value})} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs uppercase outline-none focus:border-brand-blue" required={!formData.customerId} />
                        <div className="grid grid-cols-2 gap-2">
                           <div className="relative">
                              <Smartphone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input placeholder="WHATSAPP" value={formData.manualCustomerPhone} onChange={e=>setFormData({...formData, manualCustomerPhone: e.target.value})} className="w-full p-4 pl-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs outline-none focus:border-brand-blue" required={!formData.customerId} />
                           </div>
                           <input placeholder="CPF / CNPJ" value={formData.manualCustomerCpf} onChange={e=>setFormData({...formData, manualCustomerCpf: e.target.value})} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs outline-none focus:border-brand-blue" />
                        </div>
                     </div>
                   )}

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-500 uppercase ml-2">Prazo de Entrega</label>
                        <input type="text" value={formData.deliveryDeadline} onChange={e=>setFormData({...formData, deliveryDeadline: e.target.value})} className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs outline-none focus:border-brand-blue" placeholder="Ex: 48 horas" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-500 uppercase ml-2">Garantia</label>
                        <input type="text" value={formData.warranty} onChange={e=>setFormData({...formData, warranty: e.target.value})} className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs outline-none focus:border-brand-blue" placeholder="Ex: 90 dias" />
                      </div>
                   </div>
                 </div>

                 {/* Seção Equipamento */}
                 <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Equipamento / Produto</h5>
                    <input placeholder="Nome do Equipamento (Ex: iPhone 13)" value={formData.equipment} onChange={e=>setFormData({...formData, equipment: e.target.value})} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm outline-none focus:border-brand-blue" required />
                    <div className="grid grid-cols-3 gap-2">
                       <input placeholder="Marca" value={formData.equipmentBrand} onChange={e=>setFormData({...formData, equipmentBrand: e.target.value})} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs outline-none focus:border-brand-blue" />
                       <input placeholder="Modelo" value={formData.equipmentModel} onChange={e=>setFormData({...formData, equipmentModel: e.target.value})} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs outline-none focus:border-brand-blue" />
                       <input placeholder="Série/IMEI" value={formData.equipmentSerial} onChange={e=>setFormData({...formData, equipmentSerial: e.target.value})} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs outline-none focus:border-brand-blue" />
                    </div>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Seção Defeito/Diagnóstico */}
                 <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Descrição Técnica</h5>
                    <textarea placeholder="Defeito Informado pelo Cliente..." value={formData.informedDefect} onChange={e=>setFormData({...formData, informedDefect: e.target.value})} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm h-20 resize-none outline-none focus:border-brand-blue" />
                    <textarea placeholder="Diagnóstico Preliminar do Técnico..." value={formData.technicalDiagnosis} onChange={e=>setFormData({...formData, technicalDiagnosis: e.target.value})} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm h-20 resize-none outline-none focus:border-brand-blue" />
                 </div>

                 {/* Seção Execução/Financeiro */}
                 <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Execução e Valores</h5>
                    <textarea placeholder="Descrição dos Serviços e Peças..." value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm h-20 resize-none outline-none focus:border-brand-blue" required />
                    <div className="grid grid-cols-3 gap-2">
                       <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-500 uppercase ml-2">Valor Previsto R$</label>
                          <input type="number" step="0.01" value={formData.cost} onChange={e=>setFormData({...formData, cost: e.target.value})} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-brand-blue font-black text-lg outline-none focus:border-brand-blue" required />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-500 uppercase ml-2">Forma</label>
                          <select value={formData.paymentMethod} onChange={e=>setFormData({...formData, paymentMethod: e.target.value})} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs outline-none focus:border-brand-blue">
                             <option value="PIX">PIX</option>
                             <option value="DINHEIRO">DINHEIRO</option>
                             <option value="CARTÃO CRÉDITO">CARTÃO</option>
                             <option value="DEFERRED">CREDIÁRIO</option>
                          </select>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-500 uppercase ml-2">Parcelas</label>
                          <input type="number" min="1" value={formData.installments} onChange={e=>setFormData({...formData, installments: e.target.value})} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold outline-none focus:border-brand-blue" />
                       </div>
                    </div>
                 </div>
               </div>

               <div className="flex items-center gap-4 bg-orange-500/5 p-4 rounded-2xl border border-orange-500/10">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      id="sendWhatsApp" 
                      checked={sendWhatsApp} 
                      onChange={(e) => setSendWhatsApp(e.target.checked)}
                      className="w-5 h-5 accent-orange-500"
                    />
                    <label htmlFor="sendWhatsApp" className="text-slate-700 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 cursor-pointer">
                       <Zap size={14} className="text-orange-500"/> Envio Automático via WhatsApp ao Salvar
                    </label>
                  </div>
                  <p className="text-slate-400 text-[8px] font-bold uppercase ml-auto">* Toda O.S. fica salva para consulta futura</p>
               </div>

               <button disabled={isSaving} type="submit" className="btn-orange w-full py-6 rounded-2xl flex items-center justify-center gap-3 text-lg shadow-xl shadow-orange-500/20">
                 {isSaving ? <Loader2 className="animate-spin" /> : <Wrench size={24}/>} GERAR E SALVAR ORDEM DE SERVIÇO
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceOrdersView;