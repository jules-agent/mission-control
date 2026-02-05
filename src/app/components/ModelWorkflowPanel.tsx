"use client";

type ModelTier = {
  id: string;
  name: string;
  role: string;
  color: string;
};

const modelTiers: ModelTier[] = [
  { id: "kimi", name: "Kimi K2.5", role: "Day-to-Day", color: "text-cyan-400" },
  { id: "opus", name: "Opus 4.5", role: "Complex", color: "text-violet-400" },
  { id: "codex", name: "Codex", role: "Development", color: "text-emerald-400" },
];

export function ModelWorkflowPanel() {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-xl shadow-slate-950/40">
      <h2 className="font-monoDisplay text-sm text-slate-100 mb-3">Model Workflow</h2>
      
      <div className="flex items-center justify-between gap-2">
        {modelTiers.map((tier, idx) => (
          <div key={tier.id} className="flex items-center gap-2">
            <div className="text-center">
              <div className={`text-xs font-semibold ${tier.color}`}>{tier.name}</div>
              <div className="text-[10px] text-slate-500">{tier.role}</div>
            </div>
            {idx < modelTiers.length - 1 && (
              <svg className="h-3 w-3 text-slate-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-3 pt-3 border-t border-slate-800/50 text-[10px] text-slate-500 text-center">
        Kimi runs the show → Opus thinks → Codex builds
      </div>
    </section>
  );
}
