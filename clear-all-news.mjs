import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://nqikobnkhpyfduqgfrew.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xaWtvYm5raHB5ZmR1cWdmcmV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjY4NTAsImV4cCI6MjA4NTkwMjg1MH0.oWxuoGxp__WYBHXW2sm4oO3pYoxA5QazEKmce0raTI8";

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearAll() {
  const today = new Date().toISOString().split("T")[0];
  
  const { data, error } = await supabase
    .from("news_briefings")
    .delete()
    .eq("briefing_date", today)
    .select();
  
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  console.log(`✅ Cleared ${data.length} fake articles. Starting fresh with real news...`);
}

clearAll();
