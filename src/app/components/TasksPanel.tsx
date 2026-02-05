"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TaskForm } from "./TaskForm";
import { TaskList } from "./TaskList";
import type { TaskEntry, TaskStatus } from "./types";

const FILTERS: Array<TaskStatus | "all"> = ["all", "todo", "in-progress", "done"];

export function TasksPanel() {
  const [tasks, setTasks] = useState<TaskEntry[]>([]);
  const [filter, setFilter] = useState<TaskStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/tasks", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load mission tasks.");
      }
      const data = (await response.json()) as { tasks: TaskEntry[] };
      setTasks(data.tasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredTasks = useMemo(() => {
    if (filter === "all") return tasks;
    return tasks.filter((task) => task.status === filter);
  }, [filter, tasks]);

  const handleCreate = async (newTask: Omit<TaskEntry, "id" | "createdAt">) => {
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTask)
    });
    if (response.ok) {
      const data = (await response.json()) as { tasks: TaskEntry[] };
      setTasks(data.tasks);
    }
  };

  const handleComplete = async (taskId: string) => {
    const response = await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, status: "done" })
    });
    if (response.ok) {
      const data = (await response.json()) as { tasks: TaskEntry[] };
      setTasks(data.tasks);
    }
  };

  const handleDelete = async (taskId: string) => {
    const response = await fetch("/api/tasks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId })
    });
    if (response.ok) {
      const data = (await response.json()) as { tasks: TaskEntry[] };
      setTasks(data.tasks);
    }
  };

  const handleMove = async (taskId: string, direction: "up" | "down") => {
    const response = await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, moveDirection: direction })
    });
    if (response.ok) {
      const data = (await response.json()) as { tasks: TaskEntry[] };
      setTasks(data.tasks);
    }
  };

  const handleReorder = async (activeId: string, overId: string) => {
    const response = await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: activeId, moveToId: overId })
    });
    if (response.ok) {
      const data = (await response.json()) as { tasks: TaskEntry[] };
      setTasks(data.tasks);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6 shadow-xl shadow-slate-950/40">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-monoDisplay text-xl text-slate-100">Mission Tasks</h2>
          <p className="mt-1 text-xs text-slate-400">Track mission-critical tasks and execution state.</p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="rounded-full bg-status-green px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-green-400"
        >
          Add Task
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              filter === item
                ? "bg-slate-100 text-slate-900"
                : "border border-slate-800 text-slate-300 hover:border-slate-600"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
            Fetching mission queue...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-6 text-sm text-red-200">
            {error}
          </div>
        ) : (
          <TaskList tasks={filteredTasks} onComplete={handleComplete} onDelete={handleDelete} onMove={handleMove} onReorder={handleReorder} />
        )}
      </div>

      <TaskForm open={formOpen} onClose={() => setFormOpen(false)} onCreate={handleCreate} />
    </section>
  );
}
