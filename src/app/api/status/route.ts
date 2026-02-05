import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { StatusEntry } from "../../components/types";

const statusFile = path.join(process.cwd(), "data", "status.json");

async function readStatusFile(): Promise<StatusEntry[]> {
  const raw = await fs.readFile(statusFile, "utf8");
  const parsed = JSON.parse(raw) as { statuses: StatusEntry[] };
  return parsed.statuses;
}

async function writeStatusFile(statuses: StatusEntry[]) {
  await fs.writeFile(statusFile, JSON.stringify({ statuses }, null, 2), "utf8");
}

export async function GET() {
  const statuses = await readStatusFile();
  return NextResponse.json({ statuses });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { statuses: StatusEntry[] };
  await writeStatusFile(body.statuses);
  return NextResponse.json({ statuses: body.statuses });
}
