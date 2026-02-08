import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_MODELS = [
  { name: "Sonnet 4.5", role: "Primary / Day-to-Day", icon: "🎯", status: "active" as const },
  { name: "Opus 4.6", role: "Complex / Fallback", icon: "🧠", status: "standby" as const },
  { name: "Kimi K2.5", role: "Final Fallback", icon: "⬇️", status: "standby" as const },
  { name: "Codex CLI", role: "Development", icon: "⚡", status: "standby" as const },
];

interface AgentStatus {
  id: number;
  active_model: string;
  models_json: Array<{
    name: string;
    role: string;
    icon: string;
    status: "active" | "standby";
  }>;
  last_updated: string;
  source: string;
}

function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("Supabase credentials not configured");
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function GET() {
  try {
    // Try to fetch from Supabase first
    const supabase = createSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("agent_status")
        .select("*")
        .eq("id", 1)
        .single();

      if (!error && data) {
        const status = data as AgentStatus;
        return NextResponse.json({
          activeModel: status.active_model,
          models: status.models_json,
          lastUpdated: status.last_updated,
          source: status.source,
        });
      }

      console.warn("Supabase query failed:", error);
    }

    // Try to fetch from local Gateway next (for real-time status when developing locally)
    const gatewayUrl = process.env.OPENCLAW_GATEWAY_URL || "http://127.0.0.1:18789";
    const gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN;
    const headers: Record<string, string> = {};
    if (gatewayToken) {
      headers["Authorization"] = `Bearer ${gatewayToken}`;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(`${gatewayUrl}/v1/status`, {
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        const activeModel = data.model || data.defaultModel || "nvidia/moonshotai/kimi-k2.5";
        const isKimi = activeModel.toLowerCase().includes("kimi");
        const isOpus = activeModel.toLowerCase().includes("opus") || activeModel.toLowerCase().includes("claude-opus");
        const isCodex = activeModel.toLowerCase().includes("codex");

        const isSonnet = activeModel.toLowerCase().includes("sonnet") || activeModel.toLowerCase().includes("claude-sonnet");
        const models = [
          { name: "Sonnet 4.5", role: "Primary / Day-to-Day", icon: "🎯", status: isSonnet ? "active" as const : "standby" as const },
          { name: "Opus 4.6", role: "Complex / Fallback", icon: "🧠", status: isOpus ? "active" as const : "standby" as const },
          { name: "Kimi K2.5", role: "Final Fallback", icon: "⬇️", status: isKimi ? "active" as const : "standby" as const },
          { name: "Codex CLI", role: "Development", icon: "⚡", status: isCodex ? "active" as const : "standby" as const },
        ];

        return NextResponse.json({
          activeModel,
          models,
          lastUpdated: new Date().toISOString(),
          source: "gateway_live",
        });
      }
    } catch {
      // Gateway not reachable, continue to fallback
    }

    // Ultimate fallback
    return NextResponse.json({
      activeModel: "anthropic/claude-sonnet-4-5",
      models: DEFAULT_MODELS,
      lastUpdated: new Date().toISOString(),
      source: "fallback_default",
    });
  } catch (error) {
    return NextResponse.json(
      {
        activeModel: "unknown",
        models: DEFAULT_MODELS,
        lastUpdated: new Date().toISOString(),
        source: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
