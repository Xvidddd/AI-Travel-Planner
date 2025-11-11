"use client";

import { AuroraMap } from "@/components/map/AuroraMap";

export function MapPanel() {

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
      <div className="relative flex-1 overflow-hidden rounded-2xl shadow-inner">
        <AuroraMap className="h-full" />
      </div>
    </div>
  );
}
