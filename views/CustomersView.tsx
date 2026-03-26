import React, { useState, useMemo } from 'react';
import { Plus, Search, Mail, Phone, MapPin, Edit2, Trash2, X, UserCheck, Loader2, Printer, FileText, ChevronDown, ChevronUp, Smartphone, Briefcase, CreditCard, ShieldCheck, Tag, Calendar, User, Info } from 'lucide-react';
import { Customer, Order, UserProfile } from '../types';
import { dbService } from '../services/firebase';

interface CustomersViewProps {
  customers: Customer[];
  orders: Order[];
  userId: string;
  profile: UserProfile;
}

const CustomersView: React.FC<CustomersViewProps> = ({ customers, orders, userId, profile }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const initialForm = {
    name: '', email: '', phone: '', whatsapp: '', address: '',
    cpfCnpj: '', rg: '', birthDate: '', maritalStatus: 'Não Informado',
    street: '', number: '', neighborhood: '', city: '', state: '', zip: '', complement: '',
    profession: '', company: '', role: '', income: '',
    clientType: 'PF' as 'PF' | 'PJ', assignedRep: '',
    preferredPayment: 'PIX', preferredTime: 'Qualquer Horário', preferredChannel: 'WhatsApp',
    notes: '', lgpdConsent: true
  };

  const [formData, setFormData] = useState(initialForm);

  const unifiedCustomers = useMemo(() => {
    const list = [...customers];
    orders.forEach(order => {
      const gName = (order as any).guestName;
      const gPhone = (order as any).guestPhone;
      if (gName && gName !== 'VENDA RÁPIDA') {
        const alreadyExists = list.some(c => 
          c.name.toLowerCase() === gName.toLowerCase() || 
          (c.phone && c.phone === gPhone)
        );
        if (!alreadyExists) {
          list.push({
            id: `venda-${order.id}`,
            userId: order.userId,
            name: gName,
            phone: gPhone,
            email: 'Origem: Venda PdV',
            registrationDate: order.createdAt
          } as Customer);
        }
      }
    });
    return list;
  }, [customers, orders]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const userName = profile.fullName || profile.officeName || profile.email;
      const data = { ...formData, registrationDate: editingCustomer?.registrationDate || new Date() };
      if (editingCustomer && !editingCustomer.id.startsWith('venda-')) {
        await dbService.update('customers', editingCustomer.id, data, userId, userName);
      } else {
        await dbService.add('customers', userId, data, userName);
      }
      setIsModalOpen(false);
      setEditingCustomer(null);
      setFormData(initialForm);
    } catch (err) { alert("Erro ao salvar cliente."); } finally { setIsSaving(false); }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      whatsapp: customer.whatsapp || '',
      address: customer.address || '',
      cpfCnpj: customer.cpfCnpj || '',
      rg: customer.rg || '',
      birthDate: customer.birthDate || '',
      maritalStatus: customer.maritalStatus || 'Não Informado',
      street: customer.street || '',
      number: customer.number || '',
      neighborhood: customer.neighborhood || '',
      city: customer.city || '',
      state: customer.state || '',
      zip: customer.zip || '',
      complement: customer.complement || '',
      profession: customer.profession || '',
      company: customer.company || '',
      role: customer.role || '',
      income: customer.income || '',
      clientType: customer.clientType || 'PF',
      assignedRep: customer.assignedRep || '',
      preferredPayment: customer.preferredPayment || 'PIX',
      preferredTime: customer.preferredTime || 'Manhã',
      preferredChannel: customer.preferredChannel || 'WhatsApp',
      notes: customer.notes || '',
      lgpdConsent: customer.lgpdConsent ?? true
    });
    setIsModalOpen(true);
  };

  const printFiche = (c: Customer) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const customerOrders = orders.filter(o => o.customerId === c.id || (o as any).guestName === c.name);
      const totalSpent = customerOrders.reduce((s,o) => s + o.total, 0);
      const regDate = c.registrationDate?.toDate ? c.registrationDate.toDate().toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
      
      const html = `
        <html>
        <head>
          <title>Ficha Cadastral Profissional - ${c.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.4; font-size: 11px; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #f97316; padding-bottom: 20px; margin-bottom: 30px; }
            .header-info h1 { margin: 0; color: #f97316; font-size: 22px; text-transform: uppercase; font-weight: 800; letter-spacing: -0.03em; }
            .header-id { text-align: right; color: #64748b; font-weight: 700; font-size: 10px; }
            .section { margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; page-break-inside: avoid; }
            .section-title { background: #fff7ed; padding: 10px 15px; font-weight: 800; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; color: #c2410c; font-size: 10px; display: flex; justify-content: space-between; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); padding: 15px; gap: 15px; }
            .field { margin-bottom: 5px; }
            .label { font-weight: 800; color: #64748b; display: block; font-size: 9px; text-transform: uppercase; margin-bottom: 2px; }
            .value { font-size: 11px; color: #0f172a; font-weight: 500; }
            .full-width { grid-column: span 3; }
            .half-width { grid-column: span 2; }
            table { width: 100%; border-collapse: collapse; margin-top: 5px; }
            table th { background: #f8fafc; padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 9px; font-weight: 700; color: #64748b; }
            table td { padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 10px; color: #334155; }
            .total-row { background: #f8fafc; padding: 12px; text-align: right; font-weight: 800; font-size: 12px; border-top: 1px solid #e2e8f0; color: #f97316; }
            .consent-box { margin-top: 30px; border: 1px solid #cbd5e1; padding: 20px; border-radius: 12px; background: #f8fafc; }
            .consent-text { font-size: 10px; color: #475569; margin-bottom: 25px; line-height: 1.6; }
            .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; text-align: center; margin-top: 20px; }
            .sig-line { border-top: 1px solid #1e293b; padding-top: 10px; font-weight: 700; font-size: 10px; }
            .footer { text-align: center; margin-top: 40px; font-size: 8px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 15px; text-transform: uppercase; letter-spacing: 0.1em; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body onload="window.print()">
          <div class="header">
            <div class="header-info">
              <h1>Ficha Cadastral de Cliente</h1>
              <div style="font-size: 10px; font-weight: 700; color: #64748b; margin-top: 5px;">CADASTRO PROFISSIONAL DE IDENTIDADE</div>
            </div>
            <div class="header-id">
              DATA: ${regDate}<br>
              REVISÃO: 3.1
            </div>
          </div>

          <div class="section">
            <div class="section-title"><span>01. Dados Pessoais</span> <span>REGISTRO ${c.clientType || 'PF'}</span></div>
            <div class="grid">
              <div class="field half-width"><span class="label">Nome Completo / Razão Social</span><span class="value">${c.name}</span></div>
              <div class="field"><span class="label">Data de Nascimento</span><span class="value">${c.birthDate || '---'}</span></div>
              <div class="field"><span class="label">CPF / CNPJ</span><span class="value">${c.cpfCnpj || '---'}</span></div>
              <div class="field"><span class="label">RG / IE</span><span class="value">${c.rg || '---'}</span></div>
              <div class="field"><span class="label">Estado Civil</span><span class="value">${c.maritalStatus || '---'}</span></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">02. Canais de Contato</div>
            <div class="grid">
              <div class="field"><span class="label">Telefone Principal</span><span class="value">${c.phone || '---'}</span></div>
              <div class="field"><span class="label">WhatsApp</span><span class="value">${c.whatsapp || '---'}</span></div>
              <div class="field"><span class="label">E-mail Operacional</span><span class="value">${c.email || '---'}</span></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">03. Endereço e Localização</div>
            <div class="grid">
              <div class="field half-width"><span class="label">Logradouro (Rua/Av)</span><span class="value">${c.street || '---'}</span></div>
              <div class="field"><span class="label">Número</span><span class="value">${c.number || 'S/N'}</span></div>
              <div class="field"><span class="label">Bairro</span><span class="value">${c.neighborhood || '---'}</span></div>
              <div class="field"><span class="label">Cidade</span><span class="value">${c.city || '---'}</span></div>
              <div class="field"><span class="label">Estado (UF)</span><span class="value">${c.state || '---'}</span></div>
              <div class="field"><span class="label">CEP</span><span class="value">${c.zip || '---'}</span></div>
              <div class="field half-width"><span class="label">Complemento</span><span class="value">${c.complement || '---'}</span></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">04. Perfil Profissional e Preferências</div>
            <div class="grid">
              <div class="field"><span class="label">Profissão</span><span class="value">${c.profession || '---'}</span></div>
              <div class="field"><span class="label">Empresa</span><span class="value">${c.company || '---'}</span></div>
              <div class="field"><span class="label">Renda Aprox.</span><span class="value">${c.income || '---'}</span></div>
              <div class="field"><span class="label">Forma Pagto Pref.</span><span class="value">${c.preferredPayment || '---'}</span></div>
              <div class="field"><span class="label">Horário de Atend.</span><span class="value">${c.preferredTime || '---'}</span></div>
              <div class="field"><span class="label">Canal de Preferência</span><span class="value">${c.preferredChannel || '---'}</span></div>
              <div class="field full-width"><span class="label">Observações Gerais</span><span class="value">${c.notes || 'Nenhuma observação relevante.'}</span></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">05. Histórico de Atendimentos Realizados</div>
            <table>
              <thead>
                <tr><th>DATA</th><th>DESCRIÇÃO DOS SERVIÇOS / PRODUTOS</th><th>PAGAMENTO</th><th>VALOR (R$)</th></tr>
              </thead>
              <tbody>
                ${customerOrders.length > 0 ? customerOrders.map(o => `
                  <tr>
                    <td>${o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString('pt-BR') : '---'}</td>
                    <td>${o.items.map(i => i.nameAtTime).join(', ')}</td>
                    <td>${o.paymentMethod}</td>
                    <td>${o.total.toFixed(2)}</td>
                  </tr>
                `).join('') : '<tr><td colspan="4" style="text-align:center; padding: 20px; color: #94a3b8;">Nenhum registro de movimentação financeira no período.</td></tr>'}
              </tbody>
            </table>
            <div class="total-row">VOLUME TOTAL ACUMULADO: R$ ${totalSpent.toFixed(2)}</div>
          </div>

          <div class="consent-box">
            <p class="consent-text"><strong>DECLARAÇÃO DE CONSENTIMENTO (LGPD):</strong> [ ${c.lgpdConsent ? 'X' : ' '} ] Declaro estar ciente e concordo com a coleta e tratamento dos meus dados pessoais acima informados, para fins exclusivos de cadastro, atendimento comercial, histórico de serviços e comunicações institucionais, nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Meus dados serão armazenados de forma segura e não serão compartilhados com terceiros sem prévia autorização.</p>
            <div class="signatures">
              <div>
                <div class="sig-line">ASSINATURA DO CLIENTE</div>
                <div style="font-size:8px; color:#94a3b8; margin-top:5px;">CONFIRMAÇÃO DE DADOS E CONSENTIMENTO</div>
              </div>
              <div>
                <div class="sig-line">RESPONSÁVEL PELO CADASTRO</div>
                <div style="font-size:8px; color:#94a3b8; margin-top:5px;">NEXUS OPERACIONAL</div>
              </div>
            </div>
          </div>

          <div class="footer">DOCUMENTO GERADO VIA NEXUS OS 3.1 - SOFTWARE DE GESTÃO - ${new Date().toLocaleString()}</div>
        </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
    }
  };

  const filtered = unifiedCustomers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone && c.phone.includes(searchTerm)) ||
    (c.cpfCnpj && c.cpfCnpj.includes(searchTerm))
  );

  return (
    <div className="space-y-12 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h2 className="text-4xl font-black text-brand-blue tracking-tighter italic uppercase">Central de Clientes</h2>
          <p className="text-slate-500 font-bold mt-2 text-xs tracking-widest uppercase opacity-70">Sincronização Elite de Identidades.</p>
        </div>
        <button onClick={() => { setEditingCustomer(null); setFormData(initialForm); setIsModalOpen(true); }} className="btn-brand-orange px-8 py-4 rounded-2xl flex items-center gap-4 active:scale-95 transition-all shadow-lg">
          <Plus size={24} /> NOVA FICHA
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 focus-within:border-brand-orange transition-all shadow-sm">
        <Search className="text-slate-400" size={24} />
        <input 
          type="text" 
          placeholder="Localizar por nome, telefone ou CPF/CNPJ..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="flex-1 bg-transparent outline-none font-bold text-slate-700 placeholder:text-slate-300" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(customer => {
          const isExp = expandedId === customer.id;
          const isFromSale = customer.id.startsWith('venda-');
          const zap = customer.whatsapp || customer.phone || 'NÃO INFORMADO';
          const origin = isFromSale ? 'VENDA PDV' : 'CADASTRO MANUAL';

          return (
            <div key={customer.id} className="nexus-card overflow-hidden group bg-white">
              <div className="p-6 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                   <div className="w-14 h-14 rounded-2xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center font-black text-2xl text-brand-orange">
                     {customer.name.charAt(0).toUpperCase()}
                   </div>
                   <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                     <button onClick={() => printFiche(customer)} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:text-brand-blue"><Printer size={16}/></button>
                     <button onClick={() => handleEdit(customer)} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:text-brand-orange"><Edit2 size={16}/></button>
                     {!isFromSale && (
                        <button onClick={() => { if(confirm('Excluir?')) dbService.del('customers', customer.id); }} className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white"><Trash2 size={16}/></button>
                     )}
                   </div>
                </div>
                <div>
                   <h3 className="font-black text-brand-blue text-lg tracking-tight uppercase truncate">{customer.name}</h3>
                   <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase flex items-center gap-1 ${isFromSale ? 'bg-brand-blue/10 text-brand-blue border border-brand-blue/20' : 'bg-brand-green/10 text-brand-green border border-brand-green/20'}`}>
                        <Tag size={8} /> {origin}
                      </span>
                   </div>
                </div>
                <div className="space-y-2 border-t border-slate-50 pt-4">
                  <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase">
                    <Smartphone size={14} className="text-brand-orange" /> <span className="text-brand-blue">{zap}</span>
                  </div>
                </div>
                <button onClick={() => setExpandedId(isExp ? null : customer.id)} className="w-full py-2 bg-slate-50 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all">
                  {isExp ? <ChevronUp size={14} className="mx-auto" /> : <ChevronDown size={14} className="mx-auto" />}
                </button>
              </div>

              {isExp && (
                <div className="p-6 bg-slate-50/50 border-t border-slate-100 animate-fade space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Cidade/UF</span>
                        <p className="text-[10px] text-brand-blue font-bold">{customer.city || '---'}/{customer.state || '--'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Identidade</span>
                        <p className="text-[10px] text-brand-blue font-bold truncate">{customer.cpfCnpj || 'NÃO INFORMADO'}</p>
                      </div>
                   </div>
                   <div className="space-y-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Observações</span>
                      <p className="text-[10px] text-slate-600 leading-tight italic">{customer.notes || 'Nenhuma nota registrada.'}</p>
                   </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
          <div className="nexus-card w-full max-w-5xl p-8 bg-white border-brand-orange my-auto shadow-2xl">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
              <h3 className="text-2xl font-black italic uppercase text-brand-blue flex items-center gap-4"><UserCheck className="text-brand-orange"/> Ficha Cadastral Profissional</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={28} /></button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Dados Pessoais */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-l-4 border-brand-orange pl-3">
                     <User size={18} className="text-brand-orange" />
                     <h5 className="text-[10px] font-black text-brand-blue uppercase tracking-widest">01. Dados Pessoais</h5>
                  </div>
                  <input required placeholder="Nome Completo" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-brand-blue font-bold text-xs uppercase" />
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="CPF / CNPJ" value={formData.cpfCnpj} onChange={e=>setFormData({...formData, cpfCnpj: e.target.value})} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-brand-blue text-xs font-bold" />
                    <input placeholder="RG / IE" value={formData.rg} onChange={e=>setFormData({...formData, rg: e.target.value})} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-brand-blue text-xs font-bold" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase ml-2">Nascimento</label>
                      <input type="date" value={formData.birthDate} onChange={e=>setFormData({...formData, birthDate: e.target.value})} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-brand-blue text-xs font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase ml-2">Estado Civil</label>
                      <select value={formData.maritalStatus} onChange={e=>setFormData({...formData, maritalStatus: e.target.value})} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-brand-blue text-xs font-bold">
                         <option>Não Informado</option>
                         <option>Solteiro(a)</option>
                         <option>Casado(a)</option>
                         <option>Divorciado(a)</option>
                         <option>Viúvo(a)</option>
                         <option>União Estável</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 border-l-4 border-brand-orange pl-3 pt-4">
                     <Smartphone size={18} className="text-brand-orange" />
                     <h5 className="text-[10px] font-black text-brand-blue uppercase tracking-widest">02. Contato</h5>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Telefone" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-brand-blue text-xs font-bold" />
                    <input placeholder="WhatsApp" value={formData.whatsapp} onChange={e=>setFormData({...formData, whatsapp: e.target.value})} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-brand-blue text-xs font-bold" />
                  </div>
                  <input placeholder="E-mail" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-brand-blue text-xs font-bold" />
                </div>

                {/* Localização */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-l-4 border-brand-orange pl-3">
                     <MapPin size={18} className="text-brand-orange" />
                     <h5 className="text-[10px] font-black text-brand-blue uppercase tracking-widest">03. Endereço Completo</h5>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input placeholder="Rua / Logradouro" value={formData.street} onChange={e=>setFormData({...formData, street: e.target.value})} className="col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-200 text-brand-blue font-bold text-xs uppercase" />
                    <input placeholder="Nº" value={formData.number} onChange={e=>setFormData({...formData, number: e.target.value})} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-brand-blue text-xs font-bold" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Bairro" value={formData.neighborhood} onChange={e=>setFormData({...formData, neighborhood: e.target.value})} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-brand-blue text-xs font-bold uppercase" />
                    <input placeholder="Complemento" value={formData.complement} onChange={e=>setFormData({...formData, complement: e.target.value})} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-brand-blue text-xs font-bold uppercase" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input placeholder="Cidade" value={formData.city} onChange={e=>setFormData({...formData, city: e.target.value})} className="col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-200 text-brand-blue text-xs font-bold uppercase" />
                    <input placeholder="Estado (UF)" value={formData.state} onChange={e=>setFormData({...formData, state: e.target.value})} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-brand-blue text-xs font-bold uppercase" maxLength={2} />
                  </div>
                  <input placeholder="CEP" value={formData.zip} onChange={e=>setFormData({...formData, zip: e.target.value})} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-brand-blue text-xs font-bold" />
                  
                  <div className="flex items-center gap-3 border-l-4 border-brand-orange pl-3 pt-4">
                     <Briefcase size={18} className="text-brand-orange" />
                     <h5 className="text-[10px] font-black text-brand-blue uppercase tracking-widest">04. Dados Profissionais</h5>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Profissão" value={formData.profession} onChange={e=>setFormData({...formData, profession: e.target.value})} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-brand-blue text-xs font-bold uppercase" />
                    <input placeholder="Empresa" value={formData.company} onChange={e=>setFormData({...formData, company: e.target.value})} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-brand-blue text-xs font-bold uppercase" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Cargo" value={formData.role} onChange={e=>setFormData({...formData, role: e.target.value})} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-brand-blue text-xs font-bold uppercase" />
                    <input placeholder="Renda Aprox." value={formData.income} onChange={e=>setFormData({...formData, income: e.target.value})} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-brand-blue text-xs font-bold uppercase" />
                  </div>
                </div>

                {/* Comerciais e Preferências */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-l-4 border-brand-orange pl-3">
                     <Tag size={18} className="text-brand-orange" />
                     <h5 className="text-[10px] font-black text-brand-blue uppercase tracking-widest">05. Dados Comerciais</h5>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase ml-2">Tipo Cliente</label>
                      <select value={formData.clientType} onChange={e=>setFormData({...formData, clientType: e.target.value as any})} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-brand-blue text-xs font-bold">
                        <option value="PF">Pessoa Física</option>
                        <option value="PJ">Pessoa Jurídica</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase ml-2">Resp. Atendimento</label>
                      <input placeholder="Nome Atendente" value={formData.assignedRep} onChange={e=>setFormData({...formData, assignedRep: e.target.value})} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-brand-blue text-xs font-bold uppercase" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 border-l-4 border-brand-orange pl-3 pt-4">
                     <CreditCard size={18} className="text-brand-orange" />
                     <h5 className="text-[10px] font-black text-brand-blue uppercase tracking-widest">06. Preferências</h5>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase ml-2">Pagamento Preferencial</label>
                      <select value={formData.preferredPayment} onChange={e=>setFormData({...formData, preferredPayment: e.target.value})} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-brand-blue text-xs font-bold uppercase">
                        <option>PIX</option>
                        <option>CARTÃO CRÉDITO</option>
                        <option>CARTÃO DÉBITO</option>
                        <option>DINHEIRO</option>
                        <option>BOLETO</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase ml-2">Horário Atendimento</label>
                        <select value={formData.preferredTime} onChange={e=>setFormData({...formData, preferredTime: e.target.value})} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-brand-blue text-xs font-bold uppercase">
                          <option>Manhã</option>
                          <option>Tarde</option>
                          <option>Noite</option>
                          <option>Qualquer Horário</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase ml-2">Canal Contato</label>
                        <select value={formData.preferredChannel} onChange={e=>setFormData({...formData, preferredChannel: e.target.value})} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-brand-blue text-xs font-bold uppercase">
                          <option>WhatsApp</option>
                          <option>E-mail</option>
                          <option>Telefone (Ligação)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6 border-t border-slate-100 pt-8">
                <div className="flex items-center gap-3 border-l-4 border-brand-orange pl-3">
                   <Info size={18} className="text-brand-orange" />
                   <h5 className="text-[10px] font-black text-brand-blue uppercase tracking-widest">07. Observações e LGPD</h5>
                </div>
                <textarea placeholder="Informações adicionais importantes sobre o perfil, restrições ou notas de atendimento..." value={formData.notes} onChange={e=>setFormData({...formData, notes: e.target.value})} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-brand-blue text-xs font-medium h-24 resize-none focus:border-brand-orange outline-none" />
                <div className="flex items-center gap-4 bg-brand-orange/10 p-5 rounded-2xl border border-brand-orange/20 shadow-sm">
                   <input type="checkbox" checked={formData.lgpdConsent} onChange={e=>setFormData({...formData, lgpdConsent: e.target.checked})} className="w-5 h-5 accent-brand-orange rounded cursor-pointer" id="lgpd-check" />
                   <label htmlFor="lgpd-check" className="text-[9px] font-bold text-brand-orange uppercase tracking-tight leading-relaxed cursor-pointer">O cliente autoriza expressamente o tratamento dos seus dados pessoais para fins de gestão, histórico e comunicações comerciais, em total conformidade com a Lei Geral de Proteção de Dados (LGPD).</label>
                </div>
              </div>

              <button disabled={isSaving} type="submit" className="btn-brand-orange w-full py-6 rounded-2xl flex items-center justify-center gap-4 text-lg shadow-2xl">
                {isSaving ? <Loader2 className="animate-spin" /> : <UserCheck size={28}/>} FINALIZAR E SALVAR FICHA CADASTRAL
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersView;