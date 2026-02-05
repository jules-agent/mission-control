"use client";

import { useCallback, useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type UsageData = {
  period: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  totalCost: number;
  messages: number;
  chartData: { label: string; cost: number }[];
};

type Period = "today" | "week" | "month" | "total";

const PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "total", label: "Total" },
];

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function formatCost(cost: number): string {
  return "$" + cost.toFixed(2);
}

// Custom tooltip for the chart
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 border border-white/10 rounded-lg px-3 py-2 text-xs">
        <p className="text-slate-400">{label}</p>
        <p className="text-emerald-400 font-semibold">${payload[0].value.toFixed(2)}</p>
      </div>
    );
  }
  return null;
}

export function ApiUsagePanel() {
  const [usage, setUsage] = useState<Record<Period, UsageData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePeriod, setActivePeriod] = useState<Period>("total");
  const [source, setSource] = useState<string>("");

  const fetchUsage = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/usage", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load usage data.");
      const data = await response.json();
      setUsage(data.usage);
      setSource(data.source || "unknown");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
    const interval = setInterval(fetchUsage, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchUsage]);

  const currentUsage = usage?.[activePeriod];

  return (
    <section className="glass rounded-2xl p-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-white">API Usage</h2>
            <p className="text-xs text-slate-500">
              {source === "openclaw-session" ? "Live from OpenClaw" : "Token consumption & costs"}
            </p>
          </div>
        </div>
        {source === "openclaw-session" && (
          <span className="px-2 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            REAL DATA
          </span>
        )}
      </div>

      {/* Period tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] mb-4">
        {PERIODS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActivePeriod(key)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
              activePeriod === key
                ? "bg-white/10 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : currentUsage ? (
        <div className="space-y-4">
          {/* Cost + Chart */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Cost</p>
                <p className="text-2xl font-bold text-gradient-brand">{formatCost(currentUsage.totalCost)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 mb-1">{currentUsage.messages} messages</p>
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Chart */}
            {currentUsage.chartData && currentUsage.chartData.length > 0 && (
              <div className="h-20 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={currentUsage.chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="label" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 9 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 9 }}
                      tickFormatter={(v) => `$${v}`}
                      width={35}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="cost" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      fill="url(#costGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Output Tokens (primary) */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Output Tokens</p>
              <p className="text-lg font-semibold text-emerald-400">{formatNumber(currentUsage.outputTokens)}</p>
            </div>

            {/* Input Tokens */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Input Tokens</p>
              <p className="text-lg font-semibold text-blue-400">{formatNumber(currentUsage.inputTokens)}</p>
            </div>

            {/* Cache Read */}
            {currentUsage.cacheReadTokens !== undefined && currentUsage.cacheReadTokens > 0 && (
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Cache Read</p>
                <p className="text-lg font-semibold text-cyan-400">{formatNumber(currentUsage.cacheReadTokens)}</p>
              </div>
            )}

            {/* Cache Write */}
            {currentUsage.cacheWriteTokens !== undefined && currentUsage.cacheWriteTokens > 0 && (
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Cache Write</p>
                <p className="text-lg font-semibold text-amber-400">{formatNumber(currentUsage.cacheWriteTokens)}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500 text-sm">No usage data available</div>
      )}
    </section>
  );
}
