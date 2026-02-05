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

type TaskListProps = {
  tasks: TaskEntry[];
  onComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
};

export function TaskList({ tasks, onComplete, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
        No tasks in this filter.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-slate-950/30"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-100">{task.title}</h3>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${priorityStyles[task.priority]}`}>
                  {task.priority}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400">{task.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${statusStyles[task.status]}`}>
                  {task.status}
                </span>
                <span>Created {task.createdAt}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {task.status !== "done" && (
                <button
                  type="button"
                  onClick={() => onComplete(task.id)}
                  className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 hover:border-status-green hover:text-status-green"
                >
                  Mark Done
                </button>
              )}
              <button
                type="button"
                onClick={() => onDelete(task.id)}
                className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-300 hover:border-status-red hover:text-status-red"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
