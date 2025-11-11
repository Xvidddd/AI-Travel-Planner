"use client";

import { usePlannerStore } from "@/lib/store/planner";

const demoItinerary = [
  {
    day: "Day 1",
    summary: "东京抵达 · 亲子城市漫游",
    items: ["入住银座日航酒店", "午餐：筑地市场海鲜", "傍晚：teamLab Planets"],
  },
  {
    day: "Day 2",
    summary: "箱根温泉 · 湖畔小火车",
    items: ["大涌谷缆车", "箱根露天博物馆", "星空温泉晚餐"],
  },
];

export function TimelinePanel() {
  const itinerary = usePlannerStore((state) => state.itinerary);
  const content = itinerary
    ? itinerary.itinerary.map((day) => ({
        day: `Day ${day.day}`,
        summary: day.summary,
        items: day.activities.map((activity) => activity.detail),
      }))
    : demoItinerary;

  return (
    <section className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-lg shadow-slate-200/40">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Journey Stack</p>
          <h3 className="text-xl font-semibold text-slate-800">行程时间线</h3>
        </div>
        <button className="text-xs font-semibold text-slate-500 underline">查看全部</button>
      </header>
      <ol className="space-y-5">
        {content.map((day) => (
          <li key={day.day} className="rounded-2xl border border-slate-100/80 bg-white/90 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                {day.day}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
                {itinerary ? "AI 版本 beta" : "示例"}
              </span>
            </div>
            <p className="mt-1 text-base font-medium text-slate-700">{day.summary}</p>
            <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-slate-600">
              {day.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}
