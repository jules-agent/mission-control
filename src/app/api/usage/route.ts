import { NextResponse } from "next/server";

// API usage tracking
// TODO: Connect to real provider APIs for live data
// - Anthropic: https://api.anthropic.com/v1/usage
// - OpenAI: https://api.openai.com/v1/usage
// - NVIDIA: Check dashboard

type ApiProvider = {
  id: string;
  name: string;
  requests: number;
  tokens: { input: number; output: number };
  cost: number;
  status: "active" | "idle" | "error";
};

// For now, return estimated/tracked data
// This can be enhanced to pull from actual APIs or a local tracking DB
function getUsageData() {
  const providers: ApiProvider[] = [
    {
      id: "anthropic",
      name: "Anthropic (Opus)",
      requests: 47,
      tokens: { input: 285000, output: 42000 },
      cost: 12.45,
      status: "active",
    },
    {
      id: "nvidia-kimi",
      name: "NVIDIA (Kimi K2.5)",
      requests: 156,
      tokens: { input: 890000, output: 125000 },
      cost: 0.00, // Free tier
      status: "active",
    },
    {
      id: "openai",
      name: "OpenAI (Whisper/DALL-E)",
      requests: 8,
      tokens: { input: 0, output: 0 },
      cost: 0.32,
      status: "idle",
    },
    {
      id: "brave",
      name: "Brave Search",
      requests: 23,
      tokens: { input: 0, output: 0 },
      cost: 0.00, // Free tier
      status: "active",
    },
  ];

  const totalCost = providers.reduce((sum, p) => sum + p.cost, 0);

  return {
    providers,
    totalCost,
    period: "Today",
  };
}

export async function GET() {
  try {
    const usage = getUsageData();
    return NextResponse.json(usage);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch usage data" },
      { status: 500 }
    );
  }
}
