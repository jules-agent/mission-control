"use client";

import { useEffect, useState } from "react";

type ModelStatus = {
  name: string;
  role: string;
  icon: string;
  status: "active" | "standby";
};

type AgentStatus = {
  activeModel: string;
  models: ModelStatus[];
  lastUpdated: string;
  source: string;
};

export function ModelWorkflowPanel() {
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/agent-status", {
        signal: AbortSignal.timeout(10000),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setStatus(data);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
      // Keep existing status on error, don't clear it
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Poll every 30 seconds for live updates
    const interval = setInterval(fetchStatus, 30000);
    
    // Also refresh when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchStatus();
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Default models while loading
  const models = status?.models || [
    { name: "Kimi K2.5", role: "Default / Day-to-Day", icon: "💬", status: "standby" },
    { name: "Opus 4.5", role: "Complex Tasks", icon: "🧠", status: "standby" },
    { name: "Codex CLI", role: "Development", icon: "⚡", status: "standby" },
  ];

  return (
    <section className="glass rounded-xl p-2">
      <div className="flex items-center justify-between mb-2 px-1">
        <h2 className="text-xs font-medium text-slate-400">Model Workflow</h2>
        <div className="flex items-center gap-2">
          {loading && (
            <span className="text-[10px] text-slate-500 animate-pulse">●</span>
          )}
          {error && (
            <span className="text-[10px] text-red-400" title={error}>⚠</span>
          )}
          <button
            onClick={fetchStatus}
            className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
            title="Refresh now"
          >
            ↻
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {models.map((model) => (
          <div
            key={model.name}
            className={`relative px-3 py-2 rounded-lg border flex items-center gap-2 transition-all duration-300 ${
              model.status === "active"
                ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                : "bg-slate-800/40 border-white/5"
            }`}
          >
            <span className="text-lg">{model.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className={`font-medium text-sm truncate ${
                  model.status === "active" ? "text-emerald-100" : "text-white"
                }`}>
                  {model.name}
                </h3>
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium uppercase ${
                    model.status === "active"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-slate-600/30 text-slate-500"
                  }`}
                >
                  <span
                    className={`w-1 h-1 rounded-full ${
                      model.status === "active" 
                        ? "bg-emerald-400 animate-pulse" 
                        : "bg-slate-500"
                    }`}
                  />
                  {model.status}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 truncate">{model.role}</p>
            </div>
            
            {/* Active indicator glow */}
            {model.status === "active" && (
              <div className="absolute inset-0 rounded-lg ring-1 ring-emerald-500/20 pointer-events-none" />
            )}
          </div>
        ))}
      </div>
      
      {status?.activeModel && (
        <div className="mt-2 px-1 flex items-center justify-between text-[10px] text-slate-500">
          <span>Active: <span className="text-slate-300">{status.activeModel}</span></span>
          <span>Updated: {lastRefresh.toLocaleTimeString()}</span>
        </div>
      )}
    </section>
  );
}
