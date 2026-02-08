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

// Relevance scoring (mirrors refresh-news logic for display ordering)
function getRelevanceScore(article: { category: string; title: string; summary: string }): { score: number; why: string } {
  const text = `${article.title} ${article.summary}`;

  // Tier 1
  if (/\b(unplugged\s*performance|UP\.FIT|bulletproof)\b/i.test(text))
    return { score: 100, why: "Directly mentions Unplugged Performance / UP.FIT — your company" };
  if (/\b(tesla|tsla)\b/i.test(text))
    return { score: 100, why: "Relevant to your TSLA position and Tesla ecosystem" };
  if (/\belon\s*musk\b/i.test(text))
    return { score: 100, why: "Elon/Tesla ecosystem news you track" };
  if (/\b(fleet|commercial\s+vehicle|commercial\s+ev|upfit|work\s+truck)\b/i.test(text))
    return { score: 100, why: "Fleet/commercial vehicle market — core UP.FIT business" };
  if (/\bcybertruck\b/i.test(text))
    return { score: 100, why: "Cybertruck — key UP product line" };
  if (/\bmodel\s*[syxp3]\b/i.test(text))
    return { score: 100, why: "Tesla model news — relevant to UP builds" };

  // Tier 2
  if (/\b(bitcoin|btc)\b/i.test(text))
    return { score: 75, why: "Relevant to your BTC holdings (holder since ~$8K)" };
  if (/\bibit\b/i.test(text))
    return { score: 75, why: "IBIT — your active options trading position" };
  if (/\b(blackrock|bitcoin\s+etf)\b/i.test(text))
    return { score: 75, why: "Bitcoin ETF news — affects your IBIT trades" };
  if (/\b(whisky|whiskey|scotch|japanese\s+whisky)\b.*\b(invest|auction|price|rare|cask)\b/i.test(text))
    return { score: 75, why: "Matches your whisky investment criteria (2x in 1 year, under $1,200)" };

  // Tier 3
  if (/\b(ai|artificial\s+intelligence)\b.*\b(business|enterprise|automat|operation|customer)\b/i.test(text))
    return { score: 50, why: "AI tools applicable to UP operations" };
  if (/\b(la|los\s+angeles)\b.*\b(restaurant|food|dining|chef|open)\b/i.test(text))
    return { score: 50, why: "LA food scene — new spot to check out" };
  if (/\b(hip[\s-]?hop|rap|boom[\s-]?bap)\b/i.test(text))
    return { score: 50, why: "Underground hip-hop — your music taste" };
  if (/\bcrypto\b/i.test(text))
    return { score: 50, why: "Crypto market news you track" };

  // Category defaults
  const catScores: Record<string, number> = { tesla_ev: 60, crypto: 45, stocks: 40, whisky: 35, tech: 30, la_food: 25, business: 20 };
  return { score: catScores[article.category] || 15, why: `General ${article.category.replace("_", " ")} news` };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { articles, date } = body as { articles: NewsArticle[]; date?: string };

    if (!articles || !Array.isArray(articles)) {
      return NextResponse.json({ error: "Invalid articles data" }, { status: 400 });
    }

    const briefingDate = date || new Date().toISOString().split("T")[0];

    const inserts = articles.map((article) => ({
      briefing_date: briefingDate,
      category: article.category,
      title: article.title,
      summary: article.summary,
      url: article.url,
      image_url: article.image_url || null,
      source: article.source,
    }));

    const { data, error } = await supabase.from("news_briefings").insert(inserts).select();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: data.length, briefing_date: briefingDate });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data: latestData } = await supabase
      .from("news_briefings")
      .select("briefing_date")
      .order("briefing_date", { ascending: false })
      .limit(1);

    if (!latestData || latestData.length === 0) {
      return NextResponse.json({ briefing_date: null, categories: {}, total: 0 });
    }

    const latestDate = latestData[0].briefing_date;

    const { data, error } = await supabase
      .from("news_briefings")
      .select("*")
      .eq("briefing_date", latestDate)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich with relevance scores and sort within categories
    const enriched = (data || []).map((article) => {
      const { score, why } = getRelevanceScore(article);
      return { ...article, relevance_score: score, why_relevant: why };
    });

    // Group by category, sorted by relevance within each
    const grouped = enriched.reduce((acc, article) => {
      const category = article.category;
      if (!acc[category]) acc[category] = [];
      acc[category].push(article);
      return acc;
    }, {} as Record<string, any[]>);

    // Sort within each category by relevance
    for (const cat of Object.keys(grouped)) {
      grouped[cat].sort((a: any, b: any) => b.relevance_score - a.relevance_score);
    }

    return NextResponse.json({
      briefing_date: latestDate,
      categories: grouped,
      total: enriched.length,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
