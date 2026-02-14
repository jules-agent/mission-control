import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/auth-options";
import { NextRequest, NextResponse } from "next/server";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST: Create a new report (public - no auth required for cross-app submissions)
export async function POST(request: NextRequest) {
  try {
    const { app_name, type, description, screenshot_url, user_email } = await request.json();

    if (!description?.trim()) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    if (!app_name) {
      return NextResponse.json({ error: "app_name is required" }, { status: 400 });
    }

    const validApps = ["identity", "dadengine", "soundtrack", "storyspark"];
    if (!validApps.includes(app_name)) {
      return NextResponse.json({ error: "Invalid app_name" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("app_reports")
      .insert({
        app_name,
        type: type === "feature" ? "feature" : "bug",
        description: description.trim(),
        screenshot_url: screenshot_url || null,
        user_email: user_email || null,
        priority: "medium",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { headers: corsHeaders() });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: corsHeaders() });
  }
}

// GET: List reports (admin only)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const app_name = searchParams.get("app_name");
  const status = searchParams.get("status");
  const type = searchParams.get("type");

  let query = supabase
    .from("app_reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (app_name && app_name !== "all") query = query.eq("app_name", app_name);
  if (status && status !== "all") query = query.eq("status", status);
  if (type && type !== "all") query = query.eq("type", type);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// PATCH: Update report status/resolution (admin only)
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, status, resolution_notes, priority } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Report id is required" }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (status) updates.status = status;
    if (resolution_notes !== undefined) updates.resolution_notes = resolution_notes;
    if (priority) updates.priority = priority;
    if (status === "resolved") updates.resolved_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("app_reports")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
