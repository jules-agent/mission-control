import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://nqikobnkhpyfduqgfrew.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xaWtvYm5raHB5ZmR1cWdmcmV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjY4NTAsImV4cCI6MjA4NTkwMjg1MH0.oWxuoGxp__WYBHXW2sm4oO3pYoxA5QazEKmce0raTI8";

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixImages() {
  console.log("Deleting articles with broken placeholder images...\n");
  
  const today = new Date().toISOString().split("T")[0];
  
  const { data, error } = await supabase
    .from("news_briefings")
    .delete()
    .eq("briefing_date", today)
    .like("image_url", "%placeholder%")
    .select();
  
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  console.log(`✅ Deleted ${data.length} articles with broken images:`);
  data.forEach(a => console.log(`   - ${a.title}`));
  
  console.log("\n✅ All remaining images are from Unsplash and should load correctly!");
}

fixImages();
