export interface UserProfile {
  uid: string;
  email: string;
  username?: string;
  fullName?: string;
  role: 'super-admin' | 'admin' | 'editor' | 'viewer';
  status: 'active' | 'blocked';
  subscriptionStatus: 'PAID' | 'EXPIRED' | 'TRIAL';
  officeName: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  pixKey?: string;
  logoUrl?: string;
  profilePicUrl?: string;
  cnpj?: string;
  segment?: string;
  createdAt: any;
  subscriptionExpiresAt: any;
  referralCode: string;
  referredBy?: string;
  lineage: {
    l1?: string;
    l2?: string;
    l3?: string;
  };
  lastReportDate?: string;
  settings?: {
    language: 'pt-BR' | 'en' | 'es';
    theme: 'light' | 'dark';
    notifications: {
      email: boolean;
      whatsapp: boolean;
      system: boolean;
    };
    security2FA?: boolean;
  };
  activityLogs?: {
    id: string;
    action: string;
    timestamp: any;
    details?: string;
  }[];
  documents?: {
    id: string;
    name: string;
    type: string;
    url: string;
    createdAt: any;
  }[];
}

export interface Product {
  id: string;
  userId: string;
  sku?: string;
  name: string;
  category?: string;
  brand?: string;
  supplier?: string;
  description?: string;
  imageUrl?: string;
  priceCost: number;
  price: number; 
  stock: number;
  minStock: number;
  type: 'PRODUCT' | 'SERVICE';
  createdAt?: any;
}

export interface StockMovement {
  id: string;
  productId: string;
  userId: string;
  type: 'IN' | 'OUT';
  quantity: number;
  reason: string;
  date: any;
}

export interface FinRecord {
  id: string;
  userId: string;
  type: 'INCOME' | 'EXPENSE' | 'FIXED_BILL' | 'PURCHASE';
  date: string;
  description: string;
  contactName?: string;
  category: string;
  amount: number;
  paymentMethod: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'RECEIVED';
  dueDate?: string;
  referenceCode?: string;
  quantity?: number;
  notes?: string;
  createdAt: any;
}

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location?: string;
  contactName?: string;
  contactPhone?: string;
  priority: 'BAIXA' | 'MÉDIA' | 'ALTA';
  status: 'PENDENTE' | 'CONCLUÍDO' | 'CANCELADO';
  createdAt: any;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  priceAtTime: number;
  priceCostAtTime: number;
  nameAtTime: string;
  type: 'PRODUCT' | 'SERVICE';
}

export interface Installment {
  id: string;
  value: number;
  status: 'PENDING' | 'PAID';
  dueDate: any;
}

export interface Order {
  id: string;
  userId: string;
  customerId: string;
  items: OrderItem[];
  total: number;
  subtotal: number;
  discount: number;
  status: 'PAID' | 'PENDING' | 'CANCELLED';
  paymentMethod: 'PIX' | 'CREDIT_CARD' | 'CASH' | 'DEFERRED' | 'BOLETO';
  installments?: number;
  installmentDetails?: Installment[];
  guestName: string;
  guestPhone?: string;
  guestCpfCnpj?: string;
  guestAddress?: string;
  entryAmount?: number;
  notes?: string;
  warranty?: string;
  createdAt: any;
}

export interface Customer {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  cpfCnpj?: string;
  rg?: string;
  birthDate?: string;
  maritalStatus?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip?: string;
  complement?: string;
  profession?: string;
  company?: string;
  role?: string;
  income?: string;
  clientType?: 'PF' | 'PJ';
  registrationDate?: any;
  assignedRep?: string;
  preferredPayment?: string;
  preferredTime?: string;
  preferredChannel?: string;
  notes?: string;
  lgpdConsent?: boolean;
}

export interface Quote {
  id: string;
  userId: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  discount?: number;
  status: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED';
  validUntil: string;
  notes?: string;
  warranty?: string;
  deliveryDeadline?: string;
  estimatedStart?: string;
  estimatedCompletion?: string;
  paymentMethod?: string;
  installments?: number;
  createdAt: any;
}

export interface Expense {
  id: string;
  userId: string;
  description: string;
  amount: number;
  category: string;
  createdAt: any;
}

export interface ServiceOrder {
  id: string;
  userId: string;
  customerId: string;
  customerName: string;
  customerCpfCnpj?: string;
  customerPhone?: string;
  customerAddress?: string;
  equipment: string;
  equipmentBrand?: string;
  equipmentModel?: string;
  equipmentSerial?: string;
  description: string;
  informedDefect?: string;
  technicalDiagnosis?: string;
  executedService?: string;
  partsUsed?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  cost: number;
  paymentMethod?: string;
  installments?: number;
  deliveryDeadline?: string;
  warranty?: string;
  notes?: string;
  createdAt: any;
}

export type ViewState = 
  | 'DASHBOARD' | 'OFFICES' | 'STOCK' | 'SALES' 
  | 'SERVICE_ORDERS' | 'CUSTOMERS' | 'QUOTES' 
  | 'FINANCIAL' | 'AGENDA' | 'REFERRALS' | 'PROFILE' | 'AI_ASSISTANT' | 'AI_VIDEO';