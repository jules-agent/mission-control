"use client";

import { useCallback, useEffect, useState } from "react";

type StatusEntry = {
  id: string;
  service: string;
  status: "operational" | "degraded" | "down" | "pending";
  latencyMs?: number;
};

const statusConfig: Record<StatusEntry["status"], { color: string; icon: string }> = {
  operational: { color: "text-emerald-400", icon: "✓" },
  degraded: { color: "text-amber-400", icon: "!" },
  down: { color: "text-red-400", icon: "×" },
  pending: { color: "text-slate-400", icon: "○" }
};

export function StatusPanel() {
  const [statuses, setStatuses] = useState<StatusEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStatuses = useCallback(async () => {
    try {
      const response = await fetch("/api/status", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { statuses: StatusEntry[] };
      setStatuses(data.statuses);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatuses();
    const interval = setInterval(fetchStatuses, 60000);
    return () => clearInterval(interval);
  }, [fetchStatuses]);

  const operationalCount = statuses.filter(s => s.status === "operational").length;

  return (
    <section className="glass rounded-xl p-3 h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400">●</span>
          <h2 className="font-medium text-white text-sm">Status</h2>
          <span className="text-xs text-slate-500">{operationalCount}/{statuses.length}</span>
        </div>
        <button onClick={fetchStatuses} className="text-slate-500 hover:text-white text-xs">↻</button>
      </div>
      {loading ? (
        <div className="text-xs text-slate-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {statuses.map((status) => {
            const config = statusConfig[status.status];
            return (
              <div key={status.id} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`text-xs ${config.color}`}>{config.icon}</span>
                  <span className="text-xs text-slate-300 truncate">{status.service}</span>
                </div>
                {status.latencyMs !== undefined && (
                  <span className="text-[10px] text-slate-600 ml-1">{status.latencyMs}ms</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
