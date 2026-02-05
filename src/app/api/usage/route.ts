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

type Period = "today" | "weekly" | "monthly" | "total";

const periodLabels: Record<Period, string> = {
  today: "Today",
  weekly: "This Week",
  monthly: "This Month",
  total: "All Time",
};

// Multipliers for demo data based on period
// In production, this would query actual historical data
const periodMultipliers: Record<Period, number> = {
  today: 1,
  weekly: 5,
  monthly: 22,
  total: 45,
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get("period") || "weekly") as Period;

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

    // Apply period multiplier to simulate historical data
    const multiplier = periodMultipliers[period] || 1;
    const adjustedProviders = usage.providers.map(p => ({
      ...p,
      requests: Math.round(p.requests * multiplier),
      tokens: {
        input: Math.round(p.tokens.input * multiplier),
        output: Math.round(p.tokens.output * multiplier),
      },
      cost: Math.round(p.cost * multiplier * 100) / 100,
    }));

    // Calculate total cost
    const totalCost = adjustedProviders.reduce((sum, p) => sum + p.cost, 0);

    // Format last updated time
    const lastUpdated = new Date(usage.lastUpdated);
    const minutesAgo = Math.floor((Date.now() - lastUpdated.getTime()) / 60000);
    const lastUpdatedText = minutesAgo < 1 ? "just now" : 
      minutesAgo < 60 ? `${minutesAgo}m ago` : 
      `${Math.floor(minutesAgo / 60)}h ago`;

    return NextResponse.json({
      providers: adjustedProviders,
      totalCost,
      period: periodLabels[period],
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
