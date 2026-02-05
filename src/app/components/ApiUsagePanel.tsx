"use client";

import { useCallback, useEffect, useState } from "react";

type ApiProvider = {
  id: string;
  name: string;
  requests: number;
  tokens: { input: number; output: number };
  cost: number;
  status: "active" | "idle" | "error";
};

type UsageData = {
  providers: ApiProvider[];
  totalCost: number;
  period: string;
};

const REFRESH_INTERVAL = 60000;

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
}

function formatCost(n: number): string {
  return "$" + n.toFixed(2);
}

function ProviderRow({ provider }: { provider: ApiProvider }) {
  const statusColors = {
    active: "bg-emerald-400",
    idle: "bg-slate-500",
    error: "bg-red-400",
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${statusColors[provider.status]}`} />
        <span className="text-xs text-slate-300">{provider.name}</span>
      </div>
      <div className="flex items-center gap-4 text-[10px]">
        <span className="text-slate-500">{formatNumber(provider.requests)} req</span>
        <span className="text-slate-500">{formatNumber(provider.tokens.input + provider.tokens.output)} tok</span>
        <span className="text-slate-300 font-medium w-14 text-right">{formatCost(provider.cost)}</span>
      </div>
    </div>
  );
}

export function ApiUsagePanel() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/usage", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load usage data");
      const data = await response.json();
      setUsage(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
    const interval = setInterval(fetchUsage, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchUsage]);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-xl shadow-slate-950/40">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-monoDisplay text-sm text-slate-100">API Usage</h2>
        {usage && (
          <span className="text-[10px] text-slate-500">{usage.period}</span>
        )}
      </div>

      {loading ? (
        <div className="text-xs text-slate-500">Loading...</div>
      ) : error ? (
        <div className="text-xs text-red-400">{error}</div>
      ) : usage ? (
        <>
          <div className="space-y-0">
            {usage.providers.map((provider) => (
              <ProviderRow key={provider.id} provider={provider} />
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-700 flex items-center justify-between">
            <span className="text-xs text-slate-400">Total</span>
            <span className="text-sm font-semibold text-slate-100">{formatCost(usage.totalCost)}</span>
          </div>
        </>
      ) : null}
    </section>
  );
}
