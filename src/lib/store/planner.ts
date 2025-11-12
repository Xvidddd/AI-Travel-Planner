"use client";

import { create } from "zustand";
import { ItineraryPlan } from "@/types/itinerary";
import { ExpenseEntry } from "@/types/expense";

interface PlannerFormState {
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
  reset: () => void;
};

const defaultForm: PlannerFormState = {
  destination: "东京/箱根",
  days: 5,
  budget: 20000,
  personas: "家庭 + 孩子",
  preferences: "亲子, 美食, 温泉",
};

export const usePlannerStore = create<PlannerStore>((set) => ({
  form: defaultForm,
  transcript: "说出你的旅行想法，AuroraVoyage 即刻响应",
  setField: (key, value) =>
    set((state) => ({
      form: {
        ...state.form,
        [key]: value,
      },
    })),
  hydrateForm: (partial) =>
    set((state) => ({
      form: {
        ...state.form,
        ...partial,
      },
    })),
  setTranscript: (text) => set({ transcript: text }),
  setItinerary: (plan) => set({ itinerary: plan }),
  expenses: [],
  addExpense: (expense) =>
    set((state) => ({
      expenses: [expense, ...state.expenses],
    })),
  setExpenses: (expenses) => set({ expenses }),
  reset: () => set({ form: defaultForm, transcript: defaultForm.destination, itinerary: undefined }),
}));
