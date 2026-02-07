import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/auth-options";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

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
}

interface BriefingData {
  briefing_date: string;
  category: string;
  articles: NewsArticle[];
}

const categoryConfig = {
  tesla_ev: { name: "Tesla & EV", icon: "⚡", color: "from-blue-500 to-cyan-500" },
  crypto: { name: "Crypto & Bitcoin", icon: "₿", color: "from-orange-500 to-yellow-500" },
  stocks: { name: "Stocks & Markets", icon: "📈", color: "from-green-500 to-emerald-500" },
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

  // Group by category
  const grouped = (data || []).reduce((acc, article) => {
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

  return Object.values(grouped);
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
        </div>

        {briefings.length === 0 ? (
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-8 text-center">
            <p className="text-slate-400">
              No briefing available yet. Check back at 6:45 AM PST.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {briefings.map((briefing) => {
              const config = categoryConfig[briefing.category as keyof typeof categoryConfig];
              if (!config) return null;

              return (
                <section key={briefing.category}>
                  {/* Category Header - compact */}
                  <div className="mb-1.5 flex items-center gap-1.5 border-l-2 border-slate-700 pl-2">
                    <span className="text-sm">{config.icon}</span>
                    <h2 className="text-sm font-bold text-white">
                      {config.name}
                    </h2>
                    <span className="text-[10px] text-slate-600">
                      ({briefing.articles.length})
                    </span>
                  </div>

                  {/* Articles - horizontal compact rows */}
                  <div className="space-y-1">
                    {briefing.articles.map((article) => (
                      <a
                        key={article.id}
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-start gap-2 rounded border border-slate-800/50 bg-slate-900/30 p-1.5 transition-all hover:border-slate-600 hover:bg-slate-800/60"
                      >
                        {/* Tiny thumbnail */}
                        {article.image_url && (
                          <div className="h-10 w-14 flex-shrink-0 overflow-hidden rounded bg-slate-950">
                            <img
                              src={article.image_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}

                        {/* Content - inline */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-[9px] font-medium uppercase tracking-wider text-slate-600">
                              {article.source}
                            </span>
                          </div>
                          <h3 className="line-clamp-1 text-xs font-semibold leading-tight text-white group-hover:text-cyan-400">
                            {article.title}
                          </h3>
                          <p className="line-clamp-1 text-[11px] leading-snug text-slate-500">
                            {article.summary}
                          </p>
                        </div>
                      </a>
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
