import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const supabaseUrl = "https://nqikobnkhpyfduqgfrew.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xaWtvYm5raHB5ZmR1cWdmcmV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjY4NTAsImV4cCI6MjA4NTkwMjg1MH0.oWxuoGxp__WYBHXW2sm4oO3pYoxA5QazEKmce0raTI8";

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log("🔧 Setting up news_briefings table...\n");

  // Check if table exists
  const { data: existing, error: checkError } = await supabase
    .from("news_briefings")
    .select("id")
    .limit(1);

  if (!checkError) {
    console.log("✅ Table already exists!");
    console.log("   Testing with sample data...\n");
    await testWithSampleData();
    return;
  }

  console.log("📋 Table doesn't exist. Please run this SQL in Supabase dashboard:");
  console.log("   → https://supabase.com/dashboard/project/nqikobnkhpyfduqgfrew/sql/new\n");
  
  const sql = readFileSync("supabase/news_briefings.sql", "utf-8");
  console.log(sql);
  console.log("\n⏳ After running the SQL, run this script again to test.");
}

async function testWithSampleData() {
  const sampleArticles = [
    {
      briefing_date: new Date().toISOString().split("T")[0],
      category: "tesla_ev",
      title: "Tesla Unveils New Battery Technology",
      summary: "New 4680 cells promise 500+ mile range. Game changer for Unplugged Performance builds.",
      url: "https://electrek.co/2026/02/07/tesla-battery-test",
      image_url: "https://via.placeholder.com/400x225/3B82F6/FFFFFF?text=Tesla+Battery",
      source: "Electrek"
    },
    {
      briefing_date: new Date().toISOString().split("T")[0],
      category: "crypto",
      title: "Bitcoin Breaks $50K",
      summary: "BTC surges on institutional buying. Your holdings up 12% this week.",
      url: "https://coindesk.com/bitcoin-50k-test",
      image_url: "https://via.placeholder.com/400x225/F59E0B/FFFFFF?text=Bitcoin",
      source: "CoinDesk"
    },
    {
      briefing_date: new Date().toISOString().split("T")[0],
      category: "business",
      title: "EV Fleet Market to Double by 2027",
      summary: "UP.FIT positioned perfectly. Government contracts accelerating.",
      url: "https://techcrunch.com/ev-fleet-test",
      image_url: "https://via.placeholder.com/400x225/8B5CF6/FFFFFF?text=Fleet+Growth",
      source: "TechCrunch"
    }
  ];

  const { data, error } = await supabase
    .from("news_briefings")
    .insert(sampleArticles)
    .select();

  if (error) {
    console.error("❌ Error inserting test data:", error.message);
    return;
  }

  console.log(`✅ Inserted ${data.length} test articles!`);
  console.log("\n📰 View the news dashboard:");
  console.log("   Local: http://localhost:3000/news");
  console.log("   Live:  https://mission-control-mocha-omega.vercel.app/news\n");
}

setupDatabase().catch(console.error);
