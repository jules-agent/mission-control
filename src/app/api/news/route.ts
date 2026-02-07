import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface NewsArticle {
  category: string;
  title: string;
  summary: string;
  url: string;
  image_url?: string;
  source: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { articles, date } = body as {
      articles: NewsArticle[];
      date?: string;
    };

    if (!articles || !Array.isArray(articles)) {
      return NextResponse.json(
        { error: "Invalid articles data" },
        { status: 400 }
      );
    }

    const briefingDate = date || new Date().toISOString().split("T")[0];

    // Insert all articles
    const inserts = articles.map((article) => ({
      briefing_date: briefingDate,
      category: article.category,
      title: article.title,
      summary: article.summary,
      url: article.url,
      image_url: article.image_url || null,
      source: article.source,
    }));

    const { data, error } = await supabase
      .from("news_briefings")
      .insert(inserts)
      .select();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: data.length,
      briefing_date: briefingDate,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("news_briefings")
      .select("*")
      .eq("briefing_date", today)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group by category
    const grouped = (data || []).reduce((acc, article) => {
      const category = article.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(article);
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({
      briefing_date: today,
      categories: grouped,
      total: data.length,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
