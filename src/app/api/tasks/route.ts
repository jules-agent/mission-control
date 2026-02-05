import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { TaskEntry, TaskStatus } from "../../components/types";

const tasksFile = path.join(process.cwd(), "data", "tasks.json");

async function readTasks(): Promise<TaskEntry[]> {
  const raw = await fs.readFile(tasksFile, "utf8");
  const parsed = JSON.parse(raw) as { tasks: TaskEntry[] };
  return parsed.tasks;
}

async function writeTasks(tasks: TaskEntry[]) {
  await fs.writeFile(tasksFile, JSON.stringify({ tasks }, null, 2), "utf8");
}

export async function GET() {
  const tasks = await readTasks();
  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Omit<TaskEntry, "id" | "createdAt">;
  const tasks = await readTasks();
  const newTask: TaskEntry = {
    id: crypto.randomUUID(),
    title: body.title,
    description: body.description,
    priority: body.priority,
    status: body.status,
    createdAt: new Date().toLocaleString()
  };
  const updated = [newTask, ...tasks];
  await writeTasks(updated);
  return NextResponse.json({ tasks: updated });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as { id: string; status: TaskStatus };
  const tasks = await readTasks();
  const updated = tasks.map((task) =>
    task.id === body.id ? { ...task, status: body.status } : task
  );
  await writeTasks(updated);
  return NextResponse.json({ tasks: updated });
}

export async function DELETE(request: Request) {
  const body = (await request.json()) as { id: string };
  const tasks = await readTasks();
  const updated = tasks.filter((task) => task.id !== body.id);
  await writeTasks(updated);
  return NextResponse.json({ tasks: updated });
}
