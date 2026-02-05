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
    // Optimistic update
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    
    const newIndex = direction === "up" 
      ? Math.max(0, taskIndex - 1)
      : Math.min(tasks.length - 1, taskIndex + 1);
    
    if (newIndex !== taskIndex) {
      const reordered = [...tasks];
      const [moved] = reordered.splice(taskIndex, 1);
      reordered.splice(newIndex, 0, moved);
      setTasks(reordered);
    }

    // Persist to API
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
    // Optimistic update - reorder immediately in UI
    const oldIndex = tasks.findIndex(t => t.id === activeId);
    const newIndex = tasks.findIndex(t => t.id === overId);
    
    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      const reordered = [...tasks];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);
      setTasks(reordered);
    }

    // Then persist to API
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
    <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 shadow-xl shadow-slate-950/40">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <h2 className="font-medium text-white text-sm">Tasks</h2>
          <div className="flex gap-1">
            {FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                  filter === item ? "bg-white/10 text-white" : "text-slate-500 hover:text-white"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="rounded bg-emerald-500/20 text-emerald-400 px-2 py-1 text-[10px] font-medium hover:bg-emerald-500/30"
        >
          + Add
        </button>
      </div>

      <div>
        {loading ? (
          <div className="rounded-lg bg-slate-900/40 p-3 text-xs text-slate-500">Loading...</div>
        ) : error ? (
          <div className="rounded-lg bg-red-500/10 p-3 text-xs text-red-300">{error}</div>
        ) : (
          <TaskList tasks={filteredTasks} onComplete={handleComplete} onDelete={handleDelete} onMove={handleMove} onReorder={handleReorder} />
        )}
      </div>

      <TaskForm open={formOpen} onClose={() => setFormOpen(false)} onCreate={handleCreate} />
    </section>
  );
}
