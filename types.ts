// FIX: Define Currency type and remove circular import.
export type Currency = 'IQD' | 'USD';

export type InstallmentStatus = 'paid' | 'unpaid' | 'partially_paid' | 'on_hold';

export interface Installment {
  id: string;
  dueDate: string;
  amount: number;
  amountPaid: number;
  status: InstallmentStatus;
  paidAt?: string;
}

// New type for pricing plans
export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  totalPrice: number;
  downPayment: number;
  installmentsCount: number;
}

export interface CatalogProduct {
  id: string;
  name: string;
  totalPrice: number; // Kept for backward compatibility and as a default/base price
  productPhoto?: string; // base64 string
  category?: string; // e.g., 'electronics', 'furniture'
  createdAt: string;
  plans?: PricingPlan[]; // Array of available pricing plans
}

export interface Product {
  id: string;
  portalId: string; // Unique ID for the customer portal link
  catalogProductId: string; // Link to the central product
  name: string; // Can be customized per-purchase
  productPhoto?: string; // base64 string, can be customized
  totalPrice: number; // Price at the time of purchase, from the plan
  downPayment: number; // From the plan
  installmentsCount: number; // From the plan
  installments: Installment[];
  createdAt: string;
  planName?: string; // Name of the chosen plan
}

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  address: string;
  idPhoto?: string; // base64 string
  products: Product[];
  createdAt: string;
}

export interface DailyReminderLogItem {
  customerName: string;
  customerId: string;
  productName: string;
  sentAt: string; // ISO string
}

export interface DailyReminderLog {
  date: string; // 'YYYY-MM-DD'
  reminders: DailyReminderLogItem[];
}

// New type for expenses
export type ExpenseCategory = 'rent' | 'salaries' | 'bills' | 'supplies' | 'marketing' | 'other';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: string; // 'YYYY-MM-DD'
  createdAt: string;
  isRecurring?: boolean;
}

// New type for shop information
export interface ShopInfo {
  name: string;
  address: string;
  phone: string;
  logo?: string; // base64 string
}

export interface UserProfile {
  shopInfo: ShopInfo;
}

// User authentication and authorization type
export interface User {
  id: string; // UID
  email: string; // Used for login
  password?: string;
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: string; // ISO string for trial calculation
}


// Centralized types for settings
export type Theme = 'light' | 'dark';

export interface Settings {
  currency: Currency;
  theme: Theme;
  soundEffects: boolean;
  expenseThresholdEnabled: boolean;
  expenseThresholdAmount: number;
  recurringExpenseReminderEnabled: boolean;
  recurringExpenseReminderDays: number;
}