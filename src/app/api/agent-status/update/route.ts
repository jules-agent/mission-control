import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const API_SECRET = process.env.INTERNAL_API_SECRET;

interface ModelStatus {
  name: string;
  role: string;
  icon: string;
  status: "active" | "standby";
}

function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase credentials not configured");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

function buildModelsArray(activeModel: string): ModelStatus[] {
  const isSonnet = activeModel.toLowerCase().includes("sonnet") || activeModel.toLowerCase().includes("claude-sonnet");
  const isOpus = activeModel.toLowerCase().includes("opus") || activeModel.toLowerCase().includes("claude-opus");
  const isKimi = activeModel.toLowerCase().includes("kimi");
  const isCodex = activeModel.toLowerCase().includes("codex");

  return [
    { name: "Sonnet 4.5", role: "Primary / Day-to-Day", icon: "🎯", status: isSonnet ? "active" : "standby" },
    { name: "Opus 4.5", role: "Complex / Fallback", icon: "🧠", status: isOpus ? "active" : "standby" },
    { name: "Kimi K2.5", role: "Final Fallback", icon: "⬇️", status: isKimi ? "active" : "standby" },
    { name: "Codex CLI", role: "Development", icon: "⚡", status: isCodex ? "active" : "standby" },
  ];
}

export async function POST(request: Request) {
  try {
    // Check API secret for internal requests
    const authHeader = request.headers.get("authorization");
    const providedSecret = authHeader?.replace("Bearer ", "");

    if (API_SECRET && providedSecret !== API_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { activeModel } = body;

    if (!activeModel) {
      return NextResponse.json(
        { error: "Missing activeModel" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();
    const models = buildModelsArray(activeModel);

    // Upsert into Supabase - single row with id=1
    const { data, error } = await supabase
      .from("agent_status")
      .upsert({
        id: 1,
        active_model: activeModel,
        models_json: models,
        last_updated: new Date().toISOString(),
        source: "agent_sync",
      }, {
        onConflict: "id",
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase upsert error:", error);
      return NextResponse.json(
        { error: "Database error", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      activeModel,
      models,
      lastUpdated: new Date().toISOString(),
      source: "supabase",
    });
  } catch (error) {
    console.error("Error updating agent status:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
