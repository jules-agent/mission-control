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

// --- RELEVANCE SCORING ---
// Based on Ben's preferences in memory/preferences.md

interface ScoredArticle {
  category: string;
  title: string;
  summary: string;
  url: string;
  image_url: string | null;
  source: string;
  relevance_score: number;
  why_relevant: string;
}

// Tier 1 keywords (score 100) - UP/Bulletproof/UP.FIT, Tesla/Elon, fleet/commercial vehicles
const TIER1_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\b(unplugged\s*performance|UP\.FIT|bulletproof)\b/i, reason: "Directly mentions Unplugged Performance / UP.FIT — your company" },
  { pattern: /\b(tesla|tsla)\b/i, reason: "Relevant to your TSLA position and Tesla ecosystem" },
  { pattern: /\belon\s*musk\b/i, reason: "Elon/Tesla ecosystem news you track" },
  { pattern: /\b(fleet|commercial\s+vehicle|commercial\s+ev|upfit|work\s+truck)\b/i, reason: "Fleet/commercial vehicle market — core UP.FIT business" },
  { pattern: /\bcybertruck\b/i, reason: "Cybertruck — key UP product line" },
  { pattern: /\bmodel\s*[syxp3]\b/i, reason: "Tesla model news — relevant to UP builds" },
];

// Tier 2 keywords (score 75) - Crypto/BTC/IBIT, stocks, whisky investing
const TIER2_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\b(bitcoin|btc)\b/i, reason: "Relevant to your BTC holdings (holder since ~$8K)" },
  { pattern: /\bibit\b/i, reason: "IBIT — your active options trading position" },
  { pattern: /\b(blackrock|bitcoin\s+etf)\b/i, reason: "Bitcoin ETF news — affects your IBIT trades" },
  { pattern: /\b(whisky|whiskey|scotch|japanese\s+whisky)\b.*\b(invest|auction|price|rare|cask)\b/i, reason: "Matches your whisky investment criteria (2x in 1 year, under $1,200)" },
  { pattern: /\b(signatory|cadenhead|gordon\s*&?\s*macphail)\b/i, reason: "Independent bottler you follow for whisky investing" },
];

// Tier 3 keywords (score 50) - Tech/AI for business, LA food, underground hip-hop
const TIER3_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\b(ai|artificial\s+intelligence)\b.*\b(business|enterprise|automat|operation|customer)\b/i, reason: "AI tools applicable to UP operations and customer outreach" },
  { pattern: /\b(funding\s+round|series\s+[a-e]|ipo|acquisition)\b/i, reason: "Big industry move — funding/M&A you track" },
  { pattern: /\b(la|los\s+angeles)\b.*\b(restaurant|food|dining|chef|open)\b/i, reason: "LA food scene — new spot to check out" },
  { pattern: /\b(korean\s+bbq|kbbq|sashimi|japanese\s+food|kabab|brisket|bbq)\b/i, reason: "Matches your food preferences (keto-friendly, adventurous eater)" },
  { pattern: /\b(hip[\s-]?hop|rap|boom[\s-]?bap)\b/i, reason: "Underground hip-hop — your music taste" },
  { pattern: /\b(nas\b|biggie|notorious\s*b\.?i\.?g|black\s+thought|mos\s+def|the\s+roots|dj\s+premier|jay[\s-]?z)\b/i, reason: "Artist you follow in the underground/classic hip-hop scene" },
  { pattern: /\bcrypto\b/i, reason: "Crypto market news you track" },
];

// Skip patterns - things Ben doesn't want
const SKIP_CONTENT = /\b(linux\s+desktop|gaming|nintendo|playstation|xbox|memecoin|nft|altcoin)\b/i;
// Chinese EV filter - only include if about US market impact
const CHINESE_EV = /\b(byd|nio|xpeng|li\s+auto|chinese\s+ev)\b/i;
const US_MARKET_CONTEXT = /\b(us\s+market|american|tariff|trade\s+war|import|export|compete|rival)\b/i;

function scoreArticle(article: { category: string; title: string; summary: string; source: string }): { score: number; reason: string } {
  const text = `${article.title} ${article.summary}`;

  // Skip unwanted content
  if (SKIP_CONTENT.test(text)) return { score: -1, reason: "Filtered: not relevant to your interests" };

  // Chinese EV filter
  if (CHINESE_EV.test(text) && !US_MARKET_CONTEXT.test(text)) {
    return { score: -1, reason: "Filtered: Chinese EV news without US market relevance" };
  }

  // Weekend market filter
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 6=Sat
  const isWeekend = day === 0 || day === 6;
  if (isWeekend && /\b(stock|market|ticker|s&p|dow|nasdaq)\b/i.test(text) && !/\b(bitcoin|btc|crypto|gold|silver)\b/i.test(text)) {
    return { score: -1, reason: "Filtered: Stock market closed on weekends" };
  }

  // Check tiers (return first/highest match)
  for (const { pattern, reason } of TIER1_PATTERNS) {
    if (pattern.test(text)) return { score: 100, reason };
  }
  for (const { pattern, reason } of TIER2_PATTERNS) {
    if (pattern.test(text)) return { score: 75, reason };
  }
  for (const { pattern, reason } of TIER3_PATTERNS) {
    if (pattern.test(text)) return { score: 50, reason };
  }

  // Default tier 4 based on category
  const categoryScores: Record<string, number> = {
    tesla_ev: 60, // Tesla category gets a bump even without keyword match
    crypto: 45,
    stocks: 40,
    tech: 30,
    whisky: 35,
    la_food: 25,
    business: 20,
  };

  const catScore = categoryScores[article.category] || 15;
  return { score: catScore, reason: `General ${article.category.replace("_", " ")} news` };
}

// --- DEDUPLICATION ---

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Simple word-overlap similarity (Jaccard-ish) */
function titleSimilarity(a: string, b: string): number {
  const wordsA = new Set(normalizeTitle(a).split(" ").filter(w => w.length > 3));
  const wordsB = new Set(normalizeTitle(b).split(" ").filter(w => w.length > 3));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let overlap = 0;
  for (const w of wordsA) if (wordsB.has(w)) overlap++;
  return overlap / Math.max(wordsA.size, wordsB.size);
}

/** Normalize URL to canonical form for exact-match dedup */
function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    // Remove tracking params
    u.searchParams.delete("utm_source");
    u.searchParams.delete("utm_medium");
    u.searchParams.delete("utm_campaign");
    u.searchParams.delete("utm_content");
    u.searchParams.delete("utm_term");
    u.searchParams.delete("ref");
    u.searchParams.delete("source");
    return u.origin + u.pathname.replace(/\/+$/, "");
  } catch {
    return url;
  }
}

/**
 * Deduplicate articles:
 * 1. Exact URL match → keep higher scored
 * 2. Similar title (>0.6 overlap) → keep the one with longer summary (more knowledge-dense)
 * 3. Filter out stories already served in past 7 days
 */
function deduplicateArticles(
  articles: ScoredArticle[],
  previousTitles: string[],
  previousUrls: string[]
): ScoredArticle[] {
  const prevTitleSet = previousTitles.map(normalizeTitle);
  const prevUrlSet = new Set(previousUrls.map(normalizeUrl));

  // Step 1: Filter out previously served stories
  let filtered = articles.filter((a) => {
    // Exact URL match
    if (prevUrlSet.has(normalizeUrl(a.url))) return false;
    // Similar title to previously served
    const normTitle = normalizeTitle(a.title);
    for (const prev of prevTitleSet) {
      if (titleSimilarity(normTitle, prev) > 0.6) return false;
    }
    return true;
  });

  // Step 2: Deduplicate within current batch
  // Sort by relevance_score desc, then summary length desc (prefer knowledge-dense)
  filtered.sort((a, b) => {
    if (b.relevance_score !== a.relevance_score) return b.relevance_score - a.relevance_score;
    return (b.summary?.length || 0) - (a.summary?.length || 0);
  });

  const kept: ScoredArticle[] = [];
  const keptNormTitles: string[] = [];
  const keptNormUrls = new Set<string>();

  for (const article of filtered) {
    const normUrl = normalizeUrl(article.url);
    const normTitle = normalizeTitle(article.title);

    // Skip exact URL duplicate
    if (keptNormUrls.has(normUrl)) continue;

    // Skip similar title duplicate (keep the first one since sorted by score)
    let isDup = false;
    for (const kt of keptNormTitles) {
      if (titleSimilarity(normTitle, kt) > 0.6) {
        isDup = true;
        break;
      }
    }
    if (isDup) continue;

    kept.push(article);
    keptNormTitles.push(normTitle);
    keptNormUrls.add(normUrl);
  }

  return kept;
}

// --- RSS PARSING ---

function extractFromXml(xml: string, maxItems = 5): Array<{ title: string; summary: string; url: string; imageUrl: string | null }> {
  const items: Array<{ title: string; summary: string; url: string; imageUrl: string | null }> = [];
  const itemRegex = /<(?:item|entry)[\s>]([\s\S]*?)<\/(?:item|entry)>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null && items.length < maxItems) {
    const block = match[1];

    const titleMatch = block.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "";
    if (!title) continue;
    if (SKIP_PATTERNS.test(title)) continue;

    let url = "";
    const linkHrefMatch = block.match(/<link[^>]*href=["']([^"']+)["']/i);
    const linkTextMatch = block.match(/<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
    if (linkHrefMatch) url = linkHrefMatch[1].trim();
    else if (linkTextMatch) url = linkTextMatch[1].trim();

    const descMatch =
      block.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i) ||
      block.match(/<summary[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>/i) ||
      block.match(/<content[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content>/i);
    let summary = descMatch ? descMatch[1].replace(/<[^>]+>/g, "").trim() : "";
    summary = summary.substring(0, 300);

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
    const articles = extractFromXml(xml, 5);

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

async function fetchReddit(sub: string, category: string): Promise<
  Array<{ category: string; title: string; summary: string; url: string; image_url: string | null; source: string }>
> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`https://old.reddit.com/r/${sub}/hot/.json?limit=5`, {
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
      .slice(0, 5)
      .map((p: any) => ({
        category,
        title: p.data.title,
        summary: (p.data.selftext || "").substring(0, 250) || `r/${sub} discussion`,
        url: `https://reddit.com${p.data.permalink}`,
        image_url: p.data.thumbnail?.startsWith("http") ? p.data.thumbnail : null,
        source: `r/${sub}`,
      }));
  } catch {
    return [];
  }
}

// --- MAIN ---

export async function POST() {
  const startTime = Date.now();
  console.log("🔄 Starting smart news refresh with dedup + relevance ranking...");

  try {
    const today = new Date().toISOString().split("T")[0];

    // 1. Fetch previously served stories from past 7 days for dedup
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const { data: previousStories } = await supabase
      .from("news_briefings")
      .select("title, url")
      .gte("briefing_date", weekAgo);

    const previousTitles = (previousStories || []).map((s) => s.title);
    const previousUrls = (previousStories || []).map((s) => s.url);

    // 2. Delete today's articles (we'll replace with fresh, ranked ones)
    await supabase.from("news_briefings").delete().eq("briefing_date", today);

    // 3. Fetch all sources in parallel
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

    // 4. Score every article for relevance
    const scored: ScoredArticle[] = allArticles
      .map((a) => {
        const { score, reason } = scoreArticle(a);
        return { ...a, relevance_score: score, why_relevant: reason };
      })
      .filter((a) => a.relevance_score > 0); // Remove filtered articles (score -1)

    // 5. Deduplicate against past stories AND within batch
    const deduped = deduplicateArticles(scored, previousTitles, previousUrls);

    // 6. Limit per category to keep briefing digestible (top 4 per category)
    const perCategory: Record<string, ScoredArticle[]> = {};
    for (const a of deduped) {
      if (!perCategory[a.category]) perCategory[a.category] = [];
      perCategory[a.category].push(a);
    }

    const finalArticles: ScoredArticle[] = [];
    for (const cat of Object.keys(perCategory)) {
      // Already sorted by score from dedup step
      finalArticles.push(...perCategory[cat].slice(0, 4));
    }

    // 7. Sort overall by relevance for insertion order
    finalArticles.sort((a, b) => b.relevance_score - a.relevance_score);

    // 8. Insert into DB (store why_relevant and relevance_score in summary field for now)
    const inserts = finalArticles.map((a) => ({
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
    const categoryCounts = finalArticles.reduce((acc, a) => {
      acc[a.category] = (acc[a.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dupsBefore = allArticles.length;
    const dupsAfter = finalArticles.length;
    const dupsRemoved = dupsBefore - dupsAfter;

    console.log(`✅ Refreshed ${data.length} articles in ${elapsed}s (${dupsRemoved} duplicates/filtered removed)`);

    // Return relevance data for the API response (used by news page)
    return NextResponse.json({
      success: true,
      message: `Refreshed ${data.length} articles in ${elapsed}s (${dupsRemoved} filtered/deduped)`,
      count: data.length,
      categories: categoryCounts,
      elapsed_seconds: parseFloat(elapsed),
      dedup_stats: {
        fetched: dupsBefore,
        after_scoring: scored.length,
        after_dedup: dupsAfter,
        removed: dupsRemoved,
      },
      // Store relevance metadata keyed by URL for the news page to use
      relevance: Object.fromEntries(
        finalArticles.map((a) => [a.url, { score: a.relevance_score, why: a.why_relevant }])
      ),
    });
  } catch (error) {
    console.error("Refresh error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
