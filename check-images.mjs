import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://nqikobnkhpyfduqgfrew.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xaWtvYm5raHB5ZmR1cWdmcmV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjY4NTAsImV4cCI6MjA4NTkwMjg1MH0.oWxuoGxp__WYBHXW2sm4oO3pYoxA5QazEKmce0raTI8";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkImages() {
  const today = new Date().toISOString().split("T")[0];
  
  const { data, error } = await supabase
    .from("news_briefings")
    .select("id, title, image_url")
    .eq("briefing_date", today);
  
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  console.log(`Total articles: ${data.length}\n`);
  
  const placeholder = data.filter(a => a.image_url?.includes('placeholder'));
  const unsplash = data.filter(a => a.image_url?.includes('unsplash'));
  
  console.log(`Placeholder images: ${placeholder.length}`);
  console.log(`Unsplash images: ${unsplash.length}\n`);
  
  if (placeholder.length > 0) {
    console.log("Articles with placeholder images:");
    placeholder.forEach(a => console.log(`  - ${a.title}`));
  }
}

checkImages();
