import type { TaskEntry, TaskStatus } from "./types";

const priorityStyles: Record<TaskEntry["priority"], string> = {
  high: "text-status-red",
  medium: "text-status-yellow",
  low: "text-status-green"
};

const statusStyles: Record<TaskStatus, string> = {
  todo: "bg-slate-800 text-slate-200",
  "in-progress": "bg-blue-500/20 text-blue-200",
  done: "bg-status-green/20 text-status-green"
};

const sourceStyles: Record<string, string> = {
  manual: "bg-slate-700 text-slate-300",
  jules: "bg-violet-500/20 text-violet-300"
};

type TaskListProps = {
  tasks: TaskEntry[];
  onComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onMove: (taskId: string, direction: "up" | "down") => void;
};

export function TaskList({ tasks, onComplete, onDelete, onMove }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
        No tasks in this filter.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task, index) => (
        <div
          key={task.id}
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-slate-950/30"
        >
          <div className="flex items-start gap-3">
            {/* Rank controls */}
            <div className="flex flex-col gap-1 pt-1">
              <button
                type="button"
                onClick={() => onMove(task.id, "up")}
                disabled={index === 0}
                className={`p-1 rounded transition ${
                  index === 0 
                    ? "text-slate-700 cursor-not-allowed" 
                    : "text-slate-400 hover:text-white hover:bg-slate-700"
                }`}
                title="Move up"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <span className="text-[10px] text-slate-600 text-center font-mono">{index + 1}</span>
              <button
                type="button"
                onClick={() => onMove(task.id, "down")}
                disabled={index === tasks.length - 1}
                className={`p-1 rounded transition ${
                  index === tasks.length - 1 
                    ? "text-slate-700 cursor-not-allowed" 
                    : "text-slate-400 hover:text-white hover:bg-slate-700"
                }`}
                title="Move down"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Task content */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-100">{task.title}</h3>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${priorityStyles[task.priority]}`}>
                  {task.priority}
                </span>
                {task.source && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${sourceStyles[task.source] || sourceStyles.manual}`}>
                    {task.source === "jules" ? "⚡ Jules" : "Manual"}
                  </span>
                )}
              </div>
              {task.description && (
                <p className="mt-2 text-xs text-slate-400">{task.description}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${statusStyles[task.status]}`}>
                  {task.status}
                </span>
                <span>Created {task.createdAt}</span>
                {task.updatedAt && <span>· Updated {task.updatedAt}</span>}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-start gap-2 shrink-0">
              {task.status !== "done" && (
                <button
                  type="button"
                  onClick={() => onComplete(task.id)}
                  className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 hover:border-status-green hover:text-status-green"
                >
                  Done
                </button>
              )}
              <button
                type="button"
                onClick={() => onDelete(task.id)}
                className="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-400 hover:border-status-red hover:text-status-red"
                title="Delete"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
