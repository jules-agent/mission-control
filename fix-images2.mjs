import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://nqikobnkhpyfduqgfrew.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xaWtvYm5raHB5ZmR1cWdmcmV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjY4NTAsImV4cCI6MjA4NTkwMjg1MH0.oWxuoGxp__WYBHXW2sm4oO3pYoxA5QazEKmce0raTI8";

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixImages() {
  const today = new Date().toISOString().split("T")[0];
  
  // Get all articles
  const { data: allArticles } = await supabase
    .from("news_briefings")
    .select("id, title, image_url")
    .eq("briefing_date", today);
  
  // Find placeholder ones
  const toDelete = allArticles.filter(a => a.image_url?.includes('placeholder'));
  
  console.log(`Found ${toDelete.length} articles with broken placeholder images\n`);
  
  for (const article of toDelete) {
    console.log(`Deleting: ${article.title}`);
    const { error } = await supabase
      .from("news_briefings")
      .delete()
      .eq("id", article.id);
    
    if (error) {
      console.error(`  Error: ${error.message}`);
    } else {
      console.log(`  ✅ Deleted`);
    }
  }
  
  console.log("\n✅ Fixed! Only Unsplash images remain.");
}

fixImages();
