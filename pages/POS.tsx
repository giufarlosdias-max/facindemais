
import React, { useState } from 'react';
import { Product, Sale, User, Installment } from '../types';
import { ShoppingBag, Plus, Minus, Trash2, Tag, MessageCircle, AlertTriangle } from 'lucide-react';

interface POSProps {
  products: Product[];
  onSale: (sale: Sale) => void;
  currentUser: User;
}

const POS: React.FC<POSProps> = ({ products, onSale, currentUser }) => {
  const [cart, setCart] = useState<{ productId?: string; name: string; quantity: number; price: number }[]>([]);
  const [adhoc, setAdhoc] = useState({ name: '', price: '' });
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CREDIT'>('CASH');
  const [installmentsCount, setInstallmentsCount] = useState(1);

  const total = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);

  const addProductToCart = (p: Product) => {
    const existing = cart.find(item => item.productId === p.id);
    if (p.stock <= 0) return alert("ITEM SEM ESTOQUE NO ALMOXARIFADO.");
    
    if (existing) {
      if (existing.quantity >= p.stock) return alert("LIMITE DE ESTOQUE ATINGIDO.");
      setCart(cart.map(item => item.productId === p.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { productId: p.id, name: p.name, price: p.price, quantity: 1 }]);
    }
  };

  const addAdhoc = () => {
    if (!adhoc.name || !adhoc.price) return;
    setCart([...cart, { name: adhoc.name.toUpperCase(), price: Number(adhoc.price), quantity: 1 }]);
    setAdhoc({ name: '', price: '' });
  };

  const updateQuantity = (index: number, delta: number) => {
    const newCart = [...cart];
    const item = newCart[index];
    
    if (item.productId) {
      const p = products.find(prod => prod.id === item.productId);
      if (p && delta > 0 && item.quantity >= p.stock) return alert("LIMITE DE ESTOQUE.");
    }

    item.quantity += delta;
    if (item.quantity <= 0) {
      newCart.splice(index, 1);
    }
    setCart(newCart);
  };

  const handleSale = () => {
    if (cart.length === 0 || !customer.phone) return;
    
    const saleId = 'NF-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    const saleDate = new Date();
    
    let installments: Installment[] = [];
    let remainingBalance = 0;
    let status: 'PAID' | 'PENDING' = 'PAID';

    if (paymentMethod === 'CREDIT') {
      status = 'PENDING';
      remainingBalance = total;
      const amountPerInstallment = total / installmentsCount;
      for (let i = 1; i <= installmentsCount; i++) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + i);
        installments.push({
          number: i,
          amount: amountPerInstallment,
          dueDate: dueDate.toISOString(),
          status: 'PENDING'
        });
      }
    }

    const newSale: Sale = {
      id: saleId,
      date: saleDate.toISOString(),
      items: cart,
      total,
      paymentStatus: status,
      paymentMethod: paymentMethod,
      customerName: customer.name || 'CLIENTE NEXUS',
      customerPhone: customer.phone,
      sellerName: currentUser.name,
      sellerOffice: currentUser.officeName || 'Central',
      remainingBalance: remainingBalance,
      installments: installments
    };

    onSale(newSale);

    // Envio Automático da Nota Fiscal via WhatsApp
    const itemLines = cart.map(i => `▫️ *${i.name}* (x${i.quantity}) - R$ ${(i.quantity * i.price).toFixed(2)}`).join('%0A');
    const paymentMsg = paymentMethod === 'CASH' ? `✅ *PAGAMENTO:* À VISTA` : `⏳ *PAGAMENTO:* CRÉDITO (${installmentsCount}X)`;

    const message = `🚀 *RECIBO DIGITAL NEXUS OS*%0A%0A` +
      `🆔 *NOTA:* ${saleId}%0A` +
      `🏢 *EMISSOR:* ${currentUser.officeName || 'FACINDEMAIS'}%0A` +
      `👤 *CLIENTE:* ${newSale.customerName}%0A%0A` +
      `📦 *ATIVOS:*%0A${itemLines}%0A%0A` +
      `💰 *VALOR TOTAL:* R$ ${total.toFixed(2)}%0A` +
      `${paymentMsg}%0A%0A` +
      `🤝 _Obrigado pela preferência! Sincronizado com o ecossistema Nexus._`;
    
    const cleanPhone = customer.phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');

    setCart([]);
    setCustomer({ name: '', phone: '' });
    setPaymentMethod('CASH');
    setInstallmentsCount(1);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-32 animate-in fade-in">
      <div className="lg:col-span-8 space-y-8">
        <header className="flex justify-between items-center">
          <h2 className="text-2xl font-black font-orbitron text-white uppercase tracking-widest">Terminal de <span className="text-cyber-neon">Vendas</span></h2>
          <div className="px-4 py-2 bg-cyber-neon/10 border border-cyber-neon/30 rounded-full">
            <p className="text-[8px] text-cyber-neon font-black uppercase tracking-widest">Sessão: {currentUser.name}</p>
          </div>
        </header>
        
        <div className="glass p-8 rounded-3xl border border-white/5 space-y-6 bg-black/40">
           <h3 className="text-[10px] font-orbitron font-black text-cyber-neon uppercase tracking-widest flex items-center gap-2"><Tag size={16}/> Item Manual / Rápido</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input placeholder="Descrição" value={adhoc.name} onChange={e => setAdhoc({...adhoc, name: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-cyber-neon outline-none" />
              <input type="number" placeholder="Preço R$" value={adhoc.price} onChange={e => setAdhoc({...adhoc, price: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-cyber-neon outline-none" />
              <button onClick={addAdhoc} className="bg-cyber-neon text-black rounded-xl font-black font-orbitron text-[10px] uppercase shadow-neon-cyan h-[54px] hover:scale-105 transition-all">INJETAR NO CARRINHO</button>
           </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {products.map(p => (
            <button key={p.id} onClick={() => addProductToCart(p)} className={`glass p-6 rounded-2xl border transition-all text-left bg-black/40 shadow-sm group relative ${p.stock <= 0 ? 'opacity-40 cursor-not-allowed border-red-500/20' : 'hover:border-cyber-neon border-white/5'}`}>
              {p.stock <= 3 && p.stock > 0 && <AlertTriangle size={14} className="absolute top-2 right-2 text-cyber-yellow animate-pulse" />}
              <h4 className="font-bold text-white text-[10px] uppercase truncate group-hover:text-cyber-neon">{p.name}</h4>
              <p className="text-cyber-neon font-black mt-2 text-sm">R$ {p.price.toFixed(2)}</p>
              <div className="flex justify-between items-center mt-3">
                 <p className={`text-[8px] uppercase ${p.stock <= 0 ? 'text-red-500 font-black' : 'text-gray-500'}`}>
                    {p.stock <= 0 ? 'ESGOTADO' : `ESTOQUE: ${p.stock}`}
                 </p>
                 <Plus size={14} className="text-gray-600 group-hover:text-cyber-neon transition-colors" />
              </div>
            </button>
          ))}
          {products.length === 0 && <div className="col-span-full py-20 text-center opacity-20 uppercase font-orbitron text-xs tracking-widest">Aguardando Sincronização de Ativos</div>}
        </div>
      </div>

      <div className="lg:col-span-4">
        <div className="glass rounded-3xl border border-white/10 flex flex-col h-full sticky top-10 overflow-hidden shadow-neon-cyan bg-black/60">
           <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40">
              <h3 className="text-xs font-orbitron font-black uppercase text-white">ITENS DO CHECK-OUT</h3>
              <button onClick={() => setCart([])} className="text-[10px] text-red-500 font-black uppercase hover:scale-110 transition-transform">Zerar</button>
           </div>
           
           <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[400px]">
              {cart.map((item, idx) => (
                <div key={idx} className="bg-white/5 p-4 rounded-xl flex justify-between items-center border border-white/5 animate-in slide-in-from-right">
                   <div className="flex-1 min-w-0 mr-4">
                     <p className="text-[10px] font-black uppercase text-white truncate">{item.name}</p>
                     <p className="text-[9px] text-cyber-neon">R$ {item.price.toFixed(2)}</p>
                   </div>
                   <div className="flex items-center gap-3 bg-black/40 rounded-lg p-1 border border-white/5">
                     <button onClick={() => updateQuantity(idx, -1)} className="text-gray-400 hover:text-white p-1"><Minus size={14}/></button>
                     <span className="text-xs text-white font-bold w-6 text-center">{item.quantity}</span>
                     <button onClick={() => updateQuantity(idx, 1)} className="text-gray-400 hover:text-white p-1"><Plus size={14}/></button>
                   </div>
                </div>
              ))}
              {cart.length === 0 && <div className="text-center py-20 opacity-20"><ShoppingBag className="mx-auto mb-2" size={32}/><p className="text-[10px] uppercase tracking-widest">Carrinho Vazio</p></div>}
           </div>

           <div className="p-6 border-t border-white/10 space-y-4 bg-black/40">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[8px] text-gray-500 font-orbitron uppercase tracking-widest ml-1">Vincular Cliente</label>
                  <input placeholder="Nome" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-cyber-neon" />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] text-gray-500 font-orbitron uppercase tracking-widest ml-1">WhatsApp Destinatário</label>
                  <input placeholder="Ex: 11999999999" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-cyber-neon" />
                </div>
                
                <div className="flex gap-2">
                  <button onClick={() => setPaymentMethod('CASH')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${paymentMethod === 'CASH' ? 'bg-cyber-neon text-black border-cyber-neon shadow-neon-cyan' : 'text-gray-500 border-white/10'}`}>À Vista</button>
                  <button onClick={() => setPaymentMethod('CREDIT')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${paymentMethod === 'CREDIT' ? 'bg-cyber-pink text-white border-cyber-pink shadow-neon-pink' : 'text-gray-500 border-white/10'}`}>Parcelado</button>
                </div>

                {paymentMethod === 'CREDIT' && (
                  <div className="flex items-center justify-between bg-black/60 p-3 rounded-xl border border-cyber-pink/20 animate-in slide-in-from-top">
                    <span className="text-[9px] text-gray-500 uppercase">Ciclos Mensais</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setInstallmentsCount(Math.max(1, installmentsCount - 1))} className="text-cyber-pink p-1"><Minus size={14}/></button>
                      <span className="text-xs text-white font-black">{installmentsCount}x</span>
                      <button onClick={() => setInstallmentsCount(installmentsCount + 1)} className="text-cyber-pink p-1"><Plus size={14}/></button>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <div className="flex justify-between items-end mb-4">
                   <span className="text-[10px] text-gray-500 uppercase tracking-widest">Montante Final</span>
                   <span className="text-3xl font-black text-cyber-neon digital-font">R$ {total.toFixed(2)}</span>
                </div>
                <button onClick={handleSale} disabled={cart.length === 0 || !customer.phone} className="w-full bg-gradient-to-r from-cyber-neon to-cyber-purple text-white py-5 rounded-2xl font-black uppercase text-[10px] shadow-neon-cyan disabled:opacity-20 active:scale-95 transition-all flex items-center justify-center gap-3">
                  <MessageCircle size={18}/> TRANSMITIR NOTA DIGITAL
                </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default POS;
