"use client";

import { create } from "zustand";
import { ItineraryPlan } from "@/types/itinerary";
import { ExpenseEntry, BudgetSnapshot, ExpenseCategory } from "@/types/expense";

interface PlannerFormState {
  title: string;
  destination: string;
  days: number;
  budget: number;
  personas: string;
  preferences: string;
}

type PlannerStore = {
  form: PlannerFormState;
  transcript: string;
  itinerary?: ItineraryPlan;
  setField: <K extends keyof PlannerFormState>(key: K, value: PlannerFormState[K]) => void;
  hydrateForm: (partial: Partial<PlannerFormState>) => void;
  setTranscript: (text: string) => void;
  setItinerary: (plan: ItineraryPlan) => void;
  expenses: ExpenseEntry[];
  addExpense: (expense: ExpenseEntry) => void;
  setExpenses: (expenses: ExpenseEntry[]) => void;
  removeExpense: (id: string) => void;
  budgetSnapshot: BudgetSnapshot;
  updateBudgetSnapshot: (totalBudget?: number) => void;
  activeItineraryId?: string;
  itineraryRefreshKey: number;
  bumpItineraryRefresh: () => void;
  reset: () => void;
};

const defaultForm: PlannerFormState = {
  title: "我的行程",
  destination: "东京/箱根",
  days: 5,
  budget: 20000,
  personas: "家庭 + 孩子",
  preferences: "亲子, 美食, 温泉",
};

export const usePlannerStore = create<PlannerStore>((set, get) => ({
  form: defaultForm,
  transcript: "说出你的旅行想法，AuroraVoyage 即刻响应",
  setField: (key, value) =>
    set((state) => {
      const nextForm = {
        ...state.form,
        [key]: value,
      };
      return {
        form: nextForm,
        ...(key === "budget"
          ? { budgetSnapshot: computeBudgetSnapshot(state.expenses, Number(value)) }
          : {}),
      };
    }),
  hydrateForm: (partial) =>
    set((state) => ({
      form: {
        ...state.form,
        ...partial,
      },
    })),
  setTranscript: (text) => set({ transcript: text }),
  setItinerary: (plan) =>
    set((state) => {
      const nextForm: PlannerFormState = {
        ...state.form,
        title: plan.title ?? state.form.title,
        destination: plan.destination ?? state.form.destination,
        days: plan.days ?? state.form.days,
        budget: plan.budget ?? state.form.budget,
        personas: state.form.personas,
        preferences: state.form.preferences,
      };
      return {
        itinerary: plan,
        activeItineraryId: plan.id ?? state.activeItineraryId,
        form: nextForm,
        budgetSnapshot: computeBudgetSnapshot(state.expenses, nextForm.budget),
      };
    }),
  expenses: [],
  addExpense: (expense) =>
    set((state) => {
      const nextExpenses = [expense, ...state.expenses];
      return {
        expenses: nextExpenses,
        budgetSnapshot: computeBudgetSnapshot(nextExpenses, state.form.budget),
      };
    }),
  setExpenses: (expenses) =>
    set((state) => ({
      expenses,
      budgetSnapshot: computeBudgetSnapshot(expenses, state.form.budget),
    })),
  removeExpense: (id) =>
    set((state) => {
      const nextExpenses = state.expenses.filter((expense) => expense.id !== id);
      return {
        expenses: nextExpenses,
        budgetSnapshot: computeBudgetSnapshot(nextExpenses, state.form.budget),
      };
    }),
  budgetSnapshot: computeBudgetSnapshot([], defaultForm.budget),
  updateBudgetSnapshot: (overrideTotal) =>
    set((state) => ({
      budgetSnapshot: computeBudgetSnapshot(state.expenses, overrideTotal ?? state.form.budget),
    })),
  activeItineraryId: undefined,
  itineraryRefreshKey: 0,
  bumpItineraryRefresh: () =>
    set((state) => ({
      itineraryRefreshKey: state.itineraryRefreshKey + 1,
    })),
  reset: () =>
    set({
      form: defaultForm,
      transcript: defaultForm.destination,
      itinerary: undefined,
      activeItineraryId: undefined,
      expenses: [],
      budgetSnapshot: computeBudgetSnapshot([], defaultForm.budget),
    }),
}));

function computeBudgetSnapshot(expenses: ExpenseEntry[], totalBudget: number): BudgetSnapshot {
  const categoryTotals: Record<ExpenseCategory, number> = {
    餐饮: 0,
    交通: 0,
    住宿: 0,
    娱乐: 0,
    购物: 0,
    其他: 0,
  };
  let used = 0;
  expenses.forEach((expense) => {
    used += expense.amount;
    categoryTotals[expense.category] += expense.amount;
  });
  const remaining = Math.max(totalBudget - used, 0);
  const usagePercent = totalBudget > 0 ? Math.min((used / totalBudget) * 100, 100) : 0;
  return {
    total: totalBudget,
    used,
    remaining,
    usagePercent,
    byCategory: categoryTotals,
  };
}
