import React, { useState } from 'react';
import { FileText, Plus, Minus, Trash2, Search, X, Loader2, Zap, Smartphone, Calendar, Briefcase, User, Download, MessageCircle, ChevronDown, ChevronUp, ShoppingCart, ShieldCheck, CreditCard, Clock, Printer } from 'lucide-react';
import { Quote, Product, Customer, OrderItem, UserProfile } from '../types';
import { dbService } from '../services/firebase';

interface QuotesViewProps {
  quotes: Quote[];
  products: Product[];
  customers: Customer[];
  userId: string;
  profile: UserProfile;
}

const QuotesView: React.FC<QuotesViewProps> = ({ quotes, products, customers, userId, profile }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [guestData, setGuestData] = useState({ name: '', phone: '', cpfCnpj: '' });
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [installments, setInstallments] = useState(1);
  const [validUntil, setValidUntil] = useState('');
  const [discount, setDiscount] = useState(0);
  const [estimatedStart, setEstimatedStart] = useState('');
  const [estimatedCompletion, setEstimatedCompletion] = useState('');
  const [warranty, setWarranty] = useState('90 dias');
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');
  const [manualItem, setManualItem] = useState({ name: '', price: '', qty: '1', type: 'SERVICE' as any });
  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);

  const addItem = (product: Product) => {
    setItems(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      // Fix: Added missing priceCostAtTime property to comply with OrderItem interface
      return [...prev, { productId: product.id, quantity: 1, priceAtTime: product.price, priceCostAtTime: product.priceCost, nameAtTime: product.name, type: product.type as any }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.productId === id) return { ...item, quantity: Math.max(1, item.quantity + delta) };
      return item;
    }));
  };

  const addManualItem = () => {
    if (!manualItem.name || !manualItem.price) return alert("Preencha a descrição e o valor.");
    // Fix: Added missing priceCostAtTime property to comply with OrderItem interface
    setItems(prev => [...prev, {
      productId: `manual-${Date.now()}`,
      quantity: parseInt(manualItem.qty),
      priceAtTime: parseFloat(manualItem.price),
      priceCostAtTime: 0,
      nameAtTime: manualItem.name.toUpperCase(),
      type: manualItem.type
    }]);
    setManualItem({ name: '', price: '', qty: '1', type: 'SERVICE' });
  };

  const getQuoteHtml = (quote: Quote) => {
    const customer = customers.find(c => c.id === quote.customerId);
    const customerName = quote.customerName;
    const customerPhone = (quote as any).guestPhone || customer?.phone || '---';
    const customerCpfCnpj = (quote as any).guestCpfCnpj || customer?.cpfCnpj || '---';
    const date = quote.createdAt?.toDate ? quote.createdAt.toDate().toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
    const subtotal = quote.items.reduce((s, i) => s + (i.priceAtTime * i.quantity), 0);
    const discountVal = quote.discount || 0;

    const installmentDetailsHtml = (quote.installments && quote.installments > 1) 
      ? `<div style="margin-top: 10px; border-top: 1px dashed #eee; pt: 10px;">
          <p style="font-weight: 800; font-size: 9px; text-transform: uppercase; color: #0080FF; margin-bottom: 5px;">Plano de Pagamento:</p>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 5px;">
            ${Array.from({ length: quote.installments }).map((_, idx) => {
              const d = new Date();
              d.setMonth(d.getMonth() + idx);
              return `<div style="font-size: 9px;">Parc. ${idx+1}: R$ ${(quote.total / (quote.installments || 1)).toFixed(2)} (${d.toLocaleDateString('pt-BR')})</div>`;
            }).join('')}
          </div>
         </div>`
      : '';

    return `
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Orçamento #${quote.id.substring(0,8).toUpperCase()}</title>
          <style>
            body { font-family: 'Inter', 'Segoe UI', sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; font-size: 11px; background: #fff; }
            .container { max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0080FF; padding-bottom: 20px; margin-bottom: 30px; }
            .company-info h1 { margin: 0; color: #0080FF; font-size: 22px; text-transform: uppercase; font-weight: 800; letter-spacing: -0.02em; }
            .company-details { font-size: 10px; color: #64748b; margin-top: 5px; }
            .doc-info { text-align: right; }
            .doc-title { font-size: 16px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-bottom: 4px; }
            .section { margin-bottom: 25px; }
            .section-title { background: #E6F2FF; color: #0056b3; padding: 8px 12px; font-weight: 800; text-transform: uppercase; margin-bottom: 12px; font-size: 10px; border-left: 4px solid #0080FF; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
            table th { background: #f8fafc; padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 700; }
            table td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 11px; }
            .totals { margin-top: 30px; padding: 25px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; justify-content: flex-end; }
            .totals-list { width: 220px; }
            .totals-item { display: flex; justify-content: space-between; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px dashed #e2e8f0; }
            .totals-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
            .total-final { font-size: 18px; font-weight: 900; color: #0080FF; }
            .notes-box { padding: 15px; background: #fdfdfd; border: 1px solid #eee; border-radius: 8px; font-size: 10px; color: #475569; }
            .signatures { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; text-align: center; }
            .sig-line { border-top: 1px solid #94a3b8; padding-top: 8px; font-weight: 700; color: #0f172a; }
            .footer { text-align: center; margin-top: 50px; font-size: 8px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="company-info">
                ${profile.logoUrl ? `<img src="${profile.logoUrl}" style="max-height: 50px; margin-bottom: 10px;"><br>` : ''}
                <h1>${profile.officeName}</h1>
                <div class="company-details">
                  CNPJ/CPF: ${profile.cnpj || '---'}<br>
                  WhatsApp: ${profile.phone || '---'} | Email: ${profile.email}<br>
                  Endereço: ${profile.address || '---'}
                </div>
              </div>
              <div class="doc-info">
                <div class="doc-title">Orçamento #${quote.id.substring(0,8).toUpperCase()}</div>
                <div>Emissão: ${date}</div>
                <div>Validade: ${new Date(quote.validUntil).toLocaleDateString('pt-BR')}</div>
              </div>
            </div>
            <div class="section">
              <div class="section-title">Dados do Cliente</div>
              <div class="grid">
                <div><span style="color:#64748b; font-weight:bold; font-size:9px; text-transform:uppercase;">Nome:</span><br>${customerName}</div>
                <div><span style="color:#64748b; font-weight:bold; font-size:9px; text-transform:uppercase;">CPF/CNPJ:</span><br>${customerCpfCnpj}</div>
                <div><span style="color:#64748b; font-weight:bold; font-size:9px; text-transform:uppercase;">Telefone:</span><br>${customerPhone}</div>
              </div>
            </div>
            <div class="section">
              <div class="section-title">Serviços e Materiais</div>
              <table>
                <thead>
                  <tr>
                    <th>Item / Descrição</th>
                    <th>Qtd</th>
                    <th>Vl. Unitário</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${quote.items.map(i => `
                    <tr>
                      <td><strong>${i.nameAtTime}</strong><br><small style="color:#64748b">${i.type}</small></td>
                      <td>${i.quantity}</td>
                      <td>R$ ${i.priceAtTime.toFixed(2)}</td>
                      <td>R$ ${(i.priceAtTime * i.quantity).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            <div class="grid">
              <div>
                <div class="section">
                  <div class="section-title">Condições de Pagamento e Prazos</div>
                  <div class="notes-box">
                    <p><strong>Forma de Pagto:</strong> ${quote.paymentMethod || 'A combinar'} (${quote.installments || 1}x)</p>
                    <p><strong>Início Previsto:</strong> ${quote.estimatedStart || 'Imediato'}</p>
                    <p><strong>Conclusão Prevista:</strong> ${quote.estimatedCompletion || 'Consultar'}</p>
                    <p><strong>Garantia:</strong> ${quote.warranty || 'Conforme legislação'}</p>
                    ${installmentDetailsHtml}
                  </div>
                </div>
                ${quote.notes ? `
                <div class="section">
                  <div class="section-title">Observações Complementares</div>
                  <div class="notes-box">${quote.notes}</div>
                </div>` : ''}
              </div>
              <div class="totals">
                <div class="totals-list">
                  <div class="totals-item">
                    <span style="font-weight:700; color:#64748b;">Subtotal Bruto</span>
                    <span style="font-weight:700;">R$ ${subtotal.toFixed(2)}</span>
                  </div>
                  <div class="totals-item">
                    <span style="font-weight:700; color:#64748b;">Descontos (-)</span>
                    <span style="font-weight:700; color:#ef4444;">R$ ${discountVal.toFixed(2)}</span>
                  </div>
                  <div class="totals-item" style="border:none; margin-top:10px;">
                    <span style="font-weight:900; text-transform:uppercase; color:#0f172a;">Total Final</span>
                    <span class="total-final">R$ ${quote.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="signatures">
              <div>
                <div class="sig-line">${profile.officeName}</div>
                <div style="font-size:8px; color:#64748b; margin-top:4px;">Carimbo / Assinatura Responsável</div>
              </div>
              <div>
                <div class="sig-line">${customerName}</div>
                <div style="font-size:8px; color:#64748b; margin-top:4px;">Aceite do Cliente em ___/___/___</div>
              </div>
            </div>
            <div class="footer">Gerado via Profissional OS 3.1 - ${new Date().toLocaleString()}</div>
          </div>
        </body>
        </html>
    `;
  };

  const downloadQuotePDF = (quote: Quote) => {
    const execute = () => {
      const htmlContent = getQuoteHtml(quote);
      const opt = {
        margin: 10,
        filename: `ORCAMENTO_${quote.id.substring(0,8).toUpperCase()}_${quote.customerName.replace(/\s+/g, '_')}.pdf`,
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

  const sendWhatsAppQuote = (quote: Quote) => {
    const customer = customers.find(c => c.id === quote.customerId);
    const customerPhone = ((quote as any).guestPhone || customer?.phone || '').replace(/\D/g, '');
    if (!customerPhone) return alert("Telefone do cliente não encontrado.");

    let msg = `*📄 ORÇAMENTO - ${profile.officeName}*\n\n`;
    msg += `Olá *${quote.customerName}*! Segue a proposta detalhada conforme solicitado:\n\n`;
    quote.items.forEach(i => {
      msg += `• ${i.quantity}x ${i.nameAtTime} - R$ ${(i.priceAtTime * i.quantity).toFixed(2)}\n`;
    });
    msg += `\n💰 *VALOR TOTAL: R$ ${quote.total.toFixed(2)}*\n`;
    msg += `💳 *Pagamento:* ${quote.paymentMethod} (${quote.installments}x)\n`;
    if (quote.installments && quote.installments > 1) {
      msg += `📉 *Detalhe:* ${quote.installments}x de R$ ${(quote.total / quote.installments).toFixed(2)}\n`;
    }
    msg += `🚚 *Entrega:* ${quote.estimatedCompletion || 'A combinar'}\n`;
    msg += `🗓️ *Válido até:* ${new Date(quote.validUntil).toLocaleDateString('pt-BR')}\n\n`;
    msg += `_Ficamos no aguardo de sua aprovação!_`;

    window.open(`https://wa.me/55${customerPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const finalize = async () => {
    if (items.length === 0 || !validUntil) return alert('Selecione itens e a validade da proposta.');
    if (!selectedCustomerId && !guestData.name) return alert('Identifique o cliente para o orçamento.');
    
    setIsProcessing(true);
    try {
      const subtotal = items.reduce((acc, curr) => acc + (curr.priceAtTime * curr.quantity), 0);
      const total = subtotal - discount;
      const customer = customers.find(c => c.id === selectedCustomerId);

      const quoteData: Partial<Quote> = {
        customerId: selectedCustomerId || 'GUEST',
        customerName: customer?.name || guestData.name.toUpperCase(),
        items,
        total,
        discount,
        status: 'SENT',
        validUntil,
        notes,
        warranty,
        estimatedStart,
        estimatedCompletion,
        paymentMethod,
        installments
      };

      (quoteData as any).guestName = guestData.name.toUpperCase();
      (quoteData as any).guestPhone = guestData.phone;
      (quoteData as any).guestCpfCnpj = guestData.cpfCnpj;

      const userName = profile.fullName || profile.officeName || profile.email;
      await dbService.add('quotes', userId, quoteData, userName);
      setIsCreating(false);
      resetForm();
    } catch (e) { alert('Falha ao salvar orçamento.'); } finally { setIsProcessing(false); }
  };

  const resetForm = () => {
    setItems([]);
    setSelectedCustomerId('');
    setGuestData({ name: '', phone: '', cpfCnpj: '' });
    setValidUntil('');
    setDiscount(0);
    setEstimatedStart('');
    setEstimatedCompletion('');
    setWarranty('90 dias');
    setNotes('');
    setPaymentMethod('PIX');
    setInstallments(1);
  };

  const currentSubtotal = items.reduce((s, i) => s + (i.priceAtTime * i.quantity), 0);
  const currentTotal = currentSubtotal - discount;

  return (
    <div className="space-y-12 animate-fade-in pb-24 px-2 lg:px-0">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-3xl lg:text-4xl font-black text-brand-blue italic tracking-tighter uppercase">Orçamentos</h2>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Elaboração de Propostas Comerciais</p>
        </div>
        {!isCreating && <button onClick={() => setIsCreating(true)} className="btn-brand-blue px-8 py-4 rounded-xl flex items-center gap-2"><Plus size={20}/> CRIAR ORÇAMENTO</button>}
      </div>

      {isCreating ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="nexus-card p-6 border-slate-200 bg-slate-50/50">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><User size={14}/> Dados do Cliente</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input placeholder="NOME OU RAZÃO SOCIAL" value={guestData.name} onChange={e=>setGuestData({...guestData, name: e.target.value})} className="p-4 rounded-xl border border-slate-200 text-slate-900 font-bold text-xs uppercase" />
                <input placeholder="CPF OU CNPJ (OPCIONAL)" value={guestData.cpfCnpj} onChange={e=>setGuestData({...guestData, cpfCnpj: e.target.value})} className="p-4 rounded-xl border border-slate-200 text-slate-900 font-bold text-xs uppercase" />
              </div>
              <input placeholder="TELEFONE / WHATSAPP (DDD + NÚMERO)" value={guestData.phone} onChange={e=>setGuestData({...guestData, phone: e.target.value})} className="w-full p-4 rounded-xl border border-slate-200 text-slate-900 font-bold text-xs mb-4" />
              
              <p className="text-[8px] text-slate-400 font-black mb-4 uppercase text-center tracking-widest">-- OU ESCOLHER CLIENTE CADASTRADO --</p>
              <select value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)} className="w-full p-4 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold text-xs uppercase">
                  <option value="">Selecione um cliente da base...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="nexus-card p-6 border-slate-200">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Itens da Proposta</h4>
              <div className="flex flex-wrap gap-2 mb-6">
                <input placeholder="DESCRIÇÃO DO ITEM / SERVIÇO" value={manualItem.name} onChange={e=>setManualItem({...manualItem, name: e.target.value})} className="flex-1 min-w-[200px] p-4 rounded-xl border border-slate-200 text-slate-900 font-bold text-xs uppercase" />
                <input placeholder="VALOR R$" type="number" value={manualItem.price} onChange={e=>setManualItem({...manualItem, price: e.target.value})} className="w-24 p-4 rounded-xl border border-slate-200 text-slate-900 font-bold text-xs" />
                <button onClick={addManualItem} className="bg-slate-900 text-white px-6 rounded-xl font-bold"><Plus size={20}/></button>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3 mb-6">
                <Search size={18} className="text-slate-300"/>
                <input placeholder="PROCURAR NO CATÁLOGO..." className="bg-transparent flex-1 outline-none text-slate-900 font-bold text-xs uppercase" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-[250px] overflow-y-auto custom-scrollbar">
                {products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(p => (
                  <button key={p.id} onClick={() => addItem(p)} className="p-4 bg-white border border-slate-100 rounded-xl text-left hover:border-brand-orange transition-all shadow-sm">
                     <p className="font-bold text-slate-900 truncate uppercase text-[9px]">{p.name}</p>
                     <p className="text-brand-orange font-black text-[10px] mt-1">R$ {p.price.toFixed(2)}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="nexus-card p-6 border-slate-900 bg-slate-900 text-white">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black uppercase tracking-widest">Revisão e Prazos</h3>
                <button onClick={() => setIsCreating(false)}><X size={20} className="text-slate-500"/></button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-500 uppercase">Validade até</label>
                    <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className="w-full p-3 rounded-lg bg-white/10 border border-white/10 text-white font-bold text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-500 uppercase">Desconto R$</label>
                    <input type="number" value={discount} onChange={e => setDiscount(parseFloat(e.target.value || '0'))} className="w-full p-3 rounded-lg bg-white/10 border border-white/10 text-white font-bold text-xs" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-500 uppercase">Início Previsto</label>
                    <input placeholder="EX: IMEDIATO" value={estimatedStart} onChange={e => setEstimatedStart(e.target.value)} className="w-full p-3 rounded-lg bg-white/10 border border-white/10 text-white font-bold text-xs uppercase" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-500 uppercase">Entrega Prevista</label>
                    <input placeholder="EX: 5 DIAS ÚTEIS" value={estimatedCompletion} onChange={e => setEstimatedCompletion(e.target.value)} className="w-full p-3 rounded-lg bg-white/10 border border-white/10 text-white font-bold text-xs uppercase" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-500 uppercase">Garantia</label>
                    <input value={warranty} onChange={e => setWarranty(e.target.value)} className="w-full p-3 rounded-lg bg-white/10 border border-white/10 text-white font-bold text-xs uppercase" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-500 uppercase">Pagamento</label>
                    <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full p-3 rounded-lg bg-white/10 border border-white/10 text-white font-bold text-xs uppercase">
                      <option>PIX</option>
                      <option>CARTÃO CRÉDITO</option>
                      <option>DINHEIRO</option>
                      <option>BOLETO</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-500 uppercase">Parcelas</label>
                  <input type="number" min="1" max="12" value={installments} onChange={e => setInstallments(parseInt(e.target.value) || 1)} className="w-full p-3 rounded-lg bg-white/10 border border-white/10 text-white font-bold text-xs" />
                </div>

                <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                  {items.map((item, idx) => (
                    <div key={idx} className="bg-white/5 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400 truncate w-32">{item.nameAtTime}</p>
                        <p className="text-xs font-black text-brand-orange">R$ {(item.priceAtTime * item.quantity).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                         <button onClick={() => updateQty(item.productId, -1)} className="p-1.5 bg-white/5 rounded"><Minus size={10}/></button>
                         <span className="text-[10px] font-black">{item.quantity}</span>
                         <button onClick={() => updateQty(item.productId, 1)} className="p-1.5 bg-white/5 rounded"><Plus size={10}/></button>
                         <button onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))} className="ml-2 text-rose-500"><Trash2 size={12}/></button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-white/10">
                   <div className="flex justify-between items-end mb-4">
                      <p className="text-[9px] font-black text-slate-500 uppercase">Total do Orçamento</p>
                      <p className="text-3xl font-black text-brand-orange italic">R$ {currentTotal.toFixed(2)}</p>
                   </div>
                   <button disabled={isProcessing || items.length === 0} onClick={finalize} className="btn-brand-orange w-full py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-3">
                     {isProcessing ? <Loader2 className="animate-spin"/> : <Zap size={18}/>} SALVAR E ENVIAR
                   </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
           {quotes.map(q => {
             const isExpanded = expandedQuoteId === q.id;
             return (
               <div key={q.id} className="nexus-card overflow-hidden border-slate-100">
                  <div onClick={() => setExpandedQuoteId(isExpanded ? null : q.id)} className="p-6 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="text-[8px] font-mono text-slate-400 uppercase tracking-widest">ORÇAMENTO #{q.id.substring(0,8).toUpperCase()} • {q.createdAt?.toDate ? q.createdAt.toDate().toLocaleDateString('pt-BR') : 'Hoje'}</p>
                      <h4 className="text-xl font-bold text-slate-900 uppercase tracking-tight">{q.customerName}</h4>
                      <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Validade: {new Date(q.validUntil).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="flex items-center gap-8">
                       <div className="text-right">
                          <p className="text-[8px] font-black text-slate-400 uppercase">Valor Total</p>
                          <p className="text-2xl font-black text-slate-900 italic">R$ {q.total.toFixed(2)}</p>
                       </div>
                       {isExpanded ? <ChevronUp className="text-slate-300"/> : <ChevronDown className="text-slate-300"/>}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-8 bg-slate-50 border-t border-slate-200 animate-fade-in space-y-8">
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          <div className="space-y-6">
                             <div className="bg-white p-5 rounded-2xl border border-slate-200">
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><User size={14}/> Dados Cliente</h5>
                                <p className="text-slate-900 font-bold text-sm uppercase">{q.customerName}</p>
                                <p className="text-[9px] text-slate-500 font-bold mt-1">{(q as any).guestPhone || 'SEM TELEFONE'}</p>
                                <p className="text-[9px] text-slate-500 uppercase">CPF/CNPJ: {(q as any).guestCpfCnpj || '---'}</p>
                             </div>
                             <div className="bg-white p-5 rounded-2xl border border-slate-200">
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><ShoppingCart size={14}/> Itens Inclusos</h5>
                                <div className="space-y-2">
                                   {q.items.map((item, idx) => (
                                     <div key={idx} className="flex justify-between text-[10px] font-bold border-b border-slate-50 pb-1">
                                        <span className="text-slate-600 truncate w-32">{item.quantity}x {item.nameAtTime}</span>
                                        <span className="text-slate-900">R$ {(item.priceAtTime * item.quantity).toFixed(2)}</span>
                                     </div>
                                   ))}
                                </div>
                             </div>
                          </div>

                          <div className="space-y-6">
                             <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock size={14}/> Prazos e Condições</h5>
                                <div className="grid grid-cols-2 gap-4">
                                   <div><p className="text-[8px] text-slate-400 uppercase">Pagamento</p><p className="text-slate-900 font-bold text-[10px] uppercase">{q.paymentMethod || 'A combinar'} (${q.installments || 1}x)</p></div>
                                   <div><p className="text-[8px] text-slate-400 uppercase">Início</p><p className="text-slate-900 font-bold text-[10px] uppercase">{q.estimatedStart || 'Imediato'}</p></div>
                                   <div><p className="text-[8px] text-slate-400 uppercase">Conclusão</p><p className="text-slate-900 font-bold text-[10px] uppercase">{q.estimatedCompletion || 'A combinar'}</p></div>
                                   <div><p className="text-[8px] text-slate-400 uppercase">Garantia</p><p className="text-slate-900 font-bold text-[10px] uppercase">{q.warranty || '---'}</p></div>
                                </div>
                                {(q.installments && q.installments > 1) && (
                                  <div className="mt-4 pt-4 border-t border-slate-50">
                                    <p className="text-[8px] font-black text-slate-400 uppercase mb-2">Detalhamento das Parcelas:</p>
                                    <div className="space-y-1">
                                      {Array.from({ length: q.installments }).map((_, idx) => {
                                        const d = new Date();
                                        d.setMonth(d.getMonth() + idx);
                                        return (
                                          <div key={idx} className="flex justify-between text-[9px] font-bold text-slate-600">
                                            <span>Parc. {idx+1} ({d.toLocaleDateString('pt-BR')})</span>
                                            <span className="text-slate-900">R$ {(q.total / (q.installments || 1)).toFixed(2)}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                             </div>
                             {q.notes && (
                               <div className="bg-white p-5 rounded-2xl border border-slate-200">
                                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={14}/> Observações</h5>
                                  <p className="text-[10px] text-slate-600 italic leading-relaxed">{q.notes}</p>
                               </div>
                             )}
                          </div>

                          <div className="flex flex-col justify-end gap-3">
                             <button onClick={() => sendWhatsAppQuote(q)} className="w-full flex items-center justify-center gap-3 bg-emerald-500 text-white p-5 rounded-2xl font-black uppercase text-[10px] hover:bg-emerald-400 transition-all shadow-lg">
                                <MessageCircle size={18}/> Enviar Proposta WhatsApp
                             </button>
                             <button onClick={() => downloadQuotePDF(q)} className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white p-5 rounded-2xl font-black uppercase text-[10px] hover:bg-slate-800 transition-all">
                                <Download size={18}/> Baixar Orçamento PDF
                             </button>
                             <button onClick={() => { if(confirm('Excluir este orçamento definitivamente?')) dbService.del('quotes', q.id); }} className="w-full p-4 rounded-xl text-[10px] font-bold uppercase text-rose-500 hover:bg-rose-50 transition-all">
                                <Trash2 size={16} className="mx-auto" />
                             </button>
                          </div>
                       </div>
                    </div>
                  )}
               </div>
             );
           })}
           {quotes.length === 0 && (
             <div className="py-20 text-center flex flex-col items-center">
                <FileText size={48} className="text-slate-100 mb-4" />
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhum orçamento emitido.</p>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default QuotesView;