"use client";

import { useState, useTransition } from "react";
import { usePlannerStore } from "@/lib/store/planner";
import { ItineraryPlan } from "@/types/itinerary";

async function requestPlan(form: {
  destination: string;
  days: number;
  budget: number;
  personas: string;
  preferences: string;
}) {
  const payload = {
    destination: form.destination,
    days: Number(form.days),
    budget: Number(form.budget),
    personas: form.personas.split(/[，,]/).map((s) => s.trim()).filter(Boolean),
    preferences: form.preferences.split(/[，,]/).map((s) => s.trim()).filter(Boolean),
  };

  const res = await fetch("/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("AI 规划请求失败");
  }

  const data = (await res.json()) as {
    summary: string;
    days: Array<{
      day: number;
      focus: string;
      items: Array<{
        title?: string;
        detail?: string;
        poi?: string;
        address?: string;
        lat?: number;
        lng?: number;
      }>;
    }>;
  };

  const plan: ItineraryPlan = {
    destination: payload.destination,
    days: payload.days,
    budget: payload.budget,
    personas: payload.personas,
    preferences: payload.preferences,
    summary: data.summary,
    itinerary: data.days.map((day) => ({
      day: day.day,
      summary: day.focus,
      activities: day.items.map((item, index) => ({
        title: item.title ?? `活动 ${index + 1}`,
        detail: item.detail ?? item.title ?? "AI 生成内容",
        time: `Day ${day.day}`,
        poi: item.poi,
        address: item.address,
        lat: typeof item.lat === "number" ? item.lat : undefined,
        lng: typeof item.lng === "number" ? item.lng : undefined,
      })),
    })),
    currency: "CNY",
    title: `${payload.destination} AI 行程`,
  };

  return plan;
}

async function persistPlan(plan: ItineraryPlan) {
  const res = await fetch("/api/itineraries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(plan),
  });

  const json = (await res.json().catch(() => ({}))) as { itineraryId?: string; error?: string };

  if (!res.ok) {
    throw new Error(json?.error ?? "Supabase 持久化失败");
  }

  return json;
}

export function PlannerPanel() {
  const { form, setField, setItinerary } = usePlannerStore();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    const nextForm = {
      destination: String(formData.get("destination") ?? form.destination),
      days: Number(formData.get("days") ?? form.days),
      budget: Number(formData.get("budget") ?? form.budget),
      personas: String(formData.get("personas") ?? form.personas),
      preferences: String(formData.get("preferences") ?? form.preferences),
    };

    startTransition(async () => {
      try {
        const plan = await requestPlan(nextForm);
        setItinerary(plan);
        setStatus("AI 行程生成成功，正在写入 Supabase...");
        try {
          const { itineraryId } = await persistPlan(plan);
          if (itineraryId) {
            setStatus(`已保存至 Supabase (ID: ${itineraryId.slice(0, 8)}…)`);
          } else {
            setStatus("AI 行程生成成功，但未返回行程 ID");
          }
        } catch (persistError) {
          console.error(persistError);
          const message =
            persistError instanceof Error ? persistError.message : "未知原因";
          setStatus(`AI 行程生成成功，但写入 Supabase 失败：${message}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "未知错误");
        setStatus(null);
      }
    });
  };

  return (
    <section className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-lg shadow-slate-200/40">
      <header className="mb-4">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Mission Control</p>
        <h3 className="text-xl font-semibold text-slate-800">行程需求</h3>
      </header>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="text-sm text-slate-600">
            目的地
            <input
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-2 text-slate-700 focus:border-aurora-blue focus:outline-none"
              name="destination"
              value={form.destination}
              onChange={(e) => setField("destination", e.target.value)}
            />
          </label>
          <label className="text-sm text-slate-600">
            出行天数
            <input
              type="number"
              min={1}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-2 text-slate-700 focus:border-aurora-blue focus:outline-none"
              name="days"
              value={form.days}
              onChange={(e) => setField("days", Number(e.target.value))}
            />
          </label>
          <label className="text-sm text-slate-600">
            预算 (CNY)
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-2 text-slate-700 focus:border-aurora-blue focus:outline-none"
              name="budget"
              value={form.budget}
              onChange={(e) => setField("budget", Number(e.target.value))}
            />
          </label>
          <label className="text-sm text-slate-600">
            同行角色
            <input
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-2 text-slate-700 focus:border-aurora-blue focus:outline-none"
              name="personas"
              value={form.personas}
              onChange={(e) => setField("personas", e.target.value)}
            />
          </label>
        </div>
        <label className="text-sm text-slate-600">
          偏好标签（逗号分隔）
          <textarea
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-2 text-slate-700 focus:border-aurora-blue focus:outline-none"
            name="preferences"
            rows={3}
            value={form.preferences}
            onChange={(e) => setField("preferences", e.target.value)}
          />
        </label>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {status && !error && <p className="text-sm text-emerald-600">{status}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="h-12 w-full rounded-full bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] text-sm font-semibold uppercase tracking-wide text-white disabled:opacity-60"
        >
          {isPending ? "AI 正在规划..." : "生成 AI 行程"}
        </button>
      </form>
    </section>
  );
}
