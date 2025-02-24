export interface FinanceFrequency {
  id?: number;
  name: string;
  days_interval: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface FinanceCC {
  id?: number;
  name: string;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface FinanceCategory {
  id?: number;
  name: string;
  parent_category_id?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface FinancePayer {
  id?: number;
  name: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface FinancePayerUser {
  finance_payer_id: number;
  user_id: number;
  percentage: number;
}

export interface FinanceEntry {
  id?: number;
  user_id: number;
  finance_cc_id: number;
  finance_category_id: number;
  finance_payer_id: number;
  finance_currency_id: number;
  finance_frequency_id?: number;
  is_income: boolean;
  amount: number;
  start_date: Date;
  end_date?: Date;
  description?: string;
  installments_count: number;
  is_fixed: boolean;
  is_recurring: boolean;
  payment_day?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface FinanceInstallment {
  id?: number;
  finance_entries_id: number;
  installment_number: number;
  due_date: Date;
  amount: number;
  status: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Transaction {
  id?: number;
  user_id: number;
  finance_installments_id: number;
  transaction_date?: Date;
  amount: number;
  is_income: boolean;
  description?: string;
  status?: string;
  created_at?: Date;
}
