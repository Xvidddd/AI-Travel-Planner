import { MapPanel } from "@/components/panels/MapPanel";
import { TimelinePanel } from "@/components/panels/TimelinePanel";
import { BudgetPanel } from "@/components/panels/BudgetPanel";
import { PlannerPanel } from "@/components/panels/PlannerPanel";
import { ItineraryListPanel } from "@/components/panels/ItineraryListPanel";

export default function HomePage() {
  return (
    <section className="grid gap-6 lg:grid-cols-[3fr_2fr]">
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-xl shadow-slate-200/30">
          <MapPanel />
        </div>
        <div className="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-xl shadow-slate-200/30">
          <TimelinePanel />
        </div>
      </div>
      <div className="space-y-6">
        <PlannerPanel />
        <ItineraryListPanel />
        <BudgetPanel />
      </div>
    </section>
  );
}
