
export type UserRole = 'SUPER_ADMIN' | 'USER_ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  officeName?: string;
  activated: boolean;
  balance: number;
  referralCode: string;
  referralCount: number;
  monthlyFee: number;
  expiryDate?: string;
  pixKey?: string;
  address?: string;
  phone?: string;
  avatar?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalSpent: number;
  debt: number;
  officeName: string; // Isolação por escritório
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  officeName: string;
}

export interface Appointment {
  id: string;
  title: string;
  date: string;
  location: string;
  officeName: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string;
  category: string;
  imageUrl?: string;
  officeName: string; // Isolação por escritório
}

export interface Installment {
  number: number;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'PAID';
}

export interface Sale {
  id: string;
  date: string;
  items: { 
    productId?: string; 
    name: string; 
    quantity: number; 
    price: number 
  }[];
  total: number;
  paymentStatus: 'PAID' | 'PENDING' | 'PARTIAL';
  paymentMethod: 'CASH' | 'CREDIT';
  customerName: string;
  customerAddress?: string;
  customerPhone?: string;
  sellerName: string;
  sellerOffice: string; // Nome do escritório que realizou a venda
  remainingBalance: number;
  installments?: Installment[];
}

export interface OfficeUnit {
  id: string;
  name: string;
  ownerEmail: string;
  referrerEmail?: string;
  revenue: number;
  active: boolean;
  status: 'NORMAL' | 'LATE_PAYMENT' | 'BLOCKED';
  expiryDate: string;
  pixKey?: string;
  phone?: string;
}
