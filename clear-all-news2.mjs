import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://nqikobnkhpyfduqgfrew.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xaWtvYm5raHB5ZmR1cWdmcmV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjY4NTAsImV4cCI6MjA4NTkwMjg1MH0.oWxuoGxp__WYBHXW2sm4oO3pYoxA5QazEKmce0raTI8";

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearAll() {
  const today = new Date().toISOString().split("T")[0];
  
  // Get all articles first
  const { data: articles } = await supabase
    .from("news_briefings")
    .select("id")
    .eq("briefing_date", today);
  
  console.log(`Found ${articles.length} articles to delete\n`);
  
  // Delete each one
  for (const article of articles) {
    await supabase
      .from("news_briefings")
      .delete()
      .eq("id", article.id);
  }
  
  console.log(`✅ Cleared all fake articles. Ready for real news.`);
}

clearAll();
