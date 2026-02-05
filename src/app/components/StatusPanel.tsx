"use client";

import { useCallback, useEffect, useState } from "react";
import type { StatusEntry } from "./types";

const REFRESH_INTERVAL = 60000;

const statusStyles: Record<StatusEntry["status"], { color: string; bg: string }> = {
  operational: { color: "text-emerald-400", bg: "bg-emerald-400" },
  degraded: { color: "text-amber-400", bg: "bg-amber-400" },
  down: { color: "text-red-400", bg: "bg-red-400" },
  pending: { color: "text-amber-400", bg: "bg-amber-400" }
};

export function StatusPanel() {
  const [statuses, setStatuses] = useState<StatusEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatuses = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/status", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load status data.");
      const data = (await response.json()) as { statuses: StatusEntry[] };
      setStatuses(data.statuses);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatuses();
    const interval = setInterval(fetchStatuses, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchStatuses]);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-xl shadow-slate-950/40">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-monoDisplay text-sm text-slate-100">System Status</h2>
        <button
          type="button"
          onClick={fetchStatuses}
          className="text-[10px] text-slate-500 hover:text-slate-300"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-xs text-slate-500">Loading...</div>
      ) : error ? (
        <div className="text-xs text-red-400">{error}</div>
      ) : (
        <div className="space-y-0">
          {statuses.map((status) => {
            const style = statusStyles[status.status];
            return (
              <div key={status.id} className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${style.bg}`} />
                  <span className="text-xs text-slate-300">{status.service}</span>
                </div>
                <span className={`text-[10px] ${style.color}`}>
                  {status.status === "operational" ? "OK" : status.status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
