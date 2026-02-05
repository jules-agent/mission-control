"use client";

const models = [
  { name: "Kimi K2.5", role: "Default", icon: "💬", status: "active" },
  { name: "Opus 4.5", role: "Complex Tasks", icon: "🧠", status: "standby" },
  { name: "Codex CLI", role: "Development", icon: "⚡", status: "standby" }
];

export function ModelWorkflowPanel() {
  return (
    <section className="glass rounded-xl p-2">
      <div className="grid grid-cols-3 gap-2">
        {models.map((model) => (
          <div
            key={model.name}
            className="relative px-3 py-2 rounded-lg bg-slate-800/40 border border-white/5 flex items-center gap-2"
          >
            <span className="text-lg">{model.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-white text-sm truncate">{model.name}</h3>
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium uppercase ${
                  model.status === "active" 
                    ? "bg-emerald-500/20 text-emerald-400" 
                    : "bg-slate-600/30 text-slate-500"
                }`}>
                  <span className={`w-1 h-1 rounded-full ${model.status === "active" ? "bg-emerald-400" : "bg-slate-500"}`} />
                  {model.status}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 truncate">{model.role}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
