"use client";

import { useCallback, useEffect, useState } from "react";

type StatusEntry = {
  id: string;
  service: string;
  status: "operational" | "degraded" | "down" | "pending";
  latencyMs?: number;
  lastChecked: string;
  error?: string;
};

const statusConfig: Record<StatusEntry["status"], { color: string; bg: string; label: string; icon: string }> = {
  operational: { 
    color: "text-emerald-400", 
    bg: "bg-emerald-500/20", 
    label: "Operational",
    icon: "✓"
  },
  degraded: { 
    color: "text-amber-400", 
    bg: "bg-amber-500/20", 
    label: "Degraded",
    icon: "!"
  },
  down: { 
    color: "text-red-400", 
    bg: "bg-red-500/20", 
    label: "Down",
    icon: "×"
  },
  pending: { 
    color: "text-slate-400", 
    bg: "bg-slate-500/20", 
    label: "Pending",
    icon: "○"
  }
};

export function StatusPanel() {
  const [statuses, setStatuses] = useState<StatusEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchStatuses = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/status", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load status data.");
      const data = (await response.json()) as { statuses: StatusEntry[] };
      setStatuses(data.statuses);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
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
  const totalCount = statuses.length;

  return (
    <section className="glass rounded-2xl p-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-white">System Status</h2>
            <p className="text-xs text-slate-500">
              {operationalCount}/{totalCount} services healthy
            </p>
          </div>
        </div>
        <button
          onClick={fetchStatuses}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors group"
          title="Refresh"
        >
          <svg className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : (
        <div className="space-y-2">
          {statuses.map((status) => {
            const config = statusConfig[status.status];
            return (
              <div 
                key={status.id} 
                className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-lg ${config.bg} flex items-center justify-center text-xs font-bold ${config.color}`}>
                    {config.icon}
                  </span>
                  <span className="text-sm text-slate-200">{status.service}</span>
                </div>
                <div className="flex items-center gap-3">
                  {status.latencyMs !== undefined && (
                    <span className="text-xs text-slate-500 font-mono">
                      {status.latencyMs}ms
                    </span>
                  )}
                  <span className={`text-xs font-medium ${config.color}`}>
                    {config.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
        <span className="text-[10px] text-slate-600 uppercase tracking-wider">Auto-refresh: 60s</span>
        <span className="text-[10px] text-slate-600">
          Updated {lastRefresh.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
        </span>
      </div>
    </section>
  );
}
