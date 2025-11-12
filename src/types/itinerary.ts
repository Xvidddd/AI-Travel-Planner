export type PreferenceTag = "美食" | "亲子" | "自然" | "文化" | "探险" | "轻奢" | string;

export interface ActivityItem {
  title: string;
  detail: string;
  time: string;
  location?: string;
  costEstimate?: number;
  poi?: string;
  address?: string;
  lat?: number;
  lng?: number;
}

export interface DayPlan {
  day: number;
  summary: string;
  activities: ActivityItem[];
}

export interface BudgetBreakdown {
  category: string;
  amount: number;
}

export interface ItineraryPlan {
  id?: string;
  destination: string;
  days: number;
  budget: number;
  personas: string[];
  preferences: PreferenceTag[];
  summary: string;
  itinerary: DayPlan[];
  currency?: string;
  title?: string;
  userId?: string;
  budgetDetail?: BudgetBreakdown[];
}
