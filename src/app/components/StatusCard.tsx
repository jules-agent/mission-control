import type { StatusEntry } from "./types";

const statusStyles: Record<StatusEntry["status"], { label: string; color: string }> = {
  operational: { label: "Operational", color: "text-status-green" },
  degraded: { label: "Degraded", color: "text-status-yellow" },
  down: { label: "Down", color: "text-status-red" },
  pending: { label: "Pending Verification", color: "text-status-yellow" }
};

export function StatusCard({ service, status, lastChecked }: StatusEntry) {
  const style = statusStyles[status];
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-slate-950/30">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-200">{service}</h3>
        <span className={`text-xs font-semibold ${style.color}`}>{style.label}</span>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
        <span className={`h-2.5 w-2.5 rounded-full ${style.color.replace("text-", "bg-")}`} />
        <span>Last checked: {lastChecked}</span>
      </div>
    </div>
  );
}
