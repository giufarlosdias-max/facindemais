import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, Package, Search, Loader2, Upload, Share2, X, 
  Image as ImageIcon, Smartphone, AlertTriangle, TrendingUp, 
  History, ArrowUpRight, ArrowDownRight, Tag, Box, BarChart3, Edit3
} from 'lucide-react';
import { dbService, Timestamp } from '../services/firebase';
import { Product, StockMovement, UserProfile } from '../types';

const ProductsView: React.FC<{userId: string, profile: UserProfile}> = ({ userId, profile }) => {
  const [items, setItems] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<'LIST' | 'ALERTS' | 'HISTORY'>('LIST');

  const initialForm = {
    sku: '',
    name: '',
    category: 'Geral',
    brand: '',
    supplier: '',
    description: '',
    imageUrl: '',
    priceCost: '',
    price: '',
    stock: '0',
    minStock: '5',
    type: 'PRODUCT' as const
  };

  const [formData, setFormData] = useState(initialForm);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubProducts = dbService.sync('products', userId, (data) => {
      setItems(data as Product[]);
      setLoading(false);
    });
    const unsubMovements = dbService.sync('stock_movements', userId, (data) => {
      setMovements(data as StockMovement[]);
    });
    return () => { unsubProducts(); unsubMovements(); };
  }, [userId]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, imageUrl: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const addOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;

    const payload = {
      ...formData,
      priceCost: parseFloat(formData.priceCost || '0'),
      price: parseFloat(formData.price || '0'),
      stock: parseInt(formData.stock || '0'),
      minStock: parseInt(formData.minStock || '0')
    };

    const userName = profile.fullName || profile.officeName || profile.email;

    if (viewingProduct) {
      await dbService.update('products', viewingProduct.id, payload, userId, userName);
    } else {
      const docRef = await dbService.add('products', userId, payload, userName);
      // Registro de Entrada Inicial
      await dbService.add('stock_movements', userId, {
        productId: docRef.id,
        type: 'IN',
        quantity: payload.stock,
        reason: 'Cadastro Inicial',
        date: Timestamp.now()
      }, userName);
    }

    setFormData(initialForm);
    setIsModalOpen(false);
    setViewingProduct(null);
  };

  const handleQuickAdjustment = async (p: Product, type: 'IN' | 'OUT', qty: number, reason: string) => {
    const newStock = type === 'IN' ? p.stock + qty : p.stock - qty;
    const userName = profile.fullName || profile.officeName || profile.email;
    await dbService.update('products', p.id, { stock: newStock }, userId, userName);
    await dbService.add('stock_movements', userId, {
      productId: p.id,
      type,
      quantity: qty,
      reason,
      date: Timestamp.now()
    }, userName);
  };

  const filtered = items.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const alerts = items.filter(p => p.stock <= p.minStock);

  const getMargin = (cost: number, sale: number) => {
    if (!cost || cost === 0) return 100;
    return ((sale - cost) / cost) * 100;
  };

  return (
    <div className="space-y-10 animate-fade pb-24 px-2 lg:px-0">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Logística & Inventário</p>
          <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase">NEXUS Stock Terminal</h2>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button onClick={() => setActiveTab('LIST')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'LIST' ? 'bg-white text-orange-500 shadow-sm' : 'text-slate-400'}`}>Estoque</button>
          <button onClick={() => setActiveTab('ALERTS')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ALERTS' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-400'}`}>
            Alertas {alerts.length > 0 && `(${alerts.length})`}
          </button>
          <button onClick={() => setActiveTab('HISTORY')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'HISTORY' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Movimentações</button>
        </div>
      </header>

      {activeTab === 'LIST' && (
        <div className="space-y-8 animate-fade">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 focus-within:border-orange-500 transition-all w-full shadow-sm">
              <Search className="text-slate-300" size={20} />
              <input 
                placeholder="Buscar por Nome, SKU ou Categoria..." 
                className="bg-transparent flex-1 outline-none text-slate-900 font-bold text-sm uppercase"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={() => setIsModalOpen(true)} className="w-full md:w-auto btn-orange px-10 py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-3">
              <Plus size={20} /> NOVO PRODUTO
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading ? <div className="col-span-full py-20 flex justify-center"><Loader2 className="animate-spin text-orange-500" size={40} /></div> : 
              filtered.map(p => {
                const margin = getMargin(p.priceCost, p.price);
                const isLow = p.stock <= p.minStock;
                return (
                  <div key={p.id} className={`nexus-card overflow-hidden group border-slate-100 flex flex-col ${isLow ? 'bg-rose-50/20 border-rose-200' : 'bg-white'}`}>
                    <div className="h-44 bg-slate-50 relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <ImageIcon size={48} className="text-slate-200" />
                      )}
                      <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => { setViewingProduct(p); setFormData({ ...p, priceCost: p.priceCost.toString(), price: p.price.toString(), stock: p.stock.toString(), minStock: p.minStock.toString() } as any); setIsModalOpen(true); }} className="p-2 bg-white text-slate-900 rounded-lg shadow-xl hover:text-orange-500"><Edit3 size={16}/></button>
                        <button onClick={() => { if(confirm('Excluir definitivo?')) dbService.del('products', p.id); }} className="p-2 bg-rose-500 text-white rounded-lg shadow-xl hover:bg-rose-600"><Trash2 size={16}/></button>
                      </div>
                      <div className="absolute bottom-3 left-3 flex gap-2">
                        {isLow && <span className="bg-rose-500 text-white px-2 py-0.5 rounded text-[7px] font-black uppercase flex items-center gap-1 shadow-lg shadow-rose-500/20"><AlertTriangle size={10}/> Baixo Estoque</span>}
                        {margin > 50 && <span className="bg-emerald-500 text-white px-2 py-0.5 rounded text-[7px] font-black uppercase shadow-lg shadow-emerald-500/20">Lucrativo</span>}
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{p.sku || 'N/A'} • {p.category}</p>
                        <h3 className="text-sm font-black text-slate-900 uppercase italic truncate mt-0.5">{p.name}</h3>
                      </div>

                      <div className="flex justify-between items-end border-t border-slate-50 pt-4">
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-slate-400 uppercase">Preço Venda</p>
                          <p className="text-lg font-black text-slate-900 italic tracking-tighter">R$ {p.price.toFixed(2)}</p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-[8px] font-black text-slate-400 uppercase">Qtd Real</p>
                          <div className="flex items-center gap-2 justify-end">
                            <button onClick={() => handleQuickAdjustment(p, 'OUT', 1, 'Ajuste Rápido')} className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-rose-100 hover:text-rose-500">-</button>
                            <span className={`text-sm font-black ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>{p.stock}</span>
                            <button onClick={() => handleQuickAdjustment(p, 'IN', 1, 'Ajuste Rápido')} className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-emerald-100 hover:text-emerald-500">+</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>
      )}

      {activeTab === 'ALERTS' && (
        <div className="space-y-6 animate-fade">
          <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2rem] flex items-center gap-6">
            <div className="w-16 h-16 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20"><AlertTriangle size={32}/></div>
            <div>
              <h3 className="text-xl font-black text-rose-900 uppercase italic">Protocolo de Reposição</h3>
              <p className="text-[10px] text-rose-600 font-bold uppercase tracking-widest">Estes itens atingiram o nível crítico de segurança configurado.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {alerts.map(p => (
               <div key={p.id} className="nexus-card p-6 bg-white border-rose-100 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300">
                       {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover rounded-xl"/> : <Package size={20}/>}
                    </div>
                    <div>
                       <h4 className="font-black text-slate-900 uppercase text-xs">{p.name}</h4>
                       <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Fornecedor: {p.supplier || 'N/A'}</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="text-[9px] font-black text-rose-500 uppercase mb-1">Status Crítico</p>
                    <p className="text-xl font-black text-slate-900">{p.stock} <span className="text-[10px] text-slate-400">/ {p.minStock} MIN</span></p>
                 </div>
               </div>
             ))}
             {alerts.length === 0 && <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 rounded-2xl text-slate-300 font-bold uppercase text-[10px] tracking-[0.3em]">Nenhum alerta de estoque pendente.</div>}
          </div>
        </div>
      )}

      {activeTab === 'HISTORY' && (
        <div className="nexus-card bg-white border-slate-100 overflow-hidden animate-fade">
           <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Data / Hora</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Operação</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Produto</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Qtd</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {movements.map(m => {
                  const product = items.find(p => p.id === m.productId);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-[10px] font-bold text-slate-500">
                        {m.date?.toDate ? m.date.toDate().toLocaleString('pt-BR') : '---'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${m.type === 'IN' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {m.type === 'IN' ? 'ENTRADA' : 'SAÍDA'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[10px] font-black text-slate-900 uppercase">
                        {product?.name || 'Item Excluído'}
                      </td>
                      <td className="px-6 py-4 text-[10px] font-black text-slate-900">
                        {m.quantity} UN
                      </td>
                      <td className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase text-right">
                        {m.reason}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
           </table>
           {movements.length === 0 && <div className="py-20 text-center text-slate-300 font-bold uppercase text-[10px] tracking-[0.3em]">Nenhum registro de movimentação.</div>}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="nexus-card w-full max-w-4xl p-10 bg-white border-orange-500/30 my-auto animate-fade">
            <div className="flex justify-between items-center mb-10 border-b border-slate-100 pb-4">
              <h3 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter flex items-center gap-3">
                <Box className="text-orange-500" /> {viewingProduct ? 'Editor de Produto' : 'Novo Item NEXUS'}
              </h3>
              <button onClick={() => { setIsModalOpen(false); setViewingProduct(null); setFormData(initialForm); }} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><X size={28} /></button>
            </div>
            
            <form onSubmit={addOrUpdate} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="space-y-6">
                  <div className="w-full aspect-square bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group">
                    {formData.imageUrl ? (
                      <>
                        <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setFormData({...formData, imageUrl: ''})} className="absolute top-4 right-4 p-2 bg-rose-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-xl"><X size={16}/></button>
                      </>
                    ) : (
                      <>
                        <ImageIcon size={40} className="text-slate-200 mb-2"/>
                        <label className="cursor-pointer text-[9px] font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-5 py-3 rounded-xl border border-orange-100 hover:bg-orange-100 transition-all">
                          UPLOAD FOTO
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                      </>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Código SKU / EAN</label>
                    <input value={formData.sku} onChange={e=>setFormData({...formData, sku: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase outline-none focus:border-orange-500 transition-all" placeholder="EX: NX-001" />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Nome do Produto</label>
                      <input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase outline-none focus:border-orange-500" placeholder="DESCRIÇÃO COMERCIAL" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Categoria</label>
                      <input value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase outline-none focus:border-orange-500" placeholder="EX: INFORMÁTICA, MODA" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Marca</label>
                      <input value={formData.brand} onChange={e=>setFormData({...formData, brand: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Fornecedor Principal</label>
                      <input value={formData.supplier} onChange={e=>setFormData({...formData, supplier: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Preço de Custo</label>
                      <input type="number" step="0.01" value={formData.priceCost} onChange={e=>setFormData({...formData, priceCost: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" placeholder="0.00" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Preço de Venda</label>
                      <input required type="number" step="0.01" value={formData.price} onChange={e=>setFormData({...formData, price: e.target.value})} className="w-full p-4 bg-slate-900 border border-slate-800 text-orange-500 rounded-2xl text-sm font-black italic shadow-xl" placeholder="0.00" />
                    </div>
                    <div className="space-y-1 flex flex-col justify-end">
                      <div className="w-full p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                        <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">Margem %</span>
                        <span className="text-sm font-black text-emerald-700 italic">{getMargin(parseFloat(formData.priceCost || '0'), parseFloat(formData.price || '0')).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Estoque Atual</label>
                      <input type="number" value={formData.stock} onChange={e=>setFormData({...formData, stock: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-rose-400 uppercase ml-2 tracking-widest">Nível de Alerta (Min)</label>
                      <input type="number" value={formData.minStock} onChange={e=>setFormData({...formData, minStock: e.target.value})} className="w-full p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-bold" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Descrição Detalhada / Especificações</label>
                <textarea 
                  value={formData.description} 
                  onChange={e=>setFormData({...formData, description: e.target.value})} 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium h-24 resize-none focus:border-orange-500 transition-all outline-none" 
                  placeholder="Detalhes que ajudam na identificação e venda do produto..."
                />
              </div>

              <button type="submit" className="w-full btn-orange py-6 rounded-[2.5rem] font-black text-sm flex items-center justify-center gap-4 shadow-2xl shadow-orange-500/20 active:scale-95 transition-all">
                <BarChart3 size={24} /> {viewingProduct ? 'ATUALIZAR INVENTÁRIO' : 'SINCRONIZAR AO CATÁLOGO NEXUS'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsView;