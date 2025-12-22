
import React, { useState } from 'react';
import { Product, User } from '../types';
import { Plus, Trash2, Package } from 'lucide-react';

interface InventoryProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  currentUser: User;
}

const Inventory: React.FC<InventoryProps> = ({ products, setProducts, currentUser }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newProd, setNewProd] = useState({ name: '', price: '', stock: '' });

  const add = () => {
    if (!newProd.name || !newProd.price) return;
    const p: Product = {
      id: 'P-' + Date.now().toString().substr(-6),
      name: newProd.name.toUpperCase(),
      price: Number(newProd.price),
      stock: Number(newProd.stock) || 0,
      category: 'Geral',
      description: '',
      officeName: currentUser.officeName || 'Central' // Garantia de isolamento
    };
    setProducts(prev => [...prev, p]);
    setIsAdding(false);
    setNewProd({ name: '', price: '', stock: '' });
  };

  const del = (id: string) => {
    if (confirm('EXCLUIR ATIVO? Esta ação é irreversível.')) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in pb-32">
      <header className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-4xl font-black font-orbitron text-white uppercase tracking-tighter">Nexus <span className="text-cyber-neon">Almoxarifado</span></h2>
          <p className="text-gray-500 text-[10px] font-orbitron uppercase tracking-[0.4em] mt-3">Gestão de Ativos Exclusivos: {currentUser.officeName}</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="bg-cyber-neon text-black px-12 py-5 rounded-2xl font-black font-orbitron text-[10px] shadow-neon-cyan hover:scale-105 active:scale-95 transition-all tracking-widest">INICIALIZAR ITEM</button>
      </header>

      {isAdding && (
        <div className="glass p-10 rounded-3xl border-2 border-cyber-neon/40 grid grid-cols-1 md:grid-cols-4 gap-8 animate-in slide-in-from-top bg-black/60 shadow-neon-cyan">
          <div className="space-y-2">
            <label className="text-[9px] font-orbitron text-gray-500 uppercase ml-2 tracking-widest">Nome do Item</label>
            <input placeholder="Ex: Licença SaaS" value={newProd.name} onChange={e => setNewProd({...newProd, name: e.target.value})} className="w-full bg-black/40 border border-white/10 p-5 rounded-xl text-white outline-none focus:border-cyber-neon" />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-orbitron text-gray-500 uppercase ml-2 tracking-widest">Valor R$</label>
            <input type="number" placeholder="0.00" value={newProd.price} onChange={e => setNewProd({...newProd, price: e.target.value})} className="w-full bg-black/40 border border-white/10 p-5 rounded-xl text-white outline-none focus:border-cyber-neon" />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-orbitron text-gray-500 uppercase ml-2 tracking-widest">Quantidade</label>
            <input type="number" placeholder="0" value={newProd.stock} onChange={e => setNewProd({...newProd, stock: e.target.value})} className="w-full bg-black/40 border border-white/10 p-5 rounded-xl text-white outline-none focus:border-cyber-neon" />
          </div>
          <div className="flex items-end gap-3">
             <button onClick={add} className="flex-1 bg-cyber-neon h-[62px] text-black font-black rounded-xl uppercase text-[10px] tracking-widest shadow-neon-cyan hover:brightness-110 transition-all">Sincronizar</button>
             <button onClick={() => setIsAdding(false)} className="h-[62px] px-6 text-gray-500 uppercase text-[9px] font-black hover:text-white transition-colors">Cancelar</button>
          </div>
        </div>
      )}

      <div className="glass rounded-3xl border border-white/5 overflow-hidden bg-black/40">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-[9px] font-orbitron text-gray-500 uppercase tracking-[0.3em] border-b border-white/10">
            <tr>
              <th className="p-8">Mapeamento do Ativo</th>
              <th className="p-8">Avaliação Unitária</th>
              <th className="p-8">Status Estoque</th>
              <th className="p-8 text-right">Controle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-inter text-gray-300">
            {products.length === 0 ? (
               <tr><td colSpan={4} className="p-32 text-center text-gray-700 font-mono italic text-xs tracking-widest uppercase opacity-30">TERMINAL VAZIO. AGUARDANDO SINCRONIZAÇÃO.</td></tr>
            ) : (
              products.map(p => (
                <tr key={p.id} className="hover:bg-white/5 transition-all group">
                  <td className="p-8 font-black uppercase text-xs text-white flex items-center gap-5">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-cyber-neon group-hover:shadow-neon-cyan transition-all"><Package size={18}/></div>
                    {p.name}
                  </td>
                  <td className="p-8 font-black digital-font text-cyber-neon text-lg">R$ {p.price.toFixed(2)}</td>
                  <td className="p-8">
                    <span className="px-5 py-2 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-white uppercase tracking-widest">
                      {p.stock} Unidades
                    </span>
                  </td>
                  <td className="p-8 text-right">
                    <button onClick={() => del(p.id)} className="text-cyber-pink hover:bg-cyber-pink/10 p-4 rounded-xl transition-all hover:scale-110">
                      <Trash2 size={20}/>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;
