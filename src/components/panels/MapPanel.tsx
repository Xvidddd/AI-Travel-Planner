"use client";

import { useMemo } from "react";
import { usePlannerStore } from "@/lib/store/planner";

export function MapPanel() {
  const itinerary = usePlannerStore((state) => state.itinerary);
  const markers = useMemo(() => {
    if (!itinerary) {
      return [
        { id: "day1", name: "东京塔", time: "Day 1 AM" },
        { id: "day2", name: "浅草寺", time: "Day 1 PM" },
        { id: "day3", name: "箱根温泉", time: "Day 2" },
      ];
    }
    return itinerary.itinerary.flatMap((day) =>
      day.activities.slice(0, 3).map((activity, index) => ({
        id: `${day.day}-${index}`,
        name: activity.title,
        time: `Day ${day.day}`,
      })),
    );
  }, [itinerary]);

  return (
    <div className="flex h-[32rem] flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Aurora Map Canvas</p>
          <h2 className="text-2xl font-semibold text-slate-800">地图视图</h2>
        </div>
        <button className="rounded-full bg-slate-900/90 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white">
          路线预览
        </button>
      </div>
      <div className="relative flex-1 rounded-2xl bg-gradient-to-br from-[#bfe6ff] to-[#ecf4ff] shadow-inner">
        <div className="absolute inset-0 animate-pulse rounded-2xl border border-white/40"></div>
        <div className="relative h-full w-full p-6">
          <p className="text-sm text-slate-600">
            地图 SDK 接入后，此处将展示实时 POI、路线动画与 AuroraVoyage 专属浅色主题。
            当前展示 {itinerary ? "AI 行程" : "示例"} 标记。
          </p>
          <div className="mt-6 space-y-2 text-sm">
            {markers.map((marker) => (
              <div
                key={marker.id}
                className="flex items-center justify-between rounded-full bg-white/60 px-4 py-2 text-slate-700"
              >
                <span>{marker.name}</span>
                <span className="text-xs text-slate-500">{marker.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
