import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const DATA_FILE = join(process.cwd(), "data", "agent-status.json");

// Default model configuration
const DEFAULT_MODELS = [
  { name: "Kimi K2.5", role: "Default / Day-to-Day", icon: "💬", status: "active" },
  { name: "Opus 4.5", role: "Complex Tasks", icon: "🧠", status: "standby" },
  { name: "Codex CLI", role: "Development", icon: "⚡", status: "standby" },
];

function getStoredStatus() {
  try {
    if (existsSync(DATA_FILE)) {
      const data = readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Failed to read agent-status.json:", e);
  }
  return null;
}

export async function GET() {
  try {
    // Try to fetch from local Gateway first (if running locally)
    const gatewayUrl = process.env.OPENCLAW_GATEWAY_URL || "http://127.0.0.1:18789";
    const gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN;
    
    const headers: Record<string, string> = {};
    if (gatewayToken) {
      headers["Authorization"] = `Bearer ${gatewayToken}`;
    }
    
    // Try gateway with short timeout
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
        
        // Determine which model is active
        const isKimi = activeModel.toLowerCase().includes("kimi");
        const isOpus = activeModel.toLowerCase().includes("opus") || activeModel.toLowerCase().includes("claude-opus");
        const isCodex = activeModel.toLowerCase().includes("codex");
        
        const models = [
          { name: "Kimi K2.5", role: "Default / Day-to-Day", icon: "💬", status: isKimi ? "active" as const : "standby" as const },
          { name: "Opus 4.5", role: "Complex Tasks", icon: "🧠", status: isOpus ? "active" as const : "standby" as const },
          { name: "Codex CLI", role: "Development", icon: "⚡", status: isCodex ? "active" as const : "standby" as const },
        ];
        
        const result = {
          activeModel,
          models,
          lastUpdated: new Date().toISOString(),
          source: "gateway_live",
        };
        
        // Also update stored file for when gateway is unreachable
        try {
          writeFileSync(DATA_FILE, JSON.stringify(result, null, 2));
        } catch (e) {
          // Ignore write errors in Vercel environment
        }
        
        return NextResponse.json(result);
      }
    } catch {
      // Gateway not reachable, fall through to stored status
    }
    
    // Try stored status file
    const stored = getStoredStatus();
    if (stored) {
      return NextResponse.json({
        ...stored,
        source: "stored_file",
        note: "Gateway unreachable, showing last known status",
      });
    }
    
    // Ultimate fallback
    return NextResponse.json({
      activeModel: "nvidia/moonshotai/kimi-k2.5",
      models: [
        { name: "Kimi K2.5", role: "Default / Day-to-Day", icon: "💬", status: "active" },
        { name: "Opus 4.5", role: "Complex Tasks", icon: "🧠", status: "standby" },
        { name: "Codex CLI", role: "Development", icon: "⚡", status: "standby" },
      ],
      lastUpdated: new Date().toISOString(),
      source: "fallback_default",
    });
    
  } catch (error) {
    return NextResponse.json({
      activeModel: "unknown",
      models: DEFAULT_MODELS,
      lastUpdated: new Date().toISOString(),
      source: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}

// POST endpoint for the agent to update its status
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { activeModel } = body;
    
    if (!activeModel) {
      return NextResponse.json({ error: "Missing activeModel" }, { status: 400 });
    }
    
    const isKimi = activeModel.toLowerCase().includes("kimi");
    const isOpus = activeModel.toLowerCase().includes("opus") || activeModel.toLowerCase().includes("claude-opus");
    const isCodex = activeModel.toLowerCase().includes("codex");
    
    const result = {
      activeModel,
      models: [
        { name: "Kimi K2.5", role: "Default / Day-to-Day", icon: "💬", status: isKimi ? "active" as const : "standby" as const },
        { name: "Opus 4.5", role: "Complex Tasks", icon: "🧠", status: isOpus ? "active" as const : "standby" as const },
        { name: "Codex CLI", role: "Development", icon: "⚡", status: isCodex ? "active" as const : "standby" as const },
      ],
      lastUpdated: new Date().toISOString(),
      source: "agent_post",
    };
    
    // Try to write to file (works locally, fails silently on Vercel)
    try {
      writeFileSync(DATA_FILE, JSON.stringify(result, null, 2));
    } catch (e) {
      // In Vercel, we can't write to filesystem, so just return success
      // The agent should also update the remote DB or the data will be in-memory only
    }
    
    return NextResponse.json({ success: true, ...result });
    
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
