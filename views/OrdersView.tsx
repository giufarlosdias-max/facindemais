import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingCart, Plus, Minus, Trash2, Search, X, Loader2, Zap, 
  Smartphone, User, ChevronDown, ChevronUp, Printer, 
  MessageCircle, CreditCard, Wallet, AlertCircle, CheckCircle2, Box, Tag, Calendar
} from 'lucide-react';
import { Order, Product, Customer, OrderItem, UserProfile, Installment } from '../types';
import { dbService, Timestamp } from '../services/firebase';

interface OrdersViewProps {
  orders: Order[];
  products: Product[];
  customers: Customer[];
  userId: string;
  profile: UserProfile;
}

const OrdersView: React.FC<OrdersViewProps> = ({ orders, products, customers, userId, profile }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [guestData, setGuestData] = useState({ name: '', phone: '', cpfCnpj: '', address: '' });
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD' | 'CASH' | 'DEFERRED' | 'BOLETO'>('PIX');
  const [installments, setInstallments] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [entryAmount, setEntryAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [warranty, setWarranty] = useState('90 dias');
  const [search, setSearch] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  
  const [manualItem, setManualItem] = useState({ name: '', price: '', qty: '1' });

  useEffect(() => {
    if (selectedCustomerId) {
      const c = customers.find(cust => cust.id === selectedCustomerId);
      if (c) setGuestData({ 
        name: c.name, 
        phone: c.phone || '', 
        cpfCnpj: c.cpfCnpj || '', 
        address: c.address || '' 
      });
    }
  }, [selectedCustomerId, customers]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { 
        productId: product.id, 
        quantity: 1, 
        priceAtTime: product.price, 
        priceCostAtTime: product.priceCost,
        nameAtTime: product.name, 
        type: product.type 
      }];
    });
  };

  const addManualItem = () => {
    if (!manualItem.name || !manualItem.price) return;
    const newItem: OrderItem = {
      productId: `manual-${Date.now()}`,
      quantity: parseInt(manualItem.qty) || 1,
      priceAtTime: parseFloat(manualItem.price),
      priceCostAtTime: 0,
      nameAtTime: manualItem.name.toUpperCase(),
      type: 'SERVICE'
    };
    setCart(prev => [...prev, newItem]);
    setManualItem({ name: '', price: '', qty: '1' });
  };

  const updateCartItemPrice = (productId: string, newPrice: number) => {
    setCart(prev => prev.map(item => item.productId === productId ? { ...item, priceAtTime: newPrice } : item));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.productId !== id));
  };

  const finalize = async () => {
    if (cart.length === 0) return alert('Carrinho vazio.');
    setIsProcessing(true);
    try {
      const subtotal = cart.reduce((acc, curr) => acc + (curr.priceAtTime * curr.quantity), 0);
      const total = subtotal - discount;
      const amountToFinance = total - entryAmount;

      const installmentDetails: Installment[] = Array.from({ length: installments }).map((_, idx) => {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + idx + (paymentMethod === 'DEFERRED' ? 1 : 0));
        return {
          id: `inst-${Date.now()}-${idx}`,
          value: amountToFinance / installments,
          status: paymentMethod === 'DEFERRED' ? 'PENDING' : 'PAID',
          dueDate: Timestamp.fromDate(dueDate)
        };
      });

      const orderData: any = {
        customerId: selectedCustomerId || 'GUEST',
        items: cart,
        subtotal,
        total,
        discount,
        entryAmount,
        status: paymentMethod === 'DEFERRED' ? 'PENDING' : 'PAID',
        paymentMethod,
        installments,
        installmentDetails,
        guestName: guestData.name.toUpperCase() || 'VENDA RÁPIDA',
        guestPhone: guestData.phone,
        guestCpfCnpj: guestData.cpfCnpj,
        guestAddress: guestData.address,
        notes,
        warranty
      };
      
      const userName = profile.fullName || profile.officeName || profile.email;
      const orderRef = await dbService.add('orders', userId, orderData, userName);

      for (const item of cart) {
        if (item.type === 'PRODUCT' && !item.productId.startsWith('manual-')) {
          const product = products.find(p => p.id === item.productId);
          if (product) {
            const newStock = product.stock - item.quantity;
            await dbService.update('products', product.id, { stock: newStock }, userId, userName);
            await dbService.add('stock_movements', userId, {
              productId: product.id,
              type: 'OUT',
              quantity: item.quantity,
              reason: `Venda #${orderRef.id.substring(0,6)}`,
              date: Timestamp.now()
            }, userName);
          }
        }
      }

      if (entryAmount > 0 || paymentMethod !== 'DEFERRED') {
        await dbService.add('finances', userId, {
          type: 'INCOME',
          date: new Date().toISOString().split('T')[0],
          description: `Recebimento Venda #${orderRef.id.substring(0,6)}`,
          contactName: orderData.guestName,
          category: 'Vendas',
          amount: paymentMethod === 'DEFERRED' ? entryAmount : total,
          paymentMethod,
          status: 'RECEIVED'
        }, userName);
      }

      setCart([]);
      setIsCreating(false);
      alert("Venda Finalizada e Integrada com Sucesso!");
    } catch (e) { 
      console.error(e);
      alert('Falha ao processar venda.'); 
    } finally { 
      setIsProcessing(false); 
    }
  };

  const currentSubtotal = cart.reduce((s, i) => s + (i.priceAtTime * i.quantity), 0);
  const currentTotal = currentSubtotal - discount;

  return (
    <div className="space-y-8 animate-fade pb-20 px-2 lg:px-0">
      <header className="flex justify-between items-end">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Terminal PdV</p>
          <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase">Vendas & Saídas</h2>
        </div>
        {!isCreating && (
          <button onClick={() => setIsCreating(true)} className="btn-brand-orange px-8 py-4 rounded-2xl flex items-center gap-2 shadow-xl shadow-brand-orange/20">
            <Plus size={20}/> NOVA VENDA
          </button>
        )}
      </header>

      {isCreating ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="nexus-card p-6 border-slate-200 bg-white">
               <div className="flex justify-between items-center mb-6">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Box size={14}/> Catálogo de Itens</h4>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Selecione produtos do estoque ou adicione manualmente</span>
               </div>
               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-inner flex items-center gap-4 mb-4">
                  <Search size={20} className="text-slate-300"/>
                  <input 
                    placeholder="Pesquisar no estoque (Nome, SKU...)" 
                    className="bg-transparent flex-1 outline-none text-sm font-bold uppercase text-slate-700"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
               </div>
               <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto custom-scrollbar pr-2 mb-6">
                  {products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(p => (
                    <button key={p.id} onClick={() => addToCart(p)} className="p-3 bg-white border border-slate-100 rounded-xl text-left hover:border-brand-orange transition-all shadow-sm group">
                       <div className="flex justify-between items-start mb-1">
                          <p className="text-[8px] font-black text-slate-400 uppercase truncate">{p.category || 'Geral'}</p>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${p.stock > 0 ? 'bg-brand-green/10 text-brand-green' : 'bg-rose-50 text-rose-600'}`}>{p.stock} UN</span>
                       </div>
                       <p className="text-[10px] font-black text-brand-blue uppercase truncate leading-tight h-8">{p.name}</p>
                       <p className="text-brand-orange font-black text-xs mt-1">R$ {p.price.toFixed(2)}</p>
                    </button>
                  ))}
               </div>
               <div className="pt-6 border-t border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-4 tracking-widest">Adição Manual (Itens fora do sistema)</p>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                     <input placeholder="DESCRIÇÃO DO ITEM" value={manualItem.name} onChange={e=>setManualItem({...manualItem, name: e.target.value})} className="md:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold uppercase" />
                     <input placeholder="PREÇO R$" type="number" value={manualItem.price} onChange={e=>setManualItem({...manualItem, price: e.target.value})} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold" />
                     <button onClick={addManualItem} className="bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase hover:bg-slate-800 transition-all py-3">Incluir Item</button>
                  </div>
               </div>
            </div>

            <div className="nexus-card p-6 bg-slate-50 border-slate-200">
               <div className="flex justify-between items-center mb-6">
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><ShoppingCart size={14}/> Carrinho da Venda</h4>
                 <div className="text-[9px] font-bold text-slate-400 uppercase">Altere preços e quantidades diretamente abaixo</div>
               </div>
               <div className="space-y-3 mb-4">
                  {cart.map(item => (
                    <div key={item.productId} className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm gap-4">
                       <div className="flex-1 w-full">
                         <p className="text-[10px] font-black text-slate-900 uppercase">{item.nameAtTime}</p>
                         <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">{item.type === 'PRODUCT' ? 'PRODUTO EM ESTOQUE' : 'ITEM AVULSO / SERVIÇO'}</p>
                       </div>
                       <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-end">
                          <div className="space-y-1">
                             <p className="text-[7px] font-black text-slate-400 uppercase text-right">Preço Unit. (R$)</p>
                             <input 
                               type="number" 
                               value={item.priceAtTime} 
                               onChange={e => updateCartItemPrice(item.productId, parseFloat(e.target.value) || 0)}
                               className="w-24 p-2 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-black text-right text-brand-orange outline-none"
                             />
                          </div>
                          <div className="space-y-1">
                             <p className="text-[7px] font-black text-slate-400 uppercase text-center">Quantidade</p>
                             <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-200">
                                <button onClick={() => setCart(c => c.map(i => i.productId === item.productId ? {...i, quantity: Math.max(1, i.quantity - 1)} : i))} className="p-1 hover:text-brand-orange"><Minus size={12}/></button>
                                <span className="px-3 font-black text-xs min-w-[30px] text-center">{item.quantity}</span>
                                <button onClick={() => setCart(c => c.map(i => i.productId === item.productId ? {...i, quantity: i.quantity + 1} : i))} className="p-1 hover:text-brand-orange"><Plus size={12}/></button>
                             </div>
                          </div>
                          <div className="space-y-1 text-right min-w-[80px]">
                             <p className="text-[7px] font-black text-slate-400 uppercase">Subtotal</p>
                             <p className="text-xs font-black text-slate-900">R$ {(item.priceAtTime * item.quantity).toFixed(2)}</p>
                          </div>
                          <button onClick={() => removeFromCart(item.productId)} className="text-slate-300 hover:text-rose-500 transition-colors p-2"><Trash2 size={16}/></button>
                       </div>
                    </div>
                  ))}
                  {cart.length === 0 && <div className="py-12 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest border-2 border-dashed border-slate-200 rounded-2xl">Aguardando inserção de itens...</div>}
               </div>
            </div>

            <div className="nexus-card p-6 border-slate-200">
               <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2"><User size={14}/> Identificação do Cliente</h4>
               <div className="space-y-4">
                  <select 
                    value={selectedCustomerId} 
                    onChange={e => setSelectedCustomerId(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold uppercase outline-none focus:border-brand-orange"
                  >
                    <option value="">-- SELECIONAR CLIENTE CADASTRADO --</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input placeholder="NOME DO CLIENTE" value={guestData.name} onChange={e=>setGuestData({...guestData, name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase" />
                    <input placeholder="WHATSAPP / TELEFONE" value={guestData.phone} onChange={e=>setGuestData({...guestData, phone: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase" />
                  </div>
               </div>
            </div>
          </div>

          <div className="space-y-6">
             <div className="nexus-card p-8 bg-brand-blue text-white border-brand-blue shadow-2xl">
                <h3 className="text-xs font-black uppercase tracking-widest mb-8 text-brand-orange flex items-center gap-2"><CreditCard size={16}/> Checkout Financeiro</h3>
                <div className="space-y-6">
                   <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Forma de Recebimento</label>
                      <select value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value as any)} className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-sm font-bold uppercase outline-none focus:border-brand-orange">
                         <option value="PIX">PIX (À Vista)</option>
                         <option value="CASH">DINHEIRO (À Vista)</option>
                         <option value="CREDIT_CARD">CARTÃO (À Vista)</option>
                         <option value="DEFERRED">CREDIÁRIO (PARCELADO)</option>
                         <option value="BOLETO">BOLETO BANCÁRIO</option>
                      </select>
                   </div>
                   {paymentMethod === 'DEFERRED' && (
                     <div className="grid grid-cols-2 gap-4 animate-fade">
                        <div className="space-y-1">
                           <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Qtd Parcelas</label>
                           <input type="number" value={installments} onChange={e=>setInstallments(parseInt(e.target.value))} className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-sm font-bold" />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Entrada R$</label>
                           <input type="number" value={entryAmount} onChange={e=>setEntryAmount(parseFloat(e.target.value || '0'))} className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-sm font-bold" />
                        </div>
                     </div>
                   )}
                   <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Desconto Global R$</label>
                      <input type="number" value={discount} onChange={e=>setDiscount(parseFloat(e.target.value || '0'))} className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-sm font-bold" />
                   </div>
                   <div className="pt-6 border-t border-white/10 space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500"><span>Subtotal Itens</span><span>R$ {currentSubtotal.toFixed(2)}</span></div>
                      <div className="flex justify-between text-[10px] font-bold uppercase text-rose-400"><span>Desconto (-)</span><span>R$ {discount.toFixed(2)}</span></div>
                      <div className="flex justify-between items-end pt-4">
                         <span className="text-xs font-black uppercase tracking-widest">Valor Final</span>
                         <span className="text-3xl font-black italic tracking-tighter text-brand-orange">R$ {currentTotal.toFixed(2)}</span>
                      </div>
                   </div>
                   <button 
                     disabled={isProcessing || cart.length === 0}
                     onClick={finalize}
                     className="w-full btn-brand-orange py-6 rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-brand-orange/20 active:scale-95 transition-all"
                   >
                     {isProcessing ? <Loader2 className="animate-spin" size={24}/> : <CheckCircle2 size={24}/>} 
                     CONCLUIR VENDA
                   </button>
                </div>
             </div>
             <div className="nexus-card p-6 border-slate-200">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-2 ml-1">Garantia e Observações</p>
                <textarea 
                  placeholder="EX: GARANTIA DE 90 DIAS CONTRA DEFEITOS..." 
                  value={notes}
                  onChange={e=>setNotes(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold uppercase h-24 resize-none focus:border-brand-orange outline-none"
                />
             </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
           {orders.map(o => {
             const isExp = expandedOrderId === o.id;
             const overdue = o.installmentDetails?.some(i => i.status === 'PENDING' && i.dueDate?.toDate() < new Date());
             return (
               <div key={o.id} className="nexus-card overflow-hidden group border-slate-100">
                  <div 
                    onClick={() => setExpandedOrderId(isExp ? null : o.id)}
                    className="p-6 flex flex-col md:flex-row justify-between items-center cursor-pointer hover:bg-brand-blue/5 transition-colors"
                  >
                     <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${o.status === 'PAID' ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-orange/10 text-brand-orange'}`}>
                           <ShoppingCart size={28}/>
                        </div>
                        <div>
                           <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">VENDA #{o.id.substring(0,8).toUpperCase()} • {o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString('pt-BR') : 'Agora'}</p>
                           <h4 className="text-xl font-black text-brand-blue italic tracking-tight uppercase">{o.guestName}</h4>
                           <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${o.status === 'PAID' ? 'bg-brand-green text-white' : 'bg-brand-orange text-white'}`}>{o.status === 'PAID' ? 'PAGO' : 'EM ABERTO'}</span>
                              {overdue && <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-rose-500 text-white animate-pulse">Atrasado</span>}
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-8 mt-4 md:mt-0">
                        <div className="text-right">
                           <p className="text-[9px] font-black text-slate-400 uppercase">Faturamento</p>
                           <p className="text-2xl font-black text-brand-blue italic">R$ {o.total.toFixed(2)}</p>
                        </div>
                        {isExp ? <ChevronUp className="text-brand-blue/30"/> : <ChevronDown className="text-brand-blue/30"/>}
                     </div>
                  </div>

                  {isExp && (
                    <div className="p-8 bg-slate-50 border-t border-slate-200 animate-fade space-y-8">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                             <h5 className="text-[10px] font-black text-brand-orange uppercase tracking-widest flex items-center gap-2"><CreditCard size={14}/> Cronograma de Recebimento (Parcelas uma a uma)</h5>
                             <div className="space-y-2">
                                {o.installmentDetails?.map((inst, idx) => (
                                  <div key={inst.id} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center group/inst">
                                     <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-100">{idx + 1}</div>
                                        <div>
                                           <p className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-1.5"><Calendar size={10}/> Vencimento: {inst.dueDate?.toDate().toLocaleDateString('pt-BR')}</p>
                                           <p className="text-sm font-black text-brand-blue">R$ {inst.value.toFixed(2)}</p>
                                        </div>
                                     </div>
                                     <div className="flex gap-2">
                                        {inst.status === 'PENDING' && (
                                          <button 
                                            onClick={() => {
                                              const phone = o.guestPhone?.replace(/\D/g, '');
                                              const msg = encodeURIComponent(`Olá ${o.guestName}! Passando para lembrar de sua parcela ${idx+1} de R$ ${inst.value.toFixed(2)} que vence em ${inst.dueDate?.toDate().toLocaleDateString('pt-BR')}.`);
                                              window.open(`https://wa.me/55${phone}?text=${msg}`, '_blank');
                                            }}
                                            className="p-2 text-brand-green bg-brand-green/10 rounded-lg hover:bg-brand-green hover:text-white transition-all"
                                            title="Cobrar via WhatsApp"
                                          >
                                            <MessageCircle size={16}/>
                                          </button>
                                        )}
                                        <button 
                                          onClick={async () => {
                                            const userName = profile.fullName || profile.officeName || profile.email;
                                            const newDetails = o.installmentDetails?.map(i => i.id === inst.id ? {...i, status: i.status === 'PAID' ? 'PENDING' : 'PAID'} : i);
                                            const allPaid = newDetails?.every(i => i.status === 'PAID');
                                            await dbService.update('orders', o.id, { installmentDetails: newDetails, status: allPaid ? 'PAID' : 'PENDING' }, userId, userName);
                                          }}
                                          className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase transition-all ${inst.status === 'PAID' ? 'bg-brand-green text-white' : 'bg-slate-100 text-slate-400'}`}
                                        >
                                          {inst.status === 'PAID' ? 'RECEBIDO' : 'CONFIRMAR'}
                                        </button>
                                     </div>
                                  </div>
                                ))}
                                {(!o.installmentDetails || o.installmentDetails.length === 0) && (
                                  <div className="p-4 text-center border border-dashed border-slate-200 rounded-xl text-[9px] font-bold text-slate-400 uppercase">Venda integral à vista.</div>
                                )}
                             </div>
                          </div>

                          <div className="space-y-4">
                             <h5 className="text-[10px] font-black text-brand-orange uppercase tracking-widest flex items-center gap-2"><CheckCircle2 size={14}/> Resumo da Operação</h5>
                             <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                                {o.items.map((item, i) => (
                                  <div key={i} className="flex justify-between border-b border-slate-50 pb-2">
                                     <span className="text-xs font-bold text-slate-600">{item.quantity}x {item.nameAtTime}</span>
                                     <span className="text-xs font-black text-brand-blue">R$ {(item.priceAtTime * item.quantity).toFixed(2)}</span>
                                  </div>
                                ))}
                                <div className="pt-2">
                                   <p className="text-[10px] text-slate-400 font-medium uppercase italic"><strong>Notas:</strong> {o.notes || 'Sem observações.'}</p>
                                </div>
                             </div>
                             <button onClick={() => { if(confirm('Excluir definitivo?')) dbService.del('orders', o.id); }} className="w-full py-4 bg-rose-50 text-rose-500 rounded-xl font-black text-[10px] uppercase hover:bg-rose-500 hover:text-white transition-all">Excluir Registro de Venda</button>
                          </div>
                       </div>
                    </div>
                  )}
               </div>
             );
           })}
           {orders.length === 0 && <div className="py-24 text-center border-2 border-dashed border-slate-100 rounded-[3rem] text-slate-300 font-bold uppercase text-[10px] tracking-[0.4em]">Aguardando Fluxo de Vendas</div>}
        </div>
      )}
    </div>
  );
};

export default OrdersView;