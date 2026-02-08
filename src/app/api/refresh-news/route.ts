import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// RSS-based sources for reliable article extraction
const SOURCES = [
  // Tesla/EV
  { url: "https://electrek.co/feed/", category: "tesla_ev", source: "Electrek" },
  { url: "https://www.teslarati.com/feed/", category: "tesla_ev", source: "Teslarati" },
  { url: "https://insideevs.com/rss/news/", category: "tesla_ev", source: "InsideEVs" },

  // Crypto
  { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", category: "crypto", source: "CoinDesk" },
  { url: "https://cointelegraph.com/rss", category: "crypto", source: "CoinTelegraph" },

  // Tech/AI
  { url: "https://techcrunch.com/feed/", category: "tech", source: "TechCrunch" },
  { url: "https://www.theverge.com/rss/index.xml", category: "tech", source: "The Verge" },
  { url: "https://arstechnica.com/feed/", category: "tech", source: "Ars Technica" },

  // Business/Markets
  { url: "https://feeds.reuters.com/reuters/businessNews", category: "business", source: "Reuters Business" },

  // LA / Food
  { url: "https://la.eater.com/rss/index.xml", category: "la_food", source: "Eater LA" },
  { url: "https://laist.com/feeds/feed.xml", category: "la_food", source: "LAist" },

  // Whisky
  { url: "https://www.whiskyadvocate.com/feed/", category: "whisky", source: "Whisky Advocate" },
];

// Filters per news-sources.md
const SKIP_PATTERNS = /e-?bike|e-?scooter|micromobility|electric\s+bike|electric\s+scooter/i;

function extractFromXml(xml: string, maxItems = 3): Array<{ title: string; summary: string; url: string; imageUrl: string | null }> {
  const items: Array<{ title: string; summary: string; url: string; imageUrl: string | null }> = [];

  // Match <item> or <entry> blocks
  const itemRegex = /<(?:item|entry)[\s>]([\s\S]*?)<\/(?:item|entry)>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null && items.length < maxItems) {
    const block = match[1];

    // Title
    const titleMatch = block.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "";
    if (!title) continue;

    // Skip filtered topics
    if (SKIP_PATTERNS.test(title)) continue;

    // Link - try <link href="..."> (Atom) then <link>...</link> (RSS)
    let url = "";
    const linkHrefMatch = block.match(/<link[^>]*href=["']([^"']+)["']/i);
    const linkTextMatch = block.match(/<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
    if (linkHrefMatch) url = linkHrefMatch[1].trim();
    else if (linkTextMatch) url = linkTextMatch[1].trim();

    // Description/summary
    const descMatch =
      block.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i) ||
      block.match(/<summary[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>/i) ||
      block.match(/<content[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content>/i);
    let summary = descMatch ? descMatch[1].replace(/<[^>]+>/g, "").trim() : "";
    summary = summary.substring(0, 250);

    // Image - try media:content, media:thumbnail, enclosure, or og-like img in content
    let imageUrl: string | null = null;
    const mediaMatch = block.match(/<media:(?:content|thumbnail)[^>]*url=["']([^"']+)["']/i);
    const encMatch = block.match(/<enclosure[^>]*url=["']([^"']+)["']/i);
    const imgMatch = block.match(/<img[^>]*src=["']([^"']+)["']/i);
    if (mediaMatch) imageUrl = mediaMatch[1];
    else if (encMatch) imageUrl = encMatch[1];
    else if (imgMatch) imageUrl = imgMatch[1];

    items.push({ title, summary, url, imageUrl });
  }

  return items;
}

async function fetchSource(source: { url: string; category: string; source: string }): Promise<
  Array<{ category: string; title: string; summary: string; url: string; image_url: string | null; source: string }>
> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(source.url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "MissionControl/1.0 NewsBot",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      cache: "no-store",
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.error(`[${source.source}] HTTP ${res.status}`);
      return [];
    }

    const xml = await res.text();
    const articles = extractFromXml(xml, 3);

    return articles.map((a) => ({
      category: source.category,
      title: a.title,
      summary: a.summary || `From ${source.source}`,
      url: a.url || source.url,
      image_url: a.imageUrl,
      source: source.source,
    }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[${source.source}] Fetch error: ${msg}`);
    return [];
  }
}

// Also fetch top Reddit posts
async function fetchReddit(sub: string, category: string): Promise<
  Array<{ category: string; title: string; summary: string; url: string; image_url: string | null; source: string }>
> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`https://old.reddit.com/r/${sub}/hot/.json?limit=3`, {
      signal: controller.signal,
      headers: { "User-Agent": "MissionControl/1.0" },
      cache: "no-store",
    });
    clearTimeout(timeout);

    if (!res.ok) return [];
    const json = await res.json();
    const posts = json?.data?.children || [];

    return posts
      .filter((p: any) => !p.data.stickied)
      .slice(0, 3)
      .map((p: any) => ({
        category,
        title: p.data.title,
        summary: (p.data.selftext || "").substring(0, 200) || `r/${sub} discussion`,
        url: `https://reddit.com${p.data.permalink}`,
        image_url: p.data.thumbnail?.startsWith("http") ? p.data.thumbnail : null,
        source: `r/${sub}`,
      }));
  } catch {
    return [];
  }
}

export async function POST() {
  const startTime = Date.now();
  console.log("🔄 Starting fresh news refresh...");

  try {
    // 1. Delete ALL existing news for today to ensure completely fresh data
    const today = new Date().toISOString().split("T")[0];
    const { error: deleteError } = await supabase
      .from("news_briefings")
      .delete()
      .eq("briefing_date", today);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      // Continue anyway - insert will still work
    }

    // 2. Fetch all sources in parallel
    const rssPromises = SOURCES.map((s) => fetchSource(s));
    const redditPromises = [
      fetchReddit("wallstreetbets", "stocks"),
      fetchReddit("teslamotors", "tesla_ev"),
      fetchReddit("Bitcoin", "crypto"),
      fetchReddit("singularity", "tech"),
      fetchReddit("FoodLosAngeles", "la_food"),
    ];

    const results = await Promise.allSettled([...rssPromises, ...redditPromises]);

    const allArticles = results
      .filter((r): r is PromiseFulfilledResult<any[]> => r.status === "fulfilled")
      .flatMap((r) => r.value);

    if (allArticles.length === 0) {
      return NextResponse.json(
        { success: false, error: "No articles fetched from any source" },
        { status: 500 }
      );
    }

    // 3. Insert fresh articles
    const inserts = allArticles.map((a) => ({
      briefing_date: today,
      category: a.category,
      title: a.title,
      summary: a.summary,
      url: a.url,
      image_url: a.image_url,
      source: a.source,
    }));

    const { data, error } = await supabase.from("news_briefings").insert(inserts).select();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const categoryCounts = inserts.reduce((acc, a) => {
      acc[a.category] = (acc[a.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`✅ Refreshed ${data.length} articles in ${elapsed}s`);

    return NextResponse.json({
      success: true,
      message: `Refreshed ${data.length} fresh articles in ${elapsed}s`,
      count: data.length,
      categories: categoryCounts,
      elapsed_seconds: parseFloat(elapsed),
    });
  } catch (error) {
    console.error("Refresh error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
