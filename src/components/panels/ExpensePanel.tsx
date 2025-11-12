"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePlannerStore } from "@/lib/store/planner";
import { useAuth } from "@/components/auth/AuthProvider";
import type { ExpenseCategory, ExpenseEntry } from "@/types/expense";

const categories: ExpenseCategory[] = ["餐饮", "交通", "住宿", "娱乐", "购物", "其他"];

export function ExpensePanel() {
  const expenses = usePlannerStore((state) => state.expenses);
  const addExpense = usePlannerStore((state) => state.addExpense);
  const setExpenses = usePlannerStore((state) => state.setExpenses);
  const removeExpense = usePlannerStore((state) => state.removeExpense);
  const { user, loading: authLoading } = useAuth();
  const [category, setCategory] = useState<ExpenseCategory>("餐饮");
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [loadingExpenses, setLoadingExpenses] = useState(false);

  useEffect(() => {
    if (authLoading || !user?.id) return;
    let cancelled = false;
    const load = async () => {
      setLoadingExpenses(true);
      try {
        const res = await fetch(`/api/expenses?userId=${user.id}`);
        const data = (await res.json()) as {
          expenses?: ExpenseEntry[];
          warning?: string;
          error?: string;
        };
        if (res.ok && data.expenses) {
          setExpenses(data.expenses);
          if (data.warning && !cancelled) {
            setStatus(data.warning);
          }
        } else if (!cancelled) {
          setStatus(data.error ?? "加载记账记录失败");
        }
      } catch (error) {
        if (!cancelled) setStatus((error as Error).message);
      } finally {
        if (!cancelled) setLoadingExpenses(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [authLoading, setExpenses, user]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (amount <= 0) {
      setStatus("金额需大于 0");
      return;
    }
    setSubmitting(true);
    setStatus("记录中...");
    if (!user?.id) {
      setStatus("请先登录再记账");
      setSubmitting(false);
      return;
    }
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, amount, note, userId: user.id }),
      });
      const data = (await res.json()) as { expense?: any; error?: string; warning?: string };
      if (data.expense) {
        addExpense(data.expense);
        setStatus(data.warning ? `已记录（警告：${data.warning})` : "已记录");
        setAmount(0);
        setNote("");
      } else {
        throw new Error(data.error ?? "未知错误");
      }
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user?.id) {
      setStatus("请先登录");
      return;
    }
    removeExpense(id);
    try {
      await fetch("/api/expenses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, userId: user.id }),
      });
    } catch (error) {
      console.error("删除记账失败", error);
    }
  };

  return (
    <section className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-lg shadow-slate-200/40">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Expense Log</p>
          <h3 className="text-xl font-semibold text-slate-800">语音记账 / 快速记账</h3>
        </div>
      </header>
      <form onSubmit={handleSubmit} className="grid gap-3 lg:grid-cols-[1.2fr_1.2fr_1fr]">
        <label className="text-sm text-slate-600">
          金额 (¥)
          <input
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-2 text-slate-700 focus:border-aurora-blue focus:outline-none"
          />
        </label>
        <label className="text-sm text-slate-600">
          分类
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-2 text-slate-700 focus:border-aurora-blue focus:outline-none"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-600 lg:col-span-3">
          备注
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-2 text-slate-700 focus:border-aurora-blue focus:outline-none"
            placeholder="例如：东京塔门票"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-2xl bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] py-2 text-sm font-semibold text-white disabled:opacity-60 lg:col-span-3"
        >
          {submitting ? "记录中..." : "保存记账"}
        </button>
      </form>
      {status && <p className="mt-2 text-xs text-slate-500">{status}</p>}
      <div className="mt-4 space-y-2 text-sm text-slate-600">
        {expenses.slice(0, 5).map((expense) => (
          <div
            key={expense.id}
            className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-2"
          >
            <div>
              <p className="font-semibold text-slate-700">{expense.category}</p>
              {expense.note && <p className="text-xs text-slate-400">{expense.note}</p>}
            </div>
            <div className="flex items-center gap-3 text-right">
              <div>
                <p className="font-semibold text-slate-800">¥{expense.amount.toFixed(2)}</p>
                <p className="text-xs text-slate-400">{new Date(expense.createdAt).toLocaleString()}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(expense.id)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                删除
              </button>
            </div>
          </div>
        ))}
        {!loadingExpenses && !expenses.length && <p className="text-xs text-slate-400">暂无记账记录</p>}
        {loadingExpenses && <p className="text-xs text-slate-400">加载中...</p>}
      </div>
    </section>
  );
}
