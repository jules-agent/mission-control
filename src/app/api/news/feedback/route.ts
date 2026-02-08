import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { article_id, article_title, article_url, category, vote, comment } = body;

    if (!vote || !["up", "down"].includes(vote)) {
      return NextResponse.json({ error: "Invalid vote" }, { status: 400 });
    }

    const { data, error } = await supabase.from("news_feedback").insert({
      article_id: article_id || null,
      article_title: article_title || "",
      article_url: article_url || "",
      category: category || "",
      vote,
      comment: comment || null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, vote });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("news_feedback")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Aggregate stats
    const stats = {
      total: data.length,
      thumbsUp: data.filter((f) => f.vote === "up").length,
      thumbsDown: data.filter((f) => f.vote === "down").length,
      byCategory: {} as Record<string, { up: number; down: number }>,
      recentComments: data
        .filter((f) => f.comment)
        .slice(0, 10)
        .map((f) => ({
          category: f.category,
          title: f.article_title,
          comment: f.comment,
          created_at: f.created_at,
        })),
    };

    data.forEach((f) => {
      if (!stats.byCategory[f.category]) {
        stats.byCategory[f.category] = { up: 0, down: 0 };
      }
      stats.byCategory[f.category][f.vote as "up" | "down"]++;
    });

    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
