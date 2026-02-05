"use client";

const models = [
  {
    name: "Kimi K2.5",
    role: "Default",
    description: "Day-to-day conversations, quick tasks, tool calls",
    color: "from-blue-500 to-cyan-500",
    bgColor: "from-blue-500/10 to-cyan-500/10",
    icon: "💬",
    status: "active"
  },
  {
    name: "Opus 4.5",
    role: "Complex Tasks",
    description: "Architecture, planning, multi-step reasoning",
    color: "from-violet-500 to-purple-500",
    bgColor: "from-violet-500/10 to-purple-500/10",
    icon: "🧠",
    status: "standby"
  },
  {
    name: "Codex CLI",
    role: "Development",
    description: "Code writing, git operations, builds",
    color: "from-emerald-500 to-teal-500",
    bgColor: "from-emerald-500/10 to-teal-500/10",
    icon: "⚡",
    status: "standby"
  }
];

export function ModelWorkflowPanel() {
  return (
    <section className="glass rounded-3xl p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-pink-500/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h2 className="font-semibold text-white">Model Workflow</h2>
          <p className="text-xs text-slate-500">Three-tier intelligence system</p>
        </div>
      </div>

      {/* Model cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {models.map((model, index) => (
          <div
            key={model.name}
            className={`relative p-5 rounded-2xl bg-gradient-to-br ${model.bgColor} border border-white/5 group hover:border-white/10 transition-all`}
          >
            {/* Connection line (for non-last items) */}
            {index < models.length - 1 && (
              <div className="hidden md:block absolute top-1/2 -right-4 w-4 h-px bg-gradient-to-r from-white/20 to-transparent" />
            )}
            
            {/* Status indicator */}
            <div className="absolute top-4 right-4">
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                model.status === "active" 
                  ? "bg-emerald-500/20 text-emerald-400" 
                  : "bg-slate-500/20 text-slate-400"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${model.status === "active" ? "bg-emerald-400 pulse-live" : "bg-slate-400"}`} />
                {model.status}
              </span>
            </div>

            {/* Icon */}
            <div className="text-3xl mb-3">{model.icon}</div>

            {/* Content */}
            <div>
              <h3 className={`font-semibold text-white mb-0.5`}>{model.name}</h3>
              <p className={`text-xs font-medium bg-gradient-to-r ${model.color} bg-clip-text text-transparent mb-2`}>
                {model.role}
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">{model.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer explanation */}
      <div className="mt-6 pt-4 border-t border-white/5">
        <p className="text-xs text-slate-500 text-center">
          <span className="text-slate-400">Flow:</span> Kimi handles daily ops → Opus for complex reasoning → Codex for development
        </p>
      </div>
    </section>
  );
}
