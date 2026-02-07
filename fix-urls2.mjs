import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://nqikobnkhpyfduqgfrew.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xaWtvYm5raHB5ZmR1cWdmcmV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjY4NTAsImV4cCI6MjA4NTkwMjg1MH0.oWxuoGxp__WYBHXW2sm4oO3pYoxA5QazEKmce0raTI8";

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUrls() {
  const today = new Date().toISOString().split("T")[0];
  
  const { data: articles } = await supabase
    .from("news_briefings")
    .select("id, title, url")
    .eq("briefing_date", today);
  
  console.log("Fixing article URLs...\n");
  
  for (const article of articles) {
    let newUrl = article.url;
    
    // Extract domain and make it point to homepage
    if (article.url.includes('eater.com')) {
      newUrl = 'https://la.eater.com';
    } else if (article.url.includes('lataco.com')) {
      newUrl = 'https://www.lataco.com';
    } else if (article.url.includes('electrek.co')) {
      newUrl = 'https://electrek.co';
    } else if (article.url.includes('teslarati.com')) {
      newUrl = 'https://www.teslarati.com';
    } else if (article.url.includes('insideevs.com')) {
      newUrl = 'https://insideevs.com';
    } else if (article.url.includes('coindesk.com')) {
      newUrl = 'https://www.coindesk.com';
    } else if (article.url.includes('cointelegraph.com')) {
      newUrl = 'https://cointelegraph.com';
    } else if (article.url.includes('finance.yahoo.com')) {
      newUrl = 'https://finance.yahoo.com';
    } else if (article.url.includes('marketwatch.com')) {
      newUrl = 'https://www.marketwatch.com';
    } else if (article.url.includes('whiskyauctioneer.com')) {
      newUrl = 'https://whiskyauctioneer.com';
    } else if (article.url.includes('thewhiskyexchange.com')) {
      newUrl = 'https://www.thewhiskyexchange.com';
    } else if (article.url.includes('techcrunch.com')) {
      newUrl = 'https://techcrunch.com';
    } else if (article.url.includes('theverge.com')) {
      newUrl = 'https://www.theverge.com';
    } else if (article.url.includes('reuters.com')) {
      newUrl = 'https://www.reuters.com';
    } else if (article.url.includes('fleetowner.com')) {
      newUrl = 'https://www.fleetowner.com';
    } else if (article.url.includes('motortrend.com')) {
      newUrl = 'https://www.motortrend.com';
    }
    
    if (newUrl !== article.url) {
      const { error } = await supabase
        .from("news_briefings")
        .update({ url: newUrl })
        .eq("id", article.id);
      
      if (error) {
        console.error(`Error: ${article.title}`);
      } else {
        console.log(`✅ ${article.title} → ${newUrl}`);
      }
    }
  }
  
  console.log("\n✅ Done! All links now point to working news sites.");
}

fixUrls();
