import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

type UsageData = {
  period: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  totalCost: number;
  messages: number;
  chartData: { label: string; cost: number }[];
};

type Period = "today" | "week" | "month" | "total";

type RawUsageData = {
  lastUpdated: string;
  totalMessages: number;
  totals: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
    cost: number;
  };
  hourlyData: { hour: string; cost: number }[];
};

async function getUsageData(): Promise<RawUsageData | null> {
  try {
    // Try to read from the synced usage data file
    const filePath = path.join(process.cwd(), "public", "usage-data.json");
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function generateChartData(
  period: Period,
  hourlyData: { hour: string; cost: number }[]
): { label: string; cost: number }[] {
  // Get current time in PST
  const nowPST = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  const todayPST = nowPST.toISOString().slice(0, 10);
  
  // Sort hourly data by timestamp (oldest first) to ensure correct order
  const sortedData = [...hourlyData].sort((a, b) => a.hour.localeCompare(b.hour));
  
  switch (period) {
    case "today": {
      // Convert UTC hours to PST and filter for today
      const todayData = sortedData
        .map(d => {
          // Parse UTC timestamp and convert to PST
          const utcDate = new Date(d.hour + ":00:00Z");
          const pstDate = new Date(utcDate.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
          const pstDateStr = pstDate.toISOString().slice(0, 10);
          const pstHour = pstDate.getHours();
          
          return {
            date: pstDateStr,
            hour: pstHour,
            cost: d.cost,
            originalHour: d.hour
          };
        })
        .filter(d => d.date === todayPST);
      
      // Create hour labels (oldest to newest = left to right)
      return todayData.map(d => {
        const hour = d.hour;
        const label = hour === 0 ? "12am" : hour < 12 ? `${hour}am` : hour === 12 ? "12pm" : `${hour - 12}pm`;
        return { label, cost: d.cost };
      });
    }
    
    case "week": {
      // Show daily data for last 7 days in PST - oldest day on left, newest on right
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const data: { label: string; cost: number }[] = [];
      
      // Group hourly data by PST date
      const dailyCosts = new Map<string, number>();
      for (const d of sortedData) {
        const utcDate = new Date(d.hour + ":00:00Z");
        const pstDate = new Date(utcDate.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
        const pstDateStr = pstDate.toISOString().slice(0, 10);
        dailyCosts.set(pstDateStr, (dailyCosts.get(pstDateStr) || 0) + d.cost);
      }
      
      // Loop from 6 days ago (oldest) to today (newest) in PST
      for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
        const date = new Date(nowPST);
        date.setDate(date.getDate() - daysAgo);
        const dateStr = date.toISOString().slice(0, 10);
        const dayCost = dailyCosts.get(dateStr) || 0;
        data.push({ 
          label: days[date.getDay()], 
          cost: Math.round(dayCost * 100) / 100 
        });
      }
      return data;
    }
    
    case "month":
    case "total": {
      // Group by PST day, oldest on left, newest on right
      const dailyMap = new Map<string, number>();
      for (const d of sortedData) {
        const utcDate = new Date(d.hour + ":00:00Z");
        const pstDate = new Date(utcDate.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
        const dateKey = pstDate.toISOString().slice(0, 10);
        dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + d.cost);
      }
      
      // Convert to array sorted by date (oldest first = left)
      const dates = [...dailyMap.keys()].sort();
      return dates.slice(-14).map(dateStr => {
        const date = new Date(dateStr + "T00:00:00");
        const label = `${date.getMonth() + 1}/${date.getDate()}`;
        return { label, cost: Math.round((dailyMap.get(dateStr) || 0) * 100) / 100 };
      });
    }
    
    default:
      return [];
  }
}

export async function GET() {
  try {
    const rawData = await getUsageData();
    
    if (!rawData) {
      return NextResponse.json({ 
        usage: null,
        source: "none",
        error: "No usage data available. Run sync-usage.sh to populate.",
      });
    }

    const createUsageData = (periodLabel: string, periodKey: Period): UsageData => ({
      period: periodLabel,
      inputTokens: rawData.totals.inputTokens,
      outputTokens: rawData.totals.outputTokens,
      cacheReadTokens: rawData.totals.cacheReadTokens,
      cacheWriteTokens: rawData.totals.cacheWriteTokens,
      totalCost: rawData.totals.cost,
      messages: rawData.totalMessages,
      chartData: generateChartData(periodKey, rawData.hourlyData),
    });

    const usage: Record<Period, UsageData> = {
      today: createUsageData("Today", "today"),
      week: createUsageData("This Week", "week"),
      month: createUsageData("This Month", "month"),
      total: createUsageData("All Time", "total"),
    };

    return NextResponse.json({ 
      usage,
      source: "openclaw-session",
      lastUpdated: rawData.lastUpdated,
    });
  } catch (err) {
    console.error("Usage API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch usage data" },
      { status: 500 }
    );
  }
}
