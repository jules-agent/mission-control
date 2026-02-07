// Test the news API by creating sample articles
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const sampleArticles = [
  {
    category: "tesla_ev",
    title: "Tesla Unveils New Battery Technology",
    summary: "New 4680 cells promise 500+ mile range. Game changer for Unplugged Performance builds.",
    url: "https://electrek.co/2026/02/07/tesla-battery-tech",
    image_url: "https://via.placeholder.com/400x225/3B82F6/FFFFFF?text=Tesla+Battery",
    source: "Electrek"
  },
  {
    category: "crypto",
    title: "Bitcoin Breaks $50K",
    summary: "BTC surges on institutional buying. Your holdings up 12% this week.",
    url: "https://coindesk.com/bitcoin-50k",
    image_url: "https://via.placeholder.com/400x225/F59E0B/FFFFFF?text=Bitcoin",
    source: "CoinDesk"
  },
  {
    category: "business",
    title: "EV Fleet Market to Double by 2027",
    summary: "UP.FIT positioned perfectly. Government contracts accelerating.",
    url: "https://techcrunch.com/ev-fleet-growth",
    image_url: "https://via.placeholder.com/400x225/8B5CF6/FFFFFF?text=Fleet+Growth",
    source: "TechCrunch"
  }
];

async function testAPI() {
  const baseUrl = process.env.VERCEL_URL || "http://localhost:3000";
  
  console.log("📤 Posting sample articles to API...\n");
  
  const response = await fetch(`${baseUrl}/api/news`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ articles: sampleArticles })
  });
  
  const result = await response.json();
  console.log("Response:", result);
  
  if (response.ok) {
    console.log("\n✅ Articles posted successfully!");
    console.log(`\n📰 View at: ${baseUrl}/news`);
  } else {
    console.error("\n❌ Error:", result.error);
  }
}

testAPI().catch(console.error);
