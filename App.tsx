
import React, { useState, useEffect, useMemo } from 'react';
import { User, Product, Sale, OfficeUnit, Expense, Appointment, Customer } from './types';
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
import { LayoutDashboard, ShoppingCart, FileText, Settings as SettingsIcon, Mic, Package, Cpu, LogOut, ShieldAlert, Users, BookUser, RefreshCcw } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<string>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Estados Globais Persistidos
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

  // Funções de Registro Automático para Integridade do CRM e Estoque
  const ensureCustomerExists = (name: string, phone: string, office: string) => {
    if (!phone) return;
    const exists = customers.find(c => c.phone === phone && c.officeName === office);
    if (!exists) {
      const newC: Customer = {
        id: 'C-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        name: name.toUpperCase(),
        phone: phone,
        email: '',
        totalSpent: 0,
        debt: 0,
        officeName: office
      };
      setCustomers(prev => [...prev, newC]);
    }
  };

  const handleSaleCompletion = (s: Sale) => {
    setSales(prev => [s, ...prev]);
    ensureCustomerExists(s.customerName, s.customerPhone || '', s.sellerOffice);
    
    // Baixa automática no estoque
    setProducts(prevProducts => 
      prevProducts.map(p => {
        const soldItem = s.items.find(item => item.productId === p.id);
        if (soldItem) {
          return { ...p, stock: Math.max(0, p.stock - soldItem.quantity) };
        }
        return p;
      })
    );
  };

  // Filtros Multitenancy
  const filteredProducts = useMemo(() => user?.role === 'SUPER_ADMIN' ? products : products.filter(p => p.officeName === user?.officeName), [products, user]);
  const filteredSales = useMemo(() => user?.role === 'SUPER_ADMIN' ? sales : sales.filter(s => s.sellerOffice === user?.officeName), [sales, user]);
  const filteredExpenses = useMemo(() => user?.role === 'SUPER_ADMIN' ? expenses : expenses.filter(e => e.officeName === user?.officeName), [expenses, user]);
  
  const consolidatedCustomers = useMemo(() => {
    const baseCustomers = user?.role === 'SUPER_ADMIN' ? customers : customers.filter(c => c.officeName === user?.officeName);
    return baseCustomers.map(c => {
      const customerSales = sales.filter(s => s.customerPhone === c.phone && s.sellerOffice === c.officeName);
      const totalSpent = customerSales.reduce((acc, s) => acc + s.total, 0);
      const debt = customerSales.reduce((acc, s) => acc + (s.remainingBalance || 0), 0);
      return { ...c, totalSpent, debt };
    });
  }, [customers, sales, user]);

  // --- IA VOICE ENGINE ---
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  const speakResponse = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.15;
    window.speechSynthesis.speak(utterance);
  };

  const handleVoiceCommand = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) return alert('Ambiente não suporta IA de Voz.');
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      await processVoice(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const processVoice = async (text: string) => {
    if (!text || !user) return;
    setIsProcessingVoice(true);
    try {
      const result = await parseVoiceCommand(text);
      const office = user.officeName || 'Nexus Central';

      if (result?.intent === 'VENDA') {
        const valor = result.data.valor || 0;
        const cliente = result.data.cliente || 'CLIENTE NEXUS';
        const phone = result.data.telefone || '';
        
        const newSale: Sale = {
          id: 'V-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
          date: new Date().toISOString(),
          items: [{ name: text.toUpperCase(), quantity: 1, price: valor }],
          total: valor,
          paymentStatus: 'PAID',
          paymentMethod: 'CASH',
          customerName: cliente,
          customerPhone: phone,
          sellerName: user.name,
          sellerOffice: office,
          remainingBalance: 0
        };
        handleSaleCompletion(newSale);
        speakResponse(`Comando executado. Venda de ${valor} reais para ${cliente} processada.`);
      } else if (result?.intent === 'GASTO') {
        const valor = result.data.valor || 0;
        const newExp: Expense = {
          id: 'EXP-' + Date.now(),
          description: text.toUpperCase(),
          amount: valor,
          category: result.data.categoria || 'DIVERSOS',
          date: new Date().toISOString(),
          officeName: office
        };
        setExpenses(prev => [...prev, newExp]);
        speakResponse(`Gasto de ${valor} reais registrado nos logs operacionais.`);
      } else {
        speakResponse("Protocolo não identificado. Repita a operação.");
      }
    } catch (e) {
      speakResponse("Falha na interface neural. Tente novamente.");
    } finally {
      setIsProcessingVoice(false);
    }
  };

  if (!user) return <Login onLogin={handleLogin} offices={offices} />;

  return (
    <div className="flex min-h-screen bg-cyber-black text-white font-inter selection:bg-cyber-neon selection:text-black">
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 glass border-r border-white/5 transition-all duration-500 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-8 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-10 p-4 bg-cyber-neon/5 border border-cyber-neon/20 rounded-2xl shadow-neon-cyan">
            <Cpu className="text-cyber-neon" size={24} />
            <h1 className="text-xl font-orbitron font-black tracking-widest text-cyber-neon uppercase">Nexus OS</h1>
          </div>
          <nav className="flex-1 space-y-1">
            {navItems(user).map(item => (
              <button key={item.id} onClick={() => { setView(item.id); setSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl transition-all font-orbitron text-[9px] tracking-widest uppercase border ${view === item.id ? 'bg-cyber-neon/10 text-cyber-neon border-cyber-neon shadow-neon-cyan' : 'text-gray-500 border-transparent hover:text-white hover:bg-white/5'}`}>
                {item.icon} <span className="font-bold">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="mt-auto pt-6 border-t border-white/5">
            <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-4 text-cyber-pink hover:bg-cyber-pink/5 rounded-2xl transition-all font-orbitron text-[10px] tracking-widest uppercase border border-transparent hover:border-cyber-pink/20">
              <LogOut size={20} /> <span className="font-bold">Encerrar Nexus</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 md:ml-72 p-6 md:p-14 relative overflow-x-hidden overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {view === 'dashboard' && <Dashboard user={user} sales={filteredSales} expenses={filteredExpenses} />}
          {view === 'pos' && <POS products={filteredProducts} onSale={handleSaleCompletion} currentUser={user} />}
          {view === 'inventory' && <Inventory products={filteredProducts} setProducts={setProducts} currentUser={user} />}
          {view === 'crm' && <CRM customers={consolidatedCustomers} setCustomers={setCustomers} sales={filteredSales} currentUser={user} />}
          {view === 'reports' && <Reports sales={filteredSales} setSales={setSales} />}
          {view === 'referral' && <Referral user={user} />}
          {view === 'settings' && <Settings user={user} onUpdate={u => setUser(prev => prev ? {...prev, ...u} : null)} />}
          {view === 'admin' && <Admin offices={offices} setOffices={setOffices} sales={sales} />}
        </div>

        <div className="fixed bottom-10 right-10 z-50 flex flex-col items-end gap-5">
          {isProcessingVoice && (
            <div className="bg-cyber-neon text-black px-6 py-4 rounded-2xl text-[9px] font-black animate-pulse uppercase tracking-widest shadow-neon-cyan flex items-center gap-3">
              <RefreshCcw className="animate-spin" size={14}/> Nexus IA Ativa...
            </div>
          )}
          <div className="flex items-center gap-4">
            {isListening && <div className="bg-cyber-pink text-white px-5 py-2 rounded-full text-[8px] font-black uppercase tracking-widest animate-bounce shadow-neon-pink">Escuta Nexus</div>}
            <button onClick={handleVoiceCommand} className={`p-8 rounded-full transition-all hover:scale-110 active:scale-95 border-2 ${isListening ? 'bg-cyber-pink border-white shadow-neon-pink' : 'bg-cyber-neon text-black border-transparent shadow-neon-cyan'}`}>
              <Mic size={38} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

const navItems = (user: User) => [
  { id: 'dashboard', icon: <LayoutDashboard size={20}/>, label: 'Painel Central', roles: ['USER_ADMIN', 'SUPER_ADMIN'] },
  { id: 'pos', icon: <ShoppingCart size={20}/>, label: 'Terminal PDV', roles: ['USER_ADMIN', 'SUPER_ADMIN'] },
  { id: 'inventory', icon: <Package size={20}/>, label: 'Almoxarifado', roles: ['USER_ADMIN', 'SUPER_ADMIN'] },
  { id: 'crm', icon: <BookUser size={20}/>, label: 'Fichário CRM', roles: ['USER_ADMIN', 'SUPER_ADMIN'] },
  { id: 'reports', icon: <FileText size={20}/>, label: 'Fluxo Notas', roles: ['USER_ADMIN', 'SUPER_ADMIN'] },
  { id: 'referral', icon: <Users size={20}/>, label: 'Rede Roots', roles: ['USER_ADMIN', 'SUPER_ADMIN'] },
  { id: 'admin', icon: <ShieldAlert size={20}/>, label: 'SuperAdmin Master', roles: ['SUPER_ADMIN'] },
  { id: 'settings', icon: <SettingsIcon size={20}/>, label: 'Nexus Config', roles: ['USER_ADMIN', 'SUPER_ADMIN'] },
].filter(item => item.roles.includes(user.role));

export default App;
