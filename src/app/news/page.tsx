import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/auth-options";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

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
  const { data, error } = await supabase
    .from("news_briefings")
    .select("*")
    .eq("briefing_date", new Date().toISOString().split("T")[0])
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
    <main className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 px-4 py-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/"
              className="mb-2 text-sm text-slate-400 hover:text-slate-300"
            >
              ← Back to Mission Control
            </Link>
            <h1 className="text-4xl font-bold text-white">
              Daily News Briefing
            </h1>
            <p className="mt-2 text-slate-400">{today}</p>
          </div>
        </div>

        {briefings.length === 0 ? (
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-12 text-center">
            <p className="text-xl text-slate-400">
              No briefing available yet. Check back at 6:45 AM PST.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {briefings.map((briefing) => {
              const config = categoryConfig[briefing.category as keyof typeof categoryConfig];
              if (!config) return null;

              return (
                <section key={briefing.category}>
                  {/* Category Header */}
                  <div className="mb-4 flex items-center gap-3">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${config.color} text-2xl`}
                    >
                      {config.icon}
                    </div>
                    <h2 className="text-2xl font-bold text-white">
                      {config.name}
                    </h2>
                    <div className="ml-auto text-sm text-slate-500">
                      {briefing.articles.length} article{briefing.articles.length !== 1 ? "s" : ""}
                    </div>
                  </div>

                  {/* Articles Grid */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {briefing.articles.map((article) => (
                      <a
                        key={article.id}
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group overflow-hidden rounded-lg border border-slate-700 bg-slate-800/50 transition-all hover:border-slate-600 hover:bg-slate-800"
                      >
                        {/* Thumbnail */}
                        {article.image_url && (
                          <div className="aspect-video w-full overflow-hidden bg-slate-900">
                            <img
                              src={article.image_url}
                              alt={article.title}
                              className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            />
                          </div>
                        )}

                        {/* Content */}
                        <div className="p-4">
                          {/* Source badge */}
                          {article.source && (
                            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                              {article.source}
                            </div>
                          )}

                          {/* Title */}
                          <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-white group-hover:text-cyan-400">
                            {article.title}
                          </h3>

                          {/* Summary */}
                          <p className="line-clamp-3 text-sm text-slate-400">
                            {article.summary}
                          </p>

                          {/* Read more link */}
                          <div className="mt-3 flex items-center text-sm font-medium text-cyan-500">
                            Read more →
                          </div>
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
