"use client";

import { useState } from "react";
import type { TaskEntry, TaskPriority, TaskStatus } from "./types";

type TaskFormProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (task: Omit<TaskEntry, "id" | "createdAt">) => void;
};

const priorities: TaskPriority[] = ["high", "medium", "low"];
const statuses: TaskStatus[] = ["todo", "in-progress", "done"];

export function TaskForm({ open, onClose, onCreate }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [status, setStatus] = useState<TaskStatus>("todo");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return;
    onCreate({ title, description, priority, status });
    setTitle("");
    setDescription("");
    setPriority("medium");
    setStatus("todo");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/80 p-6 backdrop-blur">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-monoDisplay text-lg text-slate-100">New Mission Task</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-slate-400 hover:text-slate-200"
          >
            Close
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm text-slate-300">
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-slate-500 focus:outline-none"
              placeholder="Map the next mission objective"
              required
            />
          </label>
          <label className="block text-sm text-slate-300">
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-slate-500 focus:outline-none"
              rows={3}
              placeholder="Context, dependencies, and target outcome"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-slate-300">
              Priority
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value as TaskPriority)}
                className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-slate-500 focus:outline-none"
              >
                {priorities.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-slate-300">
              Status
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as TaskStatus)}
                className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-slate-500 focus:outline-none"
              >
                {statuses.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:border-slate-500 hover:text-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-status-green px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-green-400"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
