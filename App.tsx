import React, { useState, useEffect, useMemo } from 'react';
import { User, Product, Sale, OfficeUnit, Expense, Customer } from './types';
import { parseVoiceCommand } from './services/gemini';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Inventory from './pages/Inventory';
import Admin from './pages/Admin';
import Referral from './pages/Referral';
import CRM from './pages/CRM';

// Icons
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Settings as SettingsIcon,
  Mic,
  Package,
  Cpu,
  LogOut,
  ShieldAlert,
  Users,
  BookUser,
  RefreshCcw
} from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<string>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Estados globais persistidos
  const [products, setProducts] = useState<Product[]>(() => JSON.parse(localStorage.getItem('f_products') || '[]'));
  const [sales, setSales] = useState<Sale[]>(() => JSON.parse(localStorage.getItem('f_sales') || '[]'));
  const [offices, setOffices] = useState<OfficeUnit[]>(() => JSON.parse(localStorage.getItem('f_offices') || '[]'));
  const [customers, setCustomers] = useState<Customer[]>(() => JSON.parse(localStorage.getItem('f_customers') || '[]'));
  const [expenses, setExpenses] = useState<Expense[]>(() => JSON.parse(localStorage.getItem('f_expenses') || '[]'));

  useEffect(() => localStorage.setItem('f_products', JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem('f_sales', JSON.stringify(sales)), [sales]);
  useEffect(() => localStorage.setItem('f_offices', JSON.stringify(offices)), [offices]);
  useEffect(() => localStorage.setItem('f_customers', JSON.stringify(customers)), [customers]);
  useEffect(() => localStorage.setItem('f_expenses', JSON.stringify(expenses)), [expenses]);

  useEffect(() => {
    const saved = localStorage.getItem('facindemais_user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('facindemais_user', JSON.stringify(u));
    setView(u.role === 'SUPER_ADMIN' ? 'admin' : 'dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('facindemais_user');
    setView('dashboard');
  };

  // Filtros multitenancy
  const filteredProducts = useMemo(
    () => (user?.role === 'SUPER_ADMIN' ? products : products.filter(p => p.officeName === user?.officeName)),
    [products, user]
  );

  const filteredSales = useMemo(
    () => (user?.role === 'SUPER_ADMIN' ? sales : sales.filter(s => s.sellerOffice === user?.officeName)),
    [sales, user]
  );

  const filteredExpenses = useMemo(
    () => (user?.role === 'SUPER_ADMIN' ? expenses : expenses.filter(e => e.officeName === user?.officeName)),
    [expenses, user]
  );

  const consolidatedCustomers = useMemo(() => {
    const baseCustomers =
      user?.role === 'SUPER_ADMIN'
        ? customers
        : customers.filter(c => c.officeName === user?.officeName);

    return baseCustomers.map(c => {
      const customerSales = sales.filter(
        s => s.customerPhone === c.phone && s.sellerOffice === c.officeName
      );
      const totalSpent = customerSales.reduce((acc, s) => acc + s.total, 0);
      const debt = customerSales.reduce((acc, s) => acc + (s.remainingBalance || 0), 0);
      return { ...c, totalSpent, debt };
    });
  }, [customers, sales, user]);

  // IA Voice
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  const handleVoiceCommand = async () => {
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) return alert('Ambiente não suporta IA de Voz.');

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  if (!user) return <Login onLogin={handleLogin} offices={offices} />;

  return (
    <div className="flex min-h-screen bg-cyber-black text-white font-inter">

      {/* BOTÃO MENU MOBILE */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50
                   bg-cyber-neon text-black
                   w-12 h-12 rounded-xl
                   flex items-center justify-center
                   text-2xl font-black shadow-neon-cyan"
      >
        ☰
      </button>

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 glass border-r border-white/5
        transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0`}
      >
        <div className="p-8 flex flex-col h-full">

          {/* FECHAR MOBILE */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden mb-6 text-cyber-neon font-black text-lg self-end"
          >
            ✕
          </button>

          <div className="flex items-center gap-3 mb-10">
            <Cpu className="text-cyber-neon" size={24} />
            <h1 className="text-xl font-orbitron font-black text-cyber-neon uppercase">
              Nexus OS
            </h1>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems(user).map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl
                transition-all font-orbitron text-[9px] uppercase tracking-widest
                ${view === item.id ? 'bg-cyber-neon/10 text-cyber-neon' : 'text-gray-500 hover:text-white'}`}
              >
                {item.icon}
                <span className="font-bold">{item.label}</span>
              </button>
            ))}
          </nav>

          <button
            onClick={handleLogout}
            className="mt-auto flex items-center gap-4 px-6 py-4 text-cyber-pink font-orbitron text-[10px] uppercase"
          >
            <LogOut size={20} /> Encerrar Nexus
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 md:ml-72 p-6 md:p-14 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {view === 'dashboard' && <Dashboard user={user} sales={filteredSales} expenses={filteredExpenses} />}
          {view === 'pos' && <POS products={filteredProducts} currentUser={user} />}
          {view === 'inventory' && <Inventory products={filteredProducts} setProducts={setProducts} currentUser={user} />}
          {view === 'crm' && <CRM customers={consolidatedCustomers} setCustomers={setCustomers} sales={filteredSales} currentUser={user} />}
          {view === 'reports' && <Reports sales={filteredSales} setSales={setSales} />}
          {view === 'referral' && <Referral user={user} />}
          {view === 'settings' && <Settings user={user} onUpdate={u => setUser(prev => (prev ? { ...prev, ...u } : null))} />}
          {view === 'admin' && <Admin offices={offices} setOffices={setOffices} sales={sales} />}
        </div>
      </main>

      {/* VOICE UI */}
      <div className="fixed bottom-10 right-10 z-50">
        <button
          onClick={handleVoiceCommand}
          className="p-8 rounded-full bg-cyber-neon text-black shadow-neon-cyan"
        >
          <Mic size={38} />
        </button>
      </div>
    </div>
  );
};

const navItems = (user: User) => [
  { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Painel Central', roles: ['USER_ADMIN', 'SUPER_ADMIN'] },
  { id: 'pos', icon: <ShoppingCart size={20} />, label: 'Terminal PDV', roles: ['USER_ADMIN', 'SUPER_ADMIN'] },
  { id: 'inventory', icon: <Package size={20} />, label: 'Almoxarifado', roles: ['USER_ADMIN', 'SUPER_ADMIN'] },
  { id: 'crm', icon: <BookUser size={20} />, label: 'Fichário CRM', roles: ['USER_ADMIN', 'SUPER_ADMIN'] },
  { id: 'reports', icon: <FileText size={20} />, label: 'Fluxo Notas', roles: ['USER_ADMIN', 'SUPER_ADMIN'] },
  { id: 'referral', icon: <Users size={20} />, label: 'Rede Roots', roles: ['USER_ADMIN', 'SUPER_ADMIN'] },
  { id: 'admin', icon: <ShieldAlert size={20} />, label: 'SuperAdmin Master', roles: ['SUPER_ADMIN'] },
  { id: 'settings', icon: <SettingsIcon size={20} />, label: 'Nexus Config', roles: ['USER_ADMIN', 'SUPER_ADMIN'] }
].filter(item => item.roles.includes(user.role));

export default App;
