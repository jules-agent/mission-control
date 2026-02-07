import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://nqikobnkhpyfduqgfrew.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xaWtvYm5raHB5ZmR1cWdmcmV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjY4NTAsImV4cCI6MjA4NTkwMjg1MH0.oWxuoGxp__WYBHXW2sm4oO3pYoxA5QazEKmce0raTI8";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLinks() {
  const today = new Date().toISOString().split("T")[0];
  
  const { data } = await supabase
    .from("news_briefings")
    .select("title, url, category")
    .eq("briefing_date", today)
    .order("category");
  
  console.log("Current article URLs:\n");
  
  data.forEach(a => {
    console.log(`${a.title}`);
    console.log(`  ${a.url}\n`);
  });
}

checkLinks();
