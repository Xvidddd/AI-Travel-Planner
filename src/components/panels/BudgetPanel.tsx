"use client";

import { usePlannerStore } from "@/lib/store/planner";
import { ExpensePanel } from "@/components/panels/ExpensePanel";

export function BudgetPanel() {
  const itinerary = usePlannerStore((state) => state.itinerary);
  const activeItineraryId = usePlannerStore((state) => state.activeItineraryId);
  const budgetSnapshot = usePlannerStore((state) => state.budgetSnapshot);
  const percent = Math.round((budgetSnapshot.used / (budgetSnapshot.total || 1)) * 100);

  return (
    <section className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-lg shadow-slate-200/40">
      <header className="mb-4">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Budget Radar</p>
        <h3 className="text-xl font-semibold text-slate-800">预算面板</h3>
      </header>
      {!activeItineraryId && (
        <p className="mb-3 text-xs text-slate-500">请选择或加载行程后可查看专属预算与记账情况。</p>
      )}
      <div className="flex flex-col gap-4">
        <div>
          <div className="flex items-baseline justify-between text-slate-700">
            <span className="text-sm font-medium">总预算 ¥{budgetSnapshot.total.toLocaleString()}</span>
            <span className="text-sm">已使用 ¥{budgetSnapshot.used.toLocaleString()}</span>
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
          {Object.entries(budgetSnapshot.byCategory).map(([name, amount]) => (
            <li key={name} className="flex items-center justify-between rounded-full bg-white/90 px-4 py-2">
              <span>{name}</span>
              <span>¥{amount.toLocaleString()}</span>
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
