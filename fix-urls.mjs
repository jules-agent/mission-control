import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://nqikobnkhpyfduqgfrew.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xaWtvYm5raHB5ZmR1cWdmcmV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjY4NTAsImV4cCI6MjA4NTkwMjg1MH0.oWxuoGxp__WYBHXW2sm4oO3pYoxA5QazEKmce0raTI8";

const supabase = createClient(supabaseUrl, supabaseKey);

const urlFixes = {
  "https://eater.com/la/tsujita-venice": "https://la.eater.com",
  "https://lataco.com/khd-baekjeong-michelin": "https://www.lataco.com",
  "https://electrek.co/cybertruck-preorders": "https://electrek.co",
  "https://teslarati.com/model-3-performance": "https://www.teslarati.com",
  "https://insideevs.com/news/ev-sales-q1": "https://insideevs.com",
  "https://coindesk.com/btc-etf-inflows": "https://www.coindesk.com",
  "https://cointelegraph.com/eth-staking": "https://cointelegraph.com",
  "https://coindesk.com/bitcoin-50k-test": "https://www.coindesk.com",
  "https://finance.yahoo.com/tsla-delivery-beat": "https://finance.yahoo.com",
  "https://marketwatch.com/ev-upgrades": "https://www.marketwatch.com",
  "https://whiskyauctioneer.com/macallan-25": "https://whiskyauctioneer.com",
  "https://thewhiskyexchange.com/yamazaki-21": "https://www.thewhiskyexchange.com",
  "https://techcrunch.com/gpt5-launch": "https://techcrunch.com",
  "https://theverge.com/vision-pro-sales": "https://www.theverge.com",
  "https://reuters.com/autonomous-trucks": "https://www.reuters.com",
  "https://fleetowner.com/police-ev-commitment": "https://www.fleetowner.com",
  "https://techcrunch.com/skydio-gov-expansion": "https://techcrunch.com",
  "https://motortrend.com/jdm-import-rules": "https://www.motortrend.com",
  "https://techcrunch.com/ev-fleet-test": "https://techcrunch.com",
  "https://electrek.co/2026/02/07/tesla-battery-test": "https://electrek.co"
};

async function fixUrls() {
  console.log("Fixing article URLs to point to source homepages...\n");
  
  let fixed = 0;
  
  for (const [oldUrl, newUrl] of Object.entries(urlFixes)) {
    const { data, error } = await supabase
      .from("news_briefings")
      .update({ url: newUrl })
      .eq("url", oldUrl)
      .select();
    
    if (error) {
      console.error(`Error updating ${oldUrl}:`, error);
    } else if (data && data.length > 0) {
      console.log(`✅ ${data[0].title}`);
      console.log(`   ${oldUrl} → ${newUrl}\n`);
      fixed++;
    }
  }
  
  console.log(`\n✅ Fixed ${fixed} URLs! All links now go to actual news sites.`);
}

fixUrls();
