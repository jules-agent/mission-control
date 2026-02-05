import { NextResponse } from "next/server";

type UsageData = {
  period: string;
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  sessions: number;
  avgResponseTime?: number;
  chartData: { label: string; cost: number }[];
};

type Period = "today" | "week" | "month" | "total";

// Generate chart data based on period
function generateChartData(period: Period): { label: string; cost: number }[] {
  const now = new Date();
  
  switch (period) {
    case "today": {
      // Hourly data for today (last 12 hours)
      const hours: { label: string; cost: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
        const h = hour.getHours();
        const label = h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;
        // Simulate varying costs throughout the day
        const baseCost = 0.15 + Math.random() * 0.35;
        const multiplier = i < 3 ? 1.5 : i < 6 ? 1.2 : 0.8; // Higher costs in recent hours
        hours.push({ label, cost: Math.round(baseCost * multiplier * 100) / 100 });
      }
      return hours;
    }
    
    case "week": {
      // Daily data for this week
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayOfWeek = now.getDay();
      const data: { label: string; cost: number }[] = [];
      
      for (let i = 6; i >= 0; i--) {
        const dayIndex = (dayOfWeek - i + 7) % 7;
        const isToday = i === 0;
        const baseCost = isToday ? 4.85 : 2 + Math.random() * 3;
        data.push({ label: days[dayIndex], cost: Math.round(baseCost * 100) / 100 });
      }
      return data;
    }
    
    case "month": {
      // Weekly data for this month
      const data: { label: string; cost: number }[] = [];
      for (let i = 3; i >= 0; i--) {
        const weekLabel = i === 0 ? "This Week" : i === 1 ? "Last Week" : `${i + 1} Weeks Ago`;
        const baseCost = i === 0 ? 19.40 : 15 + Math.random() * 25;
        data.push({ label: weekLabel, cost: Math.round(baseCost * 100) / 100 });
      }
      return data.reverse();
    }
    
    case "total": {
      // Monthly data (since we just started, show the current month breakdown)
      const data: { label: string; cost: number }[] = [];
      const months = ["Jan", "Feb", "Mar", "Apr"];
      for (let i = 0; i < 4; i++) {
        const isCurrentMonth = i === 1; // February
        const baseCost = isCurrentMonth ? 87.30 : i === 0 ? 0 : 0;
        data.push({ label: months[i], cost: Math.round(baseCost * 100) / 100 });
      }
      return data;
    }
    
    default:
      return [];
  }
}

// Base usage for today
const baseUsage = {
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
  total: { multiplier: 18, sessions: 35 },
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
        chartData: generateChartData("today"),
      },
      week: {
        period: "This Week",
        inputTokens: Math.round(baseUsage.inputTokens * periodMultipliers.week.multiplier),
        outputTokens: Math.round(baseUsage.outputTokens * periodMultipliers.week.multiplier),
        totalCost: Math.round(baseUsage.totalCost * periodMultipliers.week.multiplier * 100) / 100,
        sessions: periodMultipliers.week.sessions,
        avgResponseTime: baseUsage.avgResponseTime,
        chartData: generateChartData("week"),
      },
      month: {
        period: "This Month",
        inputTokens: Math.round(baseUsage.inputTokens * periodMultipliers.month.multiplier),
        outputTokens: Math.round(baseUsage.outputTokens * periodMultipliers.month.multiplier),
        totalCost: Math.round(baseUsage.totalCost * periodMultipliers.month.multiplier * 100) / 100,
        sessions: periodMultipliers.month.sessions,
        avgResponseTime: baseUsage.avgResponseTime,
        chartData: generateChartData("month"),
      },
      total: {
        period: "All Time",
        inputTokens: Math.round(baseUsage.inputTokens * periodMultipliers.total.multiplier),
        outputTokens: Math.round(baseUsage.outputTokens * periodMultipliers.total.multiplier),
        totalCost: Math.round(baseUsage.totalCost * periodMultipliers.total.multiplier * 100) / 100,
        sessions: periodMultipliers.total.sessions,
        avgResponseTime: baseUsage.avgResponseTime,
        chartData: generateChartData("total"),
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
