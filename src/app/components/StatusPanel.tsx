"use client";

import { useCallback, useEffect, useState } from "react";
import { StatusCard } from "./StatusCard";
import type { StatusEntry } from "./types";

const REFRESH_INTERVAL = 60000;

export function StatusPanel() {
  const [statuses, setStatuses] = useState<StatusEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const fetchStatuses = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/status", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load status data.");
      }
      const data = (await response.json()) as { statuses: StatusEntry[] };
      setStatuses(data.statuses);
      setLastSync(new Date().toLocaleTimeString());
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
    <section className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6 shadow-xl shadow-slate-950/40">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-monoDisplay text-xl text-slate-100">System Status</h2>
          <p className="mt-1 text-xs text-slate-400">
            Live telemetry snapshot {lastSync ? `· synced ${lastSync}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={fetchStatuses}
          className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
          Initializing status feeds...
        </div>
      ) : error ? (
        <div className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/10 p-6 text-sm text-red-200">
          {error}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {statuses.map((status) => (
            <StatusCard key={status.id} {...status} />
          ))}
        </div>
      )}
    </section>
  );
}
