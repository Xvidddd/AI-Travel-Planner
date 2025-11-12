"use client";

import { usePlannerStore } from "@/lib/store/planner";
import { ExpensePanel } from "@/components/panels/ExpensePanel";

export function BudgetPanel() {
  const itinerary = usePlannerStore((state) => state.itinerary);
  const budgetSummary = itinerary
    ? {
        total: itinerary.budget,
        used: Math.round(itinerary.budget * 0.4),
        categories: [
          { name: "餐饮", amount: Math.round(itinerary.budget * 0.12) },
          { name: "交通", amount: Math.round(itinerary.budget * 0.1) },
          { name: "住宿", amount: Math.round(itinerary.budget * 0.15) },
          { name: "娱乐", amount: Math.round(itinerary.budget * 0.03) },
        ],
      }
    : {
        total: 20000,
        used: 8600,
        categories: [
          { name: "餐饮", amount: 2200 },
          { name: "交通", amount: 1800 },
          { name: "住宿", amount: 3200 },
          { name: "娱乐", amount: 1400 },
        ],
      };
  const percent = Math.round((budgetSummary.used / budgetSummary.total) * 100);

  return (
    <section className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-lg shadow-slate-200/40">
      <header className="mb-4">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Budget Radar</p>
        <h3 className="text-xl font-semibold text-slate-800">预算面板</h3>
      </header>
      <div className="flex flex-col gap-4">
        <div>
          <div className="flex items-baseline justify-between text-slate-700">
            <span className="text-sm font-medium">总预算 ¥{budgetSummary.total.toLocaleString()}</span>
            <span className="text-sm">已使用 ¥{budgetSummary.used.toLocaleString()}</span>
          </div>
          <div className="mt-2 h-3 w-full rounded-full bg-slate-100">
            <div
              className={`h-3 rounded-full bg-gradient-to-r ${percent > 80 ? "from-[#3B82F6] via-[#F97316] to-[#F97316]" : "from-[#3B82F6] to-[#06B6D4]"}`}
              style={{ width: `${percent}%` }}
            ></div>
          </div>
          <p className="mt-1 text-right text-xs text-slate-500">{percent}% 已使用</p>
        </div>
        <ul className="space-y-2 text-sm text-slate-600">
          {budgetSummary.categories.map((category) => (
            <li key={category.name} className="flex items-center justify-between rounded-full bg-white/90 px-4 py-2">
              <span>{category.name}</span>
              <span>¥{category.amount.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-6 border-t border-slate-100/70 pt-6">
        <ExpensePanel />
      </div>
    </section>
  );
}
