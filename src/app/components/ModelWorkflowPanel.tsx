"use client";

type ModelTier = {
  id: string;
  name: string;
  role: string;
  description: string;
  tasks: string[];
  color: string;
  bgColor: string;
  borderColor: string;
};

const modelTiers: ModelTier[] = [
  {
    id: "kimi",
    name: "Kimi K2.5",
    role: "Day-to-Day",
    description: "Primary model for routine operations",
    tasks: [
      "Conversations & quick questions",
      "File operations & memory",
      "Coordinating tasks & tool calls",
      "Most routine work"
    ],
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30"
  },
  {
    id: "opus",
    name: "Claude Opus 4.5",
    role: "Complex Tasks",
    description: "Heavy lifting for complex reasoning",
    tasks: [
      "Architecture decisions & planning",
      "Multi-step reasoning & debugging",
      "Spawning sub-agents",
      "Deep thinking on tricky issues"
    ],
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/30"
  },
  {
    id: "codex",
    name: "Codex CLI",
    role: "Development",
    description: "Hands-on code execution",
    tasks: [
      "Writing & editing code",
      "Git operations (commit, push)",
      "Running tests & builds",
      "Hands-on development"
    ],
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30"
  }
];

function ModelCard({ tier }: { tier: ModelTier }) {
  return (
    <div className={`rounded-2xl border ${tier.borderColor} ${tier.bgColor} p-4 shadow-lg shadow-slate-950/30`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className={`text-sm font-semibold ${tier.color}`}>{tier.name}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{tier.role}</p>
        </div>
        <span className={`h-2.5 w-2.5 rounded-full mt-1 ${tier.color.replace("text-", "bg-")} animate-pulse`} />
      </div>
      <p className="mt-3 text-xs text-slate-500">{tier.description}</p>
      <ul className="mt-3 space-y-1.5">
        {tier.tasks.map((task, idx) => (
          <li key={idx} className="flex items-start gap-2 text-xs text-slate-400">
            <span className={`mt-1 h-1 w-1 rounded-full ${tier.color.replace("text-", "bg-")} shrink-0`} />
            {task}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flex items-center justify-center py-2">
      <div className="flex flex-col items-center gap-1">
        <div className="h-4 w-px bg-gradient-to-b from-slate-700 to-slate-600" />
        <svg className="h-3 w-3 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  );
}

export function ModelWorkflowPanel() {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6 shadow-xl shadow-slate-950/40">
      <div className="mb-6">
        <h2 className="font-monoDisplay text-xl text-slate-100">Model Workflow</h2>
        <p className="mt-1 text-xs text-slate-400">
          Three-tier system for different task types
        </p>
      </div>

      {/* Flow summary */}
      <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <p className="text-xs text-slate-300 text-center">
          <span className="text-cyan-400 font-medium">Kimi</span>
          <span className="text-slate-500 mx-2">runs the show →</span>
          <span className="text-violet-400 font-medium">Opus</span>
          <span className="text-slate-500 mx-2">thinks through hard stuff →</span>
          <span className="text-emerald-400 font-medium">Codex</span>
          <span className="text-slate-500 ml-2">builds it</span>
        </p>
      </div>

      {/* Model cards */}
      <div className="flex flex-col">
        <ModelCard tier={modelTiers[0]} />
        <FlowArrow />
        <ModelCard tier={modelTiers[1]} />
        <FlowArrow />
        <ModelCard tier={modelTiers[2]} />
      </div>
    </section>
  );
}
