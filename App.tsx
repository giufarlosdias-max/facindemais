
import React, { useState, useEffect, useMemo } from 'react';
import { User, Product, Sale, OfficeUnit, Expense, Appointment, Customer } from './types';
import { parseVoiceCommand } from './services/gemini';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Inventory from './pages/Inventory';
import Admin from './pages/Admin';
import Referral from './pages/Referral';
import CRM from './pages/CRM';

// Icons
import { LayoutDashboard, ShoppingCart, FileText, Settings as SettingsIcon, Mic, Package, Cpu, LogOut, ShieldAlert, Users, BookUser, RefreshCcw, Menu, X } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<string>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Estados Globais Persistidos no Navegador
  const [products, setProducts] = useState<Product[]>(() => JSON.parse(localStorage.getItem('f_products') || '[]'));
  const [sales, setSales] = useState<Sale[]>(() => JSON.parse(localStorage.getItem('f_sales') || '[]'));
  const [offices, setOffices] = useState<OfficeUnit[]>(() => JSON.parse(localStorage.getItem('f_offices') || '[]'));
  const [customers, setCustomers] = useState<Customer[]>(() => JSON.parse(localStorage.getItem('f_customers') || '[]'));
  const [expenses, setExpenses] = useState<Expense[]>(() => JSON.parse(localStorage.getItem('f_expenses') || '[]'));

  // Sincronização automática com LocalStorage
  useEffect(() => {
    localStorage.setItem('f_products', JSON.stringify(products));
    localStorage.setItem('f_sales', JSON.stringify(sales));
    localStorage.setItem('f_offices', JSON.stringify(offices));
    localStorage.setItem('f_customers', JSON.stringify(customers));
    localStorage.setItem('f_expenses', JSON.stringify(expenses));
  }, [products, sales, offices, customers, expenses]);

  // Detector de Rota via Query Params - SOLUÇÃO PARA ERRO 404
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    
    if (viewParam === 'register') {
      setView('register');
    } else {
      const saved = localStorage.getItem('facindemais_user');
      if (saved) {
        setUser(JSON.parse(saved));
      }
    }
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('facindemais_user', JSON.stringify(u));
    setView(u.role === 'SUPER_ADMIN' ? 'admin' : 'dashboard');
    // Limpa a URL para ficar limpa após login
    window.history.replaceState({}, document.title, "/");
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('facindemais_user');
    setView('dashboard');
  };

  // Função que SALVA DE VERDADE o novo escritório no sistema
  const handleNewOfficeRegistration = (office: OfficeUnit) => {
    setOffices(prev => [...prev, office]);
    alert("UNIDADE NEXUS CRIADA COM SUCESSO! Faça login com seu e-mail e a senha padrão 123.");
    // Redireciona para a raiz para evitar 404 e limpa parâmetros
    window.location.href = window.location.origin;
  };

  const handleSaleCompletion = (s: Sale) => {
    setSales(prev => [s, ...prev]);
    // Baixa de estoque automática e atômica
    setProducts(prevProducts => 
      prevProducts.map(p => {
        const soldItem = s.items.find(item => item.productId === p.id);
        if (soldItem) return { ...p, stock: Math.max(0, p.stock - soldItem.quantity) };
        return p;
      })
    );
  };

  // Filtros Multitenancy (Cada escritório vê apenas o seu)
  const filteredProducts = useMemo(() => user?.role === 'SUPER_ADMIN' ? products : products.filter(p => p.officeName === user?.officeName), [products, user]);
  const filteredSales = useMemo(() => user?.role === 'SUPER_ADMIN' ? sales : sales.filter(s => s.sellerOffice === user?.officeName), [sales, user]);
  const filteredExpenses = useMemo(() => user?.role === 'SUPER_ADMIN' ? expenses : expenses.filter(e => e.officeName === user?.officeName), [expenses, user]);
  
  const consolidatedCustomers = useMemo(() => {
    const baseCustomers = user?.role === 'SUPER_ADMIN' ? customers : customers.filter(c => c.officeName === user?.officeName);
    return baseCustomers.map(c => {
      const customerSales = sales.filter(s => s.customerPhone === c.phone && s.sellerOffice === c.officeName);
      return { 
        ...c, 
        totalSpent: customerSales.reduce((acc, s) => acc + s.total, 0),
        debt: customerSales.reduce((acc, s) => acc + (s.remainingBalance || 0), 0)
      };
    });
  }, [customers, sales, user]);

  if (view === 'register') return <Register onRegister={handleNewOfficeRegistration} />;
  if (!user) return <Login onLogin={handleLogin} offices={offices} />;

  return (
    <div className="flex min-h-screen bg-cyber-black text-white font-inter">
      {/* BOTÃO MOBILE ☰ ÚNICO */}
      <button 
        onClick={() => setSidebarOpen(!isSidebarOpen)} 
        className="md:hidden fixed top-6 left-6 z-50 p-4 bg-cyber-neon text-black rounded-2xl shadow-neon-cyan active:scale-90 transition-all"
        aria-label="Menu"
      >
        {isSidebarOpen ? <X size={24}/> : <Menu size={24}/>}
      </button>

      {/* SIDEBAR COM LISTA DE FUNÇÕES COMPLETA */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 glass border-r border-white/5 transition-all duration-500 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-8 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-10 p-4 bg-cyber-neon/5 border border-cyber-neon/20 rounded-2xl shadow-neon-cyan">
            <Cpu className="text-cyber-neon" size={24} />
            <h1 className="text-xl font-orbitron font-black text-cyber-neon uppercase tracking-widest">Nexus OS</h1>
          </div>
          <nav className="flex-1 space-y-2 overflow-y-auto pr-2">
            {navItems(user).map(item => (
              <button 
                key={item.id} 
                onClick={() => { setView(item.id); setSidebarOpen(false); }} 
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all font-orbitron text-[9px] tracking-widest uppercase border ${view === item.id ? 'bg-cyber-neon/10 text-cyber-neon border-cyber-neon shadow-neon-cyan' : 'text-gray-500 border-transparent hover:text-white hover:bg-white/5'}`}
              >
                {item.icon} <span className="font-bold">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="mt-auto pt-6 border-t border-white/5">
            <div className="mb-4 px-4 py-3 bg-white/5 rounded-xl border border-white/10">
              <p className="text-[7px] text-gray-500 uppercase tracking-widest">Gestor Ativo</p>
              <p className="text-[9px] font-black text-cyber-neon uppercase truncate">{user.name}</p>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-4 text-cyber-pink hover:bg-cyber-pink/5 rounded-2xl transition-all font-orbitron text-[10px] tracking-widest uppercase border border-transparent hover:border-cyber-pink/20">
              <LogOut size={20} /> <span className="font-bold">Encerrar Sessão</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ÁREA DE CONTEÚDO */}
      <main className="flex-1 md:ml-72 p-6 md:p-14 relative">
        <div className="max-w-6xl mx-auto">
          {view === 'dashboard' && <Dashboard user={user} sales={filteredSales} expenses={filteredExpenses} />}
          {view === 'pos' && <POS products={filteredProducts} onSale={handleSaleCompletion} currentUser={user} />}
          {view === 'inventory' && <Inventory products={filteredProducts} setProducts={setProducts} currentUser={user} />}
          {view === 'crm' && <CRM customers={consolidatedCustomers} setCustomers={setCustomers} sales={filteredSales} currentUser={user} />}
          {view === 'reports' && <Reports sales={filteredSales} setSales={setSales} />}
          {view === 'referral' && <Referral user={user} />}
          {view === 'settings' && (
  <Settings
    user={user}
    onUpdate={(updatedUser) => {
      setOffices(prev =>
        prev.map(o =>
          o.id === updatedUser.officeId
            ? { ...o, ...updatedUser.settings }
            : o
        )
      );

      setUser(prev => (prev ? { ...prev, ...updatedUser } : prev));
    }}
  />
)}
          {view === 'admin' && <Admin offices={offices} setOffices={setOffices} sales={sales} />}
        </div>
      </main>

      {/* Overlay Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

const navItems = (user: User) => [
  { id: 'dashboard', icon: <LayoutDashboard size={20}/>, label: 'Painel Central', roles: ['USER_ADMIN', 'SUPER_ADMIN'] },
  { id: 'pos', icon: <ShoppingCart size={20}/>, label: 'Terminal PDV', roles: ['USER_ADMIN', 'SUPER_ADMIN'] },
  { id: 'inventory', icon: <Package size={20}/>, label: 'Almoxarifado', roles: ['USER_ADMIN', 'SUPER_ADMIN'] },
  { id: 'crm', icon: <BookUser size={20}/>, label: 'Fichário CRM', roles: ['USER_ADMIN', 'SUPER_ADMIN'] },
  { id: 'reports', icon: <FileText size={20}/>, label: 'Histórico Notas', roles: ['USER_ADMIN', 'SUPER_ADMIN'] },
  { id: 'referral', icon: <Users size={20}/>, label: 'Rede Roots', roles: ['USER_ADMIN', 'SUPER_ADMIN'] },
  { id: 'admin', icon: <ShieldAlert size={20}/>, label: 'Admin Master', roles: ['SUPER_ADMIN'] },
  { id: 'settings', icon: <SettingsIcon size={20}/>, label: 'Configurações', roles: ['USER_ADMIN', 'SUPER_ADMIN'] },
].filter(item => item.roles.includes(user.role));

export default App;
