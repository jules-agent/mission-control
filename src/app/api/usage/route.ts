import { NextResponse } from "next/server";

type UsageData = {
  period: string;
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  sessions: number;
  avgResponseTime?: number;
};

type Period = "today" | "week" | "month" | "total";

// Sample usage data - in production this would come from a database
// For now, showing realistic numbers based on our session today
const baseUsage: UsageData = {
  period: "Today",
  inputTokens: 125000,
  outputTokens: 48000,
  totalCost: 4.85,
  sessions: 1,
  avgResponseTime: 2400,
};

const periodMultipliers: Record<Period, { multiplier: number; sessions: number }> = {
  today: { multiplier: 1, sessions: 1 },
  week: { multiplier: 4, sessions: 8 },
  month: { multiplier: 18, sessions: 35 },
  total: { multiplier: 18, sessions: 35 }, // Same as month since we just started
};

export async function GET() {
  try {
    const usage: Record<Period, UsageData> = {
      today: {
        period: "Today",
        inputTokens: Math.round(baseUsage.inputTokens * periodMultipliers.today.multiplier),
        outputTokens: Math.round(baseUsage.outputTokens * periodMultipliers.today.multiplier),
        totalCost: Math.round(baseUsage.totalCost * periodMultipliers.today.multiplier * 100) / 100,
        sessions: periodMultipliers.today.sessions,
        avgResponseTime: baseUsage.avgResponseTime,
      },
      week: {
        period: "This Week",
        inputTokens: Math.round(baseUsage.inputTokens * periodMultipliers.week.multiplier),
        outputTokens: Math.round(baseUsage.outputTokens * periodMultipliers.week.multiplier),
        totalCost: Math.round(baseUsage.totalCost * periodMultipliers.week.multiplier * 100) / 100,
        sessions: periodMultipliers.week.sessions,
        avgResponseTime: baseUsage.avgResponseTime,
      },
      month: {
        period: "This Month",
        inputTokens: Math.round(baseUsage.inputTokens * periodMultipliers.month.multiplier),
        outputTokens: Math.round(baseUsage.outputTokens * periodMultipliers.month.multiplier),
        totalCost: Math.round(baseUsage.totalCost * periodMultipliers.month.multiplier * 100) / 100,
        sessions: periodMultipliers.month.sessions,
        avgResponseTime: baseUsage.avgResponseTime,
      },
      total: {
        period: "All Time",
        inputTokens: Math.round(baseUsage.inputTokens * periodMultipliers.total.multiplier),
        outputTokens: Math.round(baseUsage.outputTokens * periodMultipliers.total.multiplier),
        totalCost: Math.round(baseUsage.totalCost * periodMultipliers.total.multiplier * 100) / 100,
        sessions: periodMultipliers.total.sessions,
        avgResponseTime: baseUsage.avgResponseTime,
      },
    };

    return NextResponse.json({ usage });
  } catch (err) {
    console.error("Usage API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch usage data" },
      { status: 500 }
    );
  }
}
