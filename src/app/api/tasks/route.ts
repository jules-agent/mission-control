import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { TaskEntry, TaskStatus } from "../../components/types";

const tasksFile = path.join(process.cwd(), "data", "tasks.json");

async function readTasks(): Promise<TaskEntry[]> {
  try {
    const raw = await fs.readFile(tasksFile, "utf8");
    const parsed = JSON.parse(raw) as { tasks: TaskEntry[] };
    // Ensure all tasks have a rank, sorted by rank
    const tasks = parsed.tasks.map((t, i) => ({
      ...t,
      rank: t.rank ?? i,
      source: t.source ?? "manual"
    }));
    return tasks.sort((a, b) => a.rank - b.rank);
  } catch {
    return [];
  }
}

async function writeTasks(tasks: TaskEntry[]) {
  // Re-rank to ensure sequential ranks
  const ranked = tasks.map((t, i) => ({ ...t, rank: i }));
  await fs.mkdir(path.dirname(tasksFile), { recursive: true });
  await fs.writeFile(tasksFile, JSON.stringify({ tasks: ranked }, null, 2), "utf8");
  return ranked;
}

export async function GET() {
  const tasks = await readTasks();
  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<TaskEntry> & { title: string };
  const tasks = await readTasks();
  
  const newTask: TaskEntry = {
    id: crypto.randomUUID(),
    title: body.title,
    description: body.description || "",
    priority: body.priority || "medium",
    status: body.status || "todo",
    createdAt: new Date().toLocaleString(),
    rank: 0, // New tasks go to the top
    source: body.source || "manual",
  };
  
  // Insert at top, shift others down
  const updated = await writeTasks([newTask, ...tasks]);
  return NextResponse.json({ tasks: updated });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as { 
    id: string; 
    status?: TaskStatus;
    title?: string;
    description?: string;
    priority?: TaskEntry["priority"];
    moveDirection?: "up" | "down";
    moveToId?: string; // For drag-and-drop: move 'id' to position of 'moveToId'
  };
  
  let tasks = await readTasks();
  const taskIndex = tasks.findIndex(t => t.id === body.id);
  
  if (taskIndex === -1) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  // Handle drag-and-drop reorder
  if (body.moveToId) {
    const targetIndex = tasks.findIndex(t => t.id === body.moveToId);
    if (targetIndex !== -1 && targetIndex !== taskIndex) {
      const [task] = tasks.splice(taskIndex, 1);
      tasks.splice(targetIndex, 0, task);
    }
  }
  // Handle move up/down buttons
  else if (body.moveDirection) {
    const newIndex = body.moveDirection === "up" 
      ? Math.max(0, taskIndex - 1)
      : Math.min(tasks.length - 1, taskIndex + 1);
    
    if (newIndex !== taskIndex) {
      const [task] = tasks.splice(taskIndex, 1);
      tasks.splice(newIndex, 0, task);
    }
  } 
  // Update task fields
  else {
    tasks[taskIndex] = {
      ...tasks[taskIndex],
      ...(body.status && { status: body.status }),
      ...(body.title && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.priority && { priority: body.priority }),
      updatedAt: new Date().toLocaleString(),
    };
  }
  
  const updated = await writeTasks(tasks);
  return NextResponse.json({ tasks: updated });
}

export async function DELETE(request: Request) {
  const body = (await request.json()) as { id: string };
  const tasks = await readTasks();
  const updated = await writeTasks(tasks.filter((task) => task.id !== body.id));
  return NextResponse.json({ tasks: updated });
}
