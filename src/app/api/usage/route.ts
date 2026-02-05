import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

type ApiProvider = {
  id: string;
  name: string;
  requests: number;
  tokens: { input: number; output: number };
  cost: number;
  status: "active" | "idle" | "error";
  pricing?: {
    inputPer1M?: number;
    outputPer1M?: number;
    note?: string;
  };
};

type UsageData = {
  lastUpdated: string;
  period: string;
  providers: ApiProvider[];
};

export async function GET() {
  try {
    // Try to read from the tracked usage file
    const usageFilePath = path.join(process.cwd(), "usage-data.json");
    
    let usage: UsageData;
    try {
      const fileContent = await fs.readFile(usageFilePath, "utf-8");
      usage = JSON.parse(fileContent);
    } catch {
      // Fallback to default data if file doesn't exist
      usage = getDefaultUsageData();
    }

    // Calculate total cost
    const totalCost = usage.providers.reduce((sum, p) => sum + p.cost, 0);

    // Format last updated time
    const lastUpdated = new Date(usage.lastUpdated);
    const minutesAgo = Math.floor((Date.now() - lastUpdated.getTime()) / 60000);
    const lastUpdatedText = minutesAgo < 1 ? "just now" : 
      minutesAgo < 60 ? `${minutesAgo}m ago` : 
      `${Math.floor(minutesAgo / 60)}h ago`;

    return NextResponse.json({
      providers: usage.providers,
      totalCost,
      period: usage.period,
      lastUpdated: lastUpdatedText,
    });
  } catch (err) {
    console.error("Usage API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch usage data" },
      { status: 500 }
    );
  }
}

// Update usage data via POST
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const usageFilePath = path.join(process.cwd(), "usage-data.json");
    
    // Read existing data
    let existing: UsageData;
    try {
      const fileContent = await fs.readFile(usageFilePath, "utf-8");
      existing = JSON.parse(fileContent);
    } catch {
      existing = getDefaultUsageData();
    }

    // Merge updates
    if (body.providers) {
      for (const update of body.providers) {
        const idx = existing.providers.findIndex(p => p.id === update.id);
        if (idx >= 0) {
          existing.providers[idx] = { ...existing.providers[idx], ...update };
        } else {
          existing.providers.push(update);
        }
      }
    }

    existing.lastUpdated = new Date().toISOString();
    if (body.period) existing.period = body.period;

    await fs.writeFile(usageFilePath, JSON.stringify(existing, null, 2));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Usage update error:", err);
    return NextResponse.json(
      { error: "Failed to update usage data" },
      { status: 500 }
    );
  }
}

function getDefaultUsageData(): UsageData {
  return {
    lastUpdated: new Date().toISOString(),
    period: "Today",
    providers: [
      {
        id: "anthropic",
        name: "Anthropic (Opus)",
        requests: 0,
        tokens: { input: 0, output: 0 },
        cost: 0,
        status: "idle",
      },
      {
        id: "nvidia-kimi",
        name: "NVIDIA (Kimi K2.5)",
        requests: 0,
        tokens: { input: 0, output: 0 },
        cost: 0,
        status: "idle",
      },
      {
        id: "openai",
        name: "OpenAI",
        requests: 0,
        tokens: { input: 0, output: 0 },
        cost: 0,
        status: "idle",
      },
    ],
  };
}
