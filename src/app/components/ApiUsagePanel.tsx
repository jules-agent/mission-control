"use client";

import { useCallback, useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type UsageData = {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  totalCost: number;
  messages: number;
  chartData?: { label: string; cost: number }[];
};

type Period = "today" | "week" | "month" | "total";

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 border border-white/10 rounded px-2 py-1 text-[10px]">
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
  const [activePeriod, setActivePeriod] = useState<Period>("total");
  const [source, setSource] = useState<string>("");

  const fetchUsage = useCallback(async () => {
    try {
      const response = await fetch("/api/usage", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      setUsage(data.usage);
      setSource(data.source || "unknown");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
    const interval = setInterval(fetchUsage, 30000);
    return () => clearInterval(interval);
  }, [fetchUsage]);

  const currentUsage = usage?.[activePeriod];
  const chartData = currentUsage?.chartData || [];

  return (
    <section className="glass rounded-xl p-3 h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-violet-400">📊</span>
          <h2 className="font-medium text-white text-sm">API Usage</h2>
          {source === "openclaw-session" && (
            <span className="px-1.5 py-0.5 rounded text-[8px] font-medium uppercase bg-emerald-500/20 text-emerald-400">LIVE</span>
          )}
        </div>
        <div className="flex gap-1 text-[10px]">
          {(["today", "week", "month", "total"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setActivePeriod(p)}
              className={`px-2 py-0.5 rounded ${activePeriod === p ? "bg-white/10 text-white" : "text-slate-500 hover:text-white"}`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      {loading ? (
        <div className="text-xs text-slate-500">Loading...</div>
      ) : currentUsage ? (
        <div className="space-y-2">
          {/* Chart */}
          {chartData.length > 0 && (
            <div className="h-20 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 9, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 9, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="cost" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fill="url(#costGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-800/40 rounded-lg p-2">
              <div className="text-[10px] text-slate-500 uppercase">Cost</div>
              <div className="text-lg font-bold text-emerald-400">${currentUsage.totalCost.toFixed(2)}</div>
            </div>
            <div className="bg-slate-800/40 rounded-lg p-2">
              <div className="text-[10px] text-slate-500 uppercase">Messages</div>
              <div className="text-lg font-bold text-cyan-400">{currentUsage.messages}</div>
            </div>
            <div className="bg-slate-800/40 rounded-lg p-2">
              <div className="text-[10px] text-slate-500 uppercase">Output</div>
              <div className="text-lg font-bold text-violet-400">{formatNumber(currentUsage.outputTokens)}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-xs text-slate-500">No data</div>
      )}
    </section>
  );
}
