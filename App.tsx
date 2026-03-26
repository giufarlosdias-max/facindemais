
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, dbService, db } from './services/firebase';
import { onSnapshot, doc } from 'firebase/firestore';
import { ViewState, UserProfile, Order, Product, Customer, Expense, Quote } from './types';
import { Timestamp } from 'firebase/firestore';
import { 
  LayoutDashboard, Users, LogOut, Zap, Building2, Grid3X3, 
  ShoppingCart, Lock, FileText, Calendar, Package, Wrench, Wallet, UserCircle, Gift, Video
} from 'lucide-react';

import LoginView from './views/LoginView';
import MasterDashboard from './views/MasterDashboard';
import OfficeManagement from './views/OfficeManagement';
import NexusHub from './views/NexusHub';
import ProductsView from './views/ProductsView';
import CustomersView from './views/CustomersView';
import OrdersView from './views/OrdersView';
import ExpensesView from './views/ExpensesView';
import SettingsView from './views/SettingsView';
import ReferralView from './views/ReferralView';
import QuotesView from './views/QuotesView';
import CalendarView from './views/CalendarView';
import ServiceOrdersView from './views/ServiceOrdersView';
import AdminDashboard from './views/AdminDashboard';
import AIInsightsView from './views/AIInsightsView';
import AIVideoCreator from './views/AIVideoCreator';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [loading, setLoading] = useState(true);

  const [orders, setOrders] = useState<Order[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    let syncUnsubs: (() => void)[] = [];

    const cleanupSyncs = () => {
      syncUnsubs.forEach(unsub => unsub());
      syncUnsubs = [];
    };

    const authUnsub = onAuthStateChanged(auth, async (u) => {
      try {
        cleanupSyncs(); // Limpa listeners anteriores ao mudar estado de auth

        if (u) {
          // Listener em tempo real para o perfil do usuário
          const profileUnsub = onSnapshot(doc(db, "users", u.uid), async (snap) => {
            if (snap.exists()) {
              let p = snap.data() as UserProfile;
              
              const isMaster = u.email === "giufarlosdias@hotmail.com";
              if (isMaster && (p.role !== 'super-admin' || p.subscriptionStatus !== 'PAID')) {
                 const infiniteDate = new Date(2099, 11, 31);
                 await dbService.update('users', u.uid, { 
                   role: 'super-admin',
                   subscriptionStatus: 'PAID',
                   status: 'active',
                   subscriptionExpiresAt: Timestamp.fromDate(infiniteDate)
                 }, u.uid, u.email || 'System');
                 // O listener disparará novamente com os dados atualizados
                 return;
              }

              if (p.status === 'blocked') { 
                alert("Acesso Bloqueado."); 
                await signOut(auth); 
                return; 
              }

              setProfile(p);
              setUser(u);
              setLoading(false);
            } else {
              // Se não existe, inicializa
              const p = await dbService.initProfile(u.uid, u.email || '');
              setProfile(p as UserProfile);
              setUser(u);
              setLoading(false);
            }
          }, (error) => {
            console.error("Profile Sync Error:", error);
            setLoading(false);
          });
          
          syncUnsubs.push(profileUnsub);

          // Outros syncs dependem do perfil estar carregado e ter permissões
          // Note: setProfile é assíncrono, então usamos o snap.data() ou p acima se necessário,
          // mas aqui os listeners de coleções podem ser iniciados se o usuário for admin.
          // Para simplificar, iniciamos se o UID existe, o dbService.sync já filtra por userId.
          syncUnsubs.push(dbService.sync('orders', u.uid, (data) => setOrders(data as Order[])));
          syncUnsubs.push(dbService.sync('quotes', u.uid, (data) => setQuotes(data as Quote[])));
          syncUnsubs.push(dbService.sync('products', u.uid, (data) => setProducts(data as Product[])));
          syncUnsubs.push(dbService.sync('customers', u.uid, (data) => setCustomers(data as Customer[])));
          syncUnsubs.push(dbService.sync('expenses', u.uid, (data) => setExpenses(data as Expense[])));
          
          setView('DASHBOARD');
        } else {
          setUser(null); 
          setProfile(null);
          setOrders([]); 
          setQuotes([]); 
          setProducts([]); 
          setCustomers([]); 
          setExpenses([]);
        }
      } catch (error) {
        console.error("Auth State Change Error:", error);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      authUnsub();
      cleanupSyncs();
    };
  }, []);

  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-white">
      <div className="relative">
        <div className="w-12 h-12 border-2 border-slate-100 rounded-full"></div>
        <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-brand-cyan rounded-full animate-spin"></div>
      </div>
    </div>
  );

  if (!user) return <LoginView />;

  const isSuper = profile?.role === 'super-admin';
  const salesCount = orders.filter(o => o.status === 'PAID').length;
  
  // Lógica de expiração automática: Se TRIAL e data atual > expiração, bloqueia.
  const isExpired = !isSuper && profile?.subscriptionStatus === 'TRIAL' && 
                    profile?.subscriptionExpiresAt?.toDate() < new Date();
  
  const needsPayment = !isSuper && (salesCount >= 3 || isExpired) && profile?.subscriptionStatus !== 'PAID';

  const NavContent = () => (
    <div className="flex flex-row lg:flex-col items-center justify-around lg:justify-start w-full gap-1 px-2 lg:px-0">
      <button onClick={()=>setView('DASHBOARD')} title="Painel" className={`nav-btn p-3 lg:p-4 flex-1 lg:w-full flex items-center justify-center ${view==='DASHBOARD'?'active':''}`}><LayoutDashboard size={20}/></button>
      <button onClick={()=>setView('SALES')} title="Vendas" className={`nav-btn p-3 lg:p-4 flex-1 lg:w-full flex items-center justify-center ${view==='SALES'?'active':''}`}><ShoppingCart size={20}/></button>
      <button onClick={()=>setView('FINANCIAL')} title="Financeiro" className={`nav-btn p-3 lg:p-4 flex-1 lg:w-full flex items-center justify-center ${view==='FINANCIAL'?'active':''}`}><Wallet size={20}/></button>
      <button onClick={()=>setView('REFERRALS')} title="Indicações" className={`nav-btn p-3 lg:p-4 flex-1 lg:w-full flex items-center justify-center ${view==='REFERRALS'?'active':''}`}><Gift size={20}/></button>
      {isSuper && <button onClick={()=>setView('AI_VIDEO')} title="Animação IA" className={`nav-btn p-3 lg:p-4 flex-1 lg:w-full flex items-center justify-center ${view==='AI_VIDEO'?'active':''}`}><Video size={20}/></button>}
      {isSuper && <button onClick={()=>setView('OFFICES')} title="Gestão" className={`nav-btn p-3 lg:p-4 flex-1 lg:w-full flex items-center justify-center ${view==='OFFICES'?'active':''}`}><Building2 size={20}/></button>}
      <button onClick={()=>setView('PROFILE')} title="Configurações" className={`nav-btn p-3 lg:p-4 flex-1 lg:w-full flex items-center justify-center ${view==='PROFILE'?'active':''}`}><UserCircle size={20}/></button>
      <button onClick={() => signOut(auth)} title="Sair" className="nav-btn p-3 lg:p-4 flex-1 lg:w-full flex items-center justify-center text-slate-400 hover:text-red-500"><LogOut size={20}/></button>
    </div>
  );

  const renderView = () => {
    if (needsPayment && view !== 'PROFILE') {
      return (
        <div className="h-full flex flex-col items-center justify-center space-y-6 p-6 text-center animate-fade">
          <div className="w-16 h-16 bg-brand-orange/10 border border-brand-orange/20 rounded-2xl flex items-center justify-center shadow-sm"><Lock size={28} className="text-brand-orange"/></div>
          <h2 className="text-2xl font-bold text-brand-blue tracking-tight">{isExpired ? 'Escritório Bloqueado' : 'Assinatura Necessária'}</h2>
          <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
            {isExpired ? 'Seu período de teste de 3 dias expirou.' : 'Seu período de avaliação atingiu o limite de operações.'} Regularize seu acesso com o Administrador para continuar.
          </p>
          <button onClick={() => setView('PROFILE')} className="px-8 py-3 bg-brand-blue text-white rounded-xl font-semibold text-sm hover:bg-brand-green transition-all">Ver Planos de Acesso</button>
        </div>
      );
    }

    switch(view) {
      case 'DASHBOARD': 
        return <NexusHub setView={setView} profile={profile!} orders={orders} expenses={expenses} products={products} />;
      case 'OFFICES': 
        return isSuper ? <OfficeManagement superAdminProfile={profile!} /> : <NexusHub setView={setView} profile={profile!} orders={orders} expenses={expenses} products={products} />;
      case 'STOCK': return <ProductsView userId={user.uid} profile={profile!} />;
      case 'SALES': return <OrdersView orders={orders} products={products} customers={customers} userId={user.uid} profile={profile!} />;
      case 'SERVICE_ORDERS': return <ServiceOrdersView userId={user.uid} customers={customers} profile={profile!} />;
      case 'CUSTOMERS': return <CustomersView customers={customers} orders={orders} userId={user.uid} profile={profile!} />;
      case 'QUOTES': return <QuotesView quotes={quotes} products={products} customers={customers} userId={user.uid} profile={profile!} />;
      case 'FINANCIAL': return <ExpensesView expenses={expenses} userId={user.uid} profile={profile!} />;
      case 'AGENDA': return <CalendarView profile={profile!} userId={user.uid} />;
      case 'REFERRALS': return <ReferralView profile={profile!} />;
      case 'PROFILE': return <SettingsView profile={profile!} />;
      case 'AI_ASSISTANT': return <AIInsightsView orders={orders} products={products} profile={profile!} userId={user.uid} />;
      case 'AI_VIDEO': return <AIVideoCreator userId={user.uid} />;
      default: return <NexusHub setView={setView} profile={profile!} orders={orders} expenses={expenses} products={products} />;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-white overflow-hidden text-brand-blue">
      <aside className="hidden lg:flex w-20 border-r border-slate-100 bg-white flex-col p-4 z-20 items-center justify-between shadow-sm">
        <div className="w-10 h-10 bg-brand-blue rounded-xl flex items-center justify-center shadow-sm mb-8">
           <Zap size={20} className="text-white fill-current"/>
        </div>
        <NavContent />
        <div className="h-10"></div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10 custom-scrollbar pb-24 lg:pb-8 bg-slate-50/30">
        <div className="max-w-6xl mx-auto">
          {renderView()}
        </div>
      </main>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-100 flex items-center z-50 px-2 shadow-lg">
        <NavContent />
      </nav>
    </div>
  );
};

export default App;
