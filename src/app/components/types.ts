export type StatusEntry = {
  id: string;
  service: string;
  status: "operational" | "degraded" | "down" | "pending";
  lastChecked: string;
};

export type TaskPriority = "high" | "medium" | "low";
export type TaskStatus = "todo" | "in-progress" | "done";

export type TaskEntry = {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
  rank: number; // Lower = higher priority, displayed at top
  source?: "manual" | "jules"; // Who created the task
  updatedAt?: string;
};
