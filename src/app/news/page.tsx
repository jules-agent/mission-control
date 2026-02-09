import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/auth-options";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import FeedbackButtons from "./FeedbackButtons";
import { RefreshNewsButton } from "./RefreshNewsButton";

// Force dynamic rendering on Vercel
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  image_url: string | null;
  source: string;
  relevance_score?: number;
  why_relevant?: string;
}

interface BriefingData {
  briefing_date: string;
  category: string;
  articles: NewsArticle[];
}

const categoryConfig = {
  tesla_ev: { name: "Tesla & EV", icon: "⚡", color: "from-blue-500 to-cyan-500" },
  stocks: { name: "Finance & Investing", icon: "📈", color: "from-green-500 to-emerald-500" },
  whisky: { name: "Whisky Investing", icon: "🥃", color: "from-amber-500 to-orange-600" },
  tech: { name: "Technology & AI", icon: "🤖", color: "from-purple-500 to-pink-500" },
  la_food: { name: "LA Food & Culture", icon: "🌮", color: "from-red-500 to-rose-500" },
  business: { name: "Business Ideas", icon: "💡", color: "from-indigo-500 to-blue-600" },
};

async function getBriefingData(): Promise<BriefingData[]> {
  // Get the latest briefing date first
  const { data: latestData } = await supabase
    .from("news_briefings")
    .select("briefing_date")
    .order("briefing_date", { ascending: false })
    .limit(1);

  if (!latestData || latestData.length === 0) {
    return [];
  }

  const latestDate = latestData[0].briefing_date;

  // Fetch all articles for the latest briefing
  const { data, error } = await supabase
    .from("news_briefings")
    .select("*")
    .eq("briefing_date", latestDate)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching briefing:", error);
    return [];
  }

  // Enrich with relevance scores
  const enriched = (data || []).map((article) => {
    // Strip relevancy tags from summary before checking for company mentions
    // Tags are appended after " — " with emoji patterns
    const cleanSummary = (article.summary || "").split(" — ")[0];
    const text = `${article.title} ${cleanSummary}`;
    let relevance_score = 15;
    let why_relevant = "General news";

    // Tier 1
    if (/\b(unplugged\s*performance|UP\.FIT|bulletproof)\b/i.test(text)) { relevance_score = 100; why_relevant = "Directly mentions UP / UP.FIT"; }
    else if (/\b(tesla|tsla|cybertruck)\b/i.test(text)) { relevance_score = 100; why_relevant = "Tesla ecosystem — your TSLA position & UP builds"; }
    else if (/\belon\s*musk\b/i.test(text)) { relevance_score = 100; why_relevant = "Elon/Tesla ecosystem"; }
    else if (/\b(fleet|commercial\s+vehicle|commercial\s+ev)\b/i.test(text)) { relevance_score = 100; why_relevant = "Fleet/commercial — core UP.FIT business"; }
    else if (/\bmodel\s*[syxp3]\b/i.test(text)) { relevance_score = 100; why_relevant = "Tesla model news — UP builds"; }
    // Tier 2
    else if (/\b(bitcoin|btc)\b/i.test(text)) { relevance_score = 75; why_relevant = "Your BTC holdings (since ~$8K)"; }
    else if (/\bibit\b/i.test(text)) { relevance_score = 75; why_relevant = "IBIT — your active options position"; }
    else if (/\b(blackrock|bitcoin\s+etf)\b/i.test(text)) { relevance_score = 75; why_relevant = "Bitcoin ETF — affects your IBIT trades"; }
    else if (/\b(whisky|whiskey|scotch)\b.*\b(invest|auction|price|rare|cask)\b/i.test(text)) { relevance_score = 75; why_relevant = "Whisky investing (2x/1yr, <$1,200)"; }
    // Tier 3
    else if (/\b(ai|artificial\s+intelligence)\b.*\b(business|enterprise|automat)\b/i.test(text)) { relevance_score = 50; why_relevant = "AI tools for UP operations"; }
    else if (/\b(la|los\s+angeles)\b.*\b(restaurant|food|dining)\b/i.test(text)) { relevance_score = 50; why_relevant = "LA food scene — check it out"; }
    else if (/\bcrypto\b/i.test(text)) { relevance_score = 50; why_relevant = "Crypto market"; }
    else {
      const cs: Record<string, [number, string]> = {
        tesla_ev: [60, "EV/Tesla industry"], stocks: [40, "Markets/investing"],
        whisky: [35, "Whisky"], tech: [30, "Tech/AI"], la_food: [25, "LA scene"], business: [20, "Business"],
      };
      const [s, w] = cs[article.category] || [15, "General news"];
      relevance_score = s; why_relevant = w;
    }

    return { ...article, relevance_score, why_relevant };
  });

  // Group by category, sorted by relevance within each
  const grouped = enriched.reduce((acc, article) => {
    const category = article.category;
    if (!acc[category]) {
      acc[category] = {
        briefing_date: article.briefing_date,
        category,
        articles: [],
      };
    }
    acc[category].articles.push(article);
    return acc;
  }, {} as Record<string, BriefingData>);

  // Sort articles within each category by relevance
  for (const cat of Object.values(grouped) as BriefingData[]) {
    cat.articles.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
  }

  // Sort categories by highest-scored article
  const cats = Object.values(grouped) as BriefingData[];
  return cats.sort((a, b) => {
    const aMax = Math.max(...a.articles.map(x => x.relevance_score || 0));
    const bMax = Math.max(...b.articles.map(x => x.relevance_score || 0));
    return bMax - aMax;
  });
}

export default async function NewsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const briefings = await getBriefingData();
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 px-3 py-4">
      <div className="mx-auto max-w-[1800px]">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              ← Mission Control
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-white">
              Daily News Briefing
            </h1>
            <p className="text-xs text-slate-500">{today}</p>
          </div>
          <RefreshNewsButton />
        </div>

        {briefings.length === 0 ? (
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-8 text-center">
            <p className="text-slate-400">
              No briefing available yet. Check back at 6:45 AM PST.
            </p>
          </div>
        ) : (
          <div className="columns-1 gap-4 md:columns-2 xl:columns-3 2xl:columns-4">
            {briefings.map((briefing) => {
              const config = categoryConfig[briefing.category as keyof typeof categoryConfig];
              if (!config) return null;

              return (
                <section key={briefing.category} className="mb-4 break-inside-avoid">
                  {/* Category Header */}
                  <div className="mb-1 flex items-center gap-1.5 border-b border-slate-800 pb-1">
                    <span className="text-xs">{config.icon}</span>
                    <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      {config.name}
                    </h2>
                    <span className="text-[10px] text-slate-600">
                      {briefing.articles.length}
                    </span>
                  </div>

                  {/* Articles - text only, dense */}
                  <div className="divide-y divide-slate-800/50">
                    {briefing.articles.map((article) => (
                      <div
                        key={article.id}
                        className="group py-1.5 transition-colors hover:bg-slate-800/30"
                      >
                        <div className="flex items-start gap-2">
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-w-0 flex-1"
                          >
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-[9px] font-medium text-slate-600">
                                {article.source}
                              </span>
                            </div>
                            <h3 className="text-[13px] font-semibold leading-snug text-white group-hover:text-cyan-400">
                              {article.title}
                            </h3>
                            <p className="mt-0.5 text-xs leading-snug text-slate-400">
                              {article.summary}
                            </p>
                            {article.why_relevant && article.why_relevant !== "General news" && (
                              <p className="mt-0.5 text-[10px] leading-snug text-cyan-500/70 italic">
                                💡 {article.why_relevant}
                              </p>
                            )}
                          </a>
                          <div className="flex-shrink-0 pt-1">
                            <FeedbackButtons
                              articleId={article.id}
                              articleTitle={article.title}
                              articleUrl={article.url}
                              category={briefing.category}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
// News dashboard v1.0
