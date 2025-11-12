export type ExpenseCategory =
  | "餐饮"
  | "交通"
  | "住宿"
  | "娱乐"
  | "购物"
  | "其他";

export interface ExpenseEntry {
  id: string;
  category: ExpenseCategory;
  amount: number;
  note?: string;
  createdAt: string;
}

export interface BudgetSnapshot {
  total: number;
  used: number;
  remaining: number;
  usagePercent: number;
  byCategory: Record<ExpenseCategory, number>;
}
