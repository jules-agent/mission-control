"use client";

import { useCallback, useEffect, useState } from "react";

type ProjectEntry = {
  date: string;
  title: string;
  items: string[];
};

type Project = {
  name: string;
  status: string;
  statusEmoji: string;
  lastActivity: string;
  keyAccomplishment: string;
  entries: ProjectEntry[];
};

type ProjectsData = {
  projects: Project[];
  lastUpdated: string;
  totalProjects: number;
  activeProjects: number;
};

const statusColors: Record<string, string> = {
  "🟢": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "🟡": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "🔴": "bg-red-500/20 text-red-400 border-red-500/30",
  "✅": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "📋": "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

export function ProjectsPanel() {
  const [data, setData] = useState<ProjectsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects", { cache: "no-store" });
      if (!res.ok) return;
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    const interval = setInterval(fetchProjects, 60000);
    return () => clearInterval(interval);
  }, [fetchProjects]);

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-6 w-48 rounded bg-slate-700" />
          <div className="h-4 w-full rounded bg-slate-800" />
          <div className="h-4 w-full rounded bg-slate-800" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">🏗️ Project Accomplishments</span>
          <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
            {data.activeProjects} active / {data.totalProjects} total
          </span>
        </div>
        <span className="text-xs text-slate-500">
          Updated {new Date(data.lastUpdated).toLocaleString()}
        </span>
      </div>

      {/* Project Grid */}
      <div className="grid gap-2">
        {data.projects.map((project) => (
          <div key={project.name} className="group">
            {/* Project Row */}
            <button
              onClick={() => setExpanded(expanded === project.name ? null : project.name)}
              className="flex w-full items-center gap-3 rounded-md border border-slate-700/50 bg-slate-800/50 px-3 py-2 text-left transition-colors hover:bg-slate-800"
            >
              <span
                className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium ${
                  statusColors[project.statusEmoji] || statusColors["📋"]
                }`}
              >
                {project.statusEmoji} {project.status}
              </span>
              <span className="font-medium text-white">{project.name}</span>
              <span className="ml-auto text-xs text-slate-500">{project.lastActivity}</span>
              <span className="max-w-[300px] truncate text-xs text-slate-400">
                {project.keyAccomplishment}
              </span>
              <svg
                className={`h-4 w-4 text-slate-500 transition-transform ${
                  expanded === project.name ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Expanded Detail */}
            {expanded === project.name && project.entries.length > 0 && (
              <div className="ml-4 mt-1 space-y-2 border-l-2 border-slate-700 pl-4">
                {project.entries.map((entry, i) => (
                  <div key={i} className="text-sm">
                    <div className="font-medium text-slate-300">
                      {entry.date} — {entry.title}
                    </div>
                    <ul className="mt-1 space-y-0.5">
                      {entry.items.slice(0, 5).map((item, j) => (
                        <li key={j} className="text-xs text-slate-500">
                          • {item}
                        </li>
                      ))}
                      {entry.items.length > 5 && (
                        <li className="text-xs text-slate-600">
                          +{entry.items.length - 5} more items
                        </li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
