"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { usePlannerStore } from "@/lib/store/planner";

interface SavedItinerarySummary {
  id: string;
  title: string | null;
  destination: string | null;
  budget: number | null;
  inserted_at: string | null;
}

export function ItineraryListPanel() {
  const { user } = useAuth();
  const setItinerary = usePlannerStore((state) => state.setItinerary);
  const updateBudgetSnapshot = usePlannerStore((state) => state.updateBudgetSnapshot);
  const refreshToken = usePlannerStore((state) => state.itineraryRefreshKey);
  const [list, setList] = useState<SavedItinerarySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setList([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setStatus(null);
      try {
        const res = await fetch(`/api/itineraries?userId=${user.id}`);
        const data = (await res.json()) as { itineraries?: SavedItinerarySummary[]; error?: string };
        if (res.ok && data.itineraries) {
          if (!cancelled) setList(data.itineraries);
        } else if (!cancelled) {
          setStatus(data.error ?? "加载行程失败");
        }
      } catch (error) {
        if (!cancelled) setStatus((error as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [refreshToken, user]);

  const handleLoad = async (id: string) => {
    if (!user?.id) {
      setStatus("请先登录");
      return;
    }
    setStatus("正在加载行程...");
    try {
      const res = await fetch(`/api/itineraries?userId=${user.id}&itineraryId=${id}`);
      const data = (await res.json()) as { itinerary?: any; error?: string };
      if (!res.ok || data.error || !data.itinerary) {
        throw new Error(data.error ?? "未能加载行程");
      }
      setItinerary(data.itinerary);
      updateBudgetSnapshot(data.itinerary?.budget ?? 0);
      setStatus("行程已加载");
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user?.id) {
      setStatus("请先登录");
      return;
    }
    setDeletingId(id);
    setStatus(null);
    try {
      const res = await fetch("/api/itineraries", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, userId: user.id }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "删除失败");
      }
      setList((prev) => prev.filter((item) => item.id !== id));
      setStatus("行程已删除");
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-lg shadow-slate-200/40">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Itinerary Vault</p>
          <h3 className="text-xl font-semibold text-slate-800">历史行程</h3>
        </div>
      </header>
      {!user && <p className="text-sm text-slate-500">登录后查看已保存的行程。</p>}
      {user && (
        <div className="space-y-3 text-sm text-slate-600">
          {loading && <p className="text-xs text-slate-400">加载中...</p>}
          {list.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white/70 px-4 py-2"
            >
              <div>
                <p className="font-semibold text-slate-700">{item.title ?? item.destination ?? "未命名"}</p>
                <p className="text-xs text-slate-400">
                  {item.destination ?? "--"} · {item.budget ?? "--"} CNY ·
                  {item.inserted_at ? new Date(item.inserted_at).toLocaleString() : "--"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleLoad(item.id)}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:border-slate-400"
                >
                  加载
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-500 hover:border-red-400 disabled:opacity-50"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
          {!loading && user && !list.length && <p className="text-xs text-slate-400">暂无保存的行程</p>}
        </div>
      )}
      {status && <p className="mt-3 text-xs text-slate-500">{status}</p>}
    </section>
  );
}
