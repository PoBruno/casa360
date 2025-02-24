// filepath: /backend/backend/src/types/index.ts
export interface User {
    id: number;
    name: string;
    email: string;
    passwordHash: string;
}

export interface FinanceRecord {
    id: number;
    userId: number;
    amount: number;
    description: string;
    date: Date;
    category: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface ErrorResponse {
    message: string;
    statusCode: number;
}

export interface FinanceEntry {
  id?: number;
  userId: number;
  financeCcId: number;
  financeCategoryId: number;
  financePayerId: number;
  startDate: Date;
  paymentDay: number;
  description: string;
  installmentsCount: number;
  isRecurring: boolean;
}