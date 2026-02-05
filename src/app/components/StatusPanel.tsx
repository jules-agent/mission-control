"use client";

import { useCallback, useEffect, useState } from "react";

type StatusEntry = {
  id: string;
  service: string;
  status: "operational" | "degraded" | "down" | "pending";
  latencyMs?: number;
  error?: string;
};

const statusConfig: Record<StatusEntry["status"], { color: string; icon: string; shortDesc: string }> = {
  operational: { color: "text-emerald-400", icon: "✓", shortDesc: "" },
  degraded: { color: "text-amber-400", icon: "!", shortDesc: "degraded" },
  down: { color: "text-red-400", icon: "×", shortDesc: "down" },
  pending: { color: "text-slate-400", icon: "○", shortDesc: "pending" }
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
            const hasError = status.status !== "operational" && status.status !== "pending";
            const shortError = status.error ? status.error.split(" ").slice(0, 3).join(" ") : config.shortDesc;
            const fullError = status.error || config.shortDesc;
            
            return (
              <div 
                key={status.id} 
                className="flex items-center justify-between py-1 group relative"
                title={hasError ? fullError : undefined}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`text-xs ${config.color}`}>{config.icon}</span>
                  <span className="text-xs text-slate-300 truncate">{status.service}</span>
                  {hasError && (
                    <span className={`text-[9px] ${config.color} truncate max-w-[60px]`}>
                      ({shortError})
                    </span>
                  )}
                </div>
                {status.latencyMs !== undefined && status.status === "operational" && (
                  <span className="text-[10px] text-slate-600 ml-1">{status.latencyMs}ms</span>
                )}
                {/* Tooltip on hover */}
                {hasError && (
                  <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-50 pointer-events-none">
                    <div className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 whitespace-nowrap shadow-lg">
                      <span className={config.color}>{status.service}:</span> {fullError}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
