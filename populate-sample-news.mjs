import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://nqikobnkhpyfduqgfrew.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xaWtvYm5raHB5ZmR1cWdmcmV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjY4NTAsImV4cCI6MjA4NTkwMjg1MH0.oWxuoGxp__WYBHXW2sm4oO3pYoxA5QazEKmce0raTI8";

const supabase = createClient(supabaseUrl, supabaseKey);

const sampleNews = [
  // Tesla & EV
  {
    category: "tesla_ev",
    title: "Tesla Cybertruck Hits 200K+ Preorders",
    summary: "Production ramping fast. Early adopters reporting impressive range and towing capacity. Huge opportunity for UP aftermarket parts.",
    url: "https://electrek.co/cybertruck-preorders",
    image_url: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=400&h=225&fit=crop",
    source: "Electrek"
  },
  {
    category: "tesla_ev",
    title: "Model 3 Performance Upgrade Available",
    summary: "New track mode software unlocks 0-60 in 2.9s. Perfect for UP performance customers looking for more.",
    url: "https://teslarati.com/model-3-performance",
    image_url: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=225&fit=crop",
    source: "Teslarati"
  },
  {
    category: "tesla_ev",
    title: "EV Sales Jump 40% in Q1",
    summary: "Market share climbing fast. Tesla leads but competition heating up. Growing market = more customers for UP.",
    url: "https://insideevs.com/news/ev-sales-q1",
    image_url: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400&h=225&fit=crop",
    source: "InsideEVs"
  },
  
  // Crypto
  {
    category: "crypto",
    title: "Bitcoin ETF Sees Record Inflows",
    summary: "Institutional money flooding in. BTC at $52K, your portfolio up 15% this month.",
    url: "https://coindesk.com/btc-etf-inflows",
    image_url: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=400&h=225&fit=crop",
    source: "CoinDesk"
  },
  {
    category: "crypto",
    title: "Ethereum Staking Yields Hit 5.2%",
    summary: "Post-merge rewards climbing. Strong passive income opportunity if you're holding ETH.",
    url: "https://cointelegraph.com/eth-staking",
    image_url: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=225&fit=crop",
    source: "CoinTelegraph"
  },

  // Stocks
  {
    category: "stocks",
    title: "TSLA Jumps 8% on Delivery Beat",
    summary: "Q1 deliveries exceeded estimates by 12%. Stock momentum building, good for your holdings.",
    url: "https://finance.yahoo.com/tsla-delivery-beat",
    image_url: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=225&fit=crop",
    source: "Yahoo Finance"
  },
  {
    category: "stocks",
    title: "EV Sector Analyst Upgrades",
    summary: "Multiple firms raising price targets on TSLA, RIVN, LCID. Sector tailwinds strengthening.",
    url: "https://marketwatch.com/ev-upgrades",
    image_url: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&h=225&fit=crop",
    source: "MarketWatch"
  },

  // Whisky
  {
    category: "whisky",
    title: "Macallan 25 Auction Price Hits $8,500",
    summary: "Strong secondary market. Entry bottles under $1K still available - Bowmore 18 at $180 showing 2x potential.",
    url: "https://whiskyauctioneer.com/macallan-25",
    image_url: "https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=400&h=225&fit=crop",
    source: "Whisky Auctioneer"
  },
  {
    category: "whisky",
    title: "Limited Yamazaki Release Announced",
    summary: "Japanese distillery dropping rare 21-year. Expected to sell out instantly, strong flip potential if you can grab one.",
    url: "https://thewhiskyexchange.com/yamazaki-21",
    image_url: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=225&fit=crop",
    source: "The Whisky Exchange"
  },

  // Tech/AI
  {
    category: "tech",
    title: "OpenAI Launches GPT-5 with Reasoning",
    summary: "Massive leap in capabilities. Self-correcting logic, better coding. Game changer for automation.",
    url: "https://techcrunch.com/gpt5-launch",
    image_url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=225&fit=crop",
    source: "TechCrunch"
  },
  {
    category: "tech",
    title: "Apple Vision Pro Sales Exceed Estimates",
    summary: "Spatial computing taking off. Could open new markets for custom automotive AR experiences.",
    url: "https://theverge.com/vision-pro-sales",
    image_url: "https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?w=400&h=225&fit=crop",
    source: "The Verge"
  },
  {
    category: "tech",
    title: "Autonomous Truck Regulations Pass Senate",
    summary: "Federal framework approved. Self-driving freight becoming real - UP.FIT could pivot to fleet software integration.",
    url: "https://reuters.com/autonomous-trucks",
    image_url: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=225&fit=crop",
    source: "Reuters"
  },

  // LA Food
  {
    category: "la_food",
    title: "Tsujita LA Opens Venice Location",
    summary: "Legendary ramen spot opening near you. Lines already crazy, worth the hype for tonkotsu.",
    url: "https://eater.com/la/tsujita-venice",
    image_url: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=225&fit=crop",
    source: "Eater LA"
  },
  {
    category: "la_food",
    title: "Korean BBQ Spot Wins Michelin Star",
    summary: "Kang Ho Dong Baekjeong gets recognition. All dark meat, perfect keto spot for you.",
    url: "https://lataco.com/khd-baekjeong-michelin",
    image_url: "https://images.unsplash.com/photo-1504387432042-8aca549e4d92?w=400&h=225&fit=crop",
    source: "LA Taco"
  },

  // Business Ideas
  {
    category: "business",
    title: "Police Departments Prioritizing EV Fleets",
    summary: "48 new agencies committed to EV patrol cars this year. UP.FIT drone Cybertrucks could dominate this space.",
    url: "https://fleetowner.com/police-ev-commitment",
    image_url: "https://images.unsplash.com/photo-1533669955142-6a73332af4db?w=400&h=225&fit=crop",
    source: "Fleet Owner"
  },
  {
    category: "business",
    title: "Skydio X10 Expands Government Sales Team",
    summary: "Drone partner scaling fast. Perfect timing for UP.FIT's mobile command centers.",
    url: "https://techcrunch.com/skydio-gov-expansion",
    image_url: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&h=225&fit=crop",
    source: "TechCrunch"
  },
  {
    category: "business",
    title: "JDM Import Rules May Loosen in 2026",
    summary: "Congress considering easing 25-year rule. Could unlock huge demand for Bulletproof builds on newer imports.",
    url: "https://motortrend.com/jdm-import-rules",
    image_url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=225&fit=crop",
    source: "Motor Trend"
  }
];

async function populateNews() {
  const today = new Date().toISOString().split("T")[0];
  
  console.log(`📰 Populating news briefing for ${today}...\n`);
  
  const inserts = sampleNews.map(article => ({
    ...article,
    briefing_date: today
  }));

  const { data, error } = await supabase
    .from("news_briefings")
    .insert(inserts)
    .select();

  if (error) {
    console.error("❌ Error:", error.message);
    return;
  }

  console.log(`✅ Populated ${data.length} articles!`);
  console.log("\n📊 Breakdown:");
  const counts = sampleNews.reduce((acc, a) => {
    acc[a.category] = (acc[a.category] || 0) + 1;
    return acc;
  }, {});
  
  Object.entries(counts).forEach(([cat, count]) => {
    console.log(`   ${cat}: ${count} articles`);
  });
  
  console.log("\n🌐 View at: https://mission-control-mocha-omega.vercel.app/news");
}

populateNews();
