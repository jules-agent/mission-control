#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  }
});

console.log('🔍 Scraping REAL news from RSS feeds...\n');

// RSS feeds mapped to categories — expanded for density
const feeds = [
  // Tesla/EV (3 sources)
  { url: 'https://electrek.co/feed/', category: 'tesla_ev', source: 'Electrek', max: 6 },
  { url: 'https://www.teslarati.com/feed/', category: 'tesla_ev', source: 'Teslarati', max: 4 },
  { url: 'https://insideevs.com/rss/news/all/', category: 'tesla_ev', source: 'InsideEVs', max: 4 },

  // Crypto (3 sources)
  { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', category: 'crypto', source: 'CoinDesk', max: 5 },
  { url: 'https://cointelegraph.com/rss', category: 'crypto', source: 'CoinTelegraph', max: 5 },
  { url: 'https://decrypt.co/feed', category: 'crypto', source: 'Decrypt', max: 4 },

  // Stocks/Finance (2 sources)
  { url: 'https://finance.yahoo.com/news/rssindex', category: 'stocks', source: 'Yahoo Finance', max: 5 },
  { url: 'https://www.marketwatch.com/rss/topstories', category: 'stocks', source: 'MarketWatch', max: 5 },

  // Tech/AI (3 sources)
  { url: 'https://techcrunch.com/feed/', category: 'tech', source: 'TechCrunch', max: 5 },
  { url: 'https://www.theverge.com/rss/index.xml', category: 'tech', source: 'The Verge', max: 4 },
  { url: 'https://arstechnica.com/feed/', category: 'tech', source: 'Ars Technica', max: 4 },

  // LA Food (2 sources)
  { url: 'https://la.eater.com/rss/index.xml', category: 'la_food', source: 'Eater LA', max: 5 },
  { url: 'https://www.latimes.com/food/rss2.0.xml', category: 'la_food', source: 'LA Times Food', max: 3 },

  // Whisky (2 sources)
  { url: 'https://www.whiskyadvocate.com/feed/', category: 'whisky', source: 'Whisky Advocate', max: 4 },
  { url: 'https://scotchwhisky.com/feed/', category: 'whisky', source: 'Scotch Whisky', max: 3 },

  // Business/Fleet (2 sources)
  { url: 'https://www.fleetowner.com/rss', category: 'business', source: 'Fleet Owner', max: 4 },
  { url: 'https://jalopnik.com/rss', category: 'business', source: 'Jalopnik', max: 4 },
];

async function fetchFeed(feedConfig) {
  try {
    console.log(`📰 ${feedConfig.source}...`);
    const feed = await parser.parseURL(feedConfig.url);

    // Extract image from content if enclosure is missing
    function extractImage(item) {
      if (item.enclosure?.url) return item.enclosure.url;
      // Try media:content or media:thumbnail
      if (item['media:content']?.['$']?.url) return item['media:content']['$'].url;
      if (item['media:thumbnail']?.['$']?.url) return item['media:thumbnail']['$'].url;
      // Try og:image from content
      const imgMatch = (item.content || '').match(/src="(https?:\/\/[^"]+)"/);
      if (imgMatch) return imgMatch[1];
      return null;
    }

    const articles = feed.items.slice(0, feedConfig.max).map(item => ({
      category: feedConfig.category,
      title: (item.title || 'Untitled').substring(0, 150),
      summary: (item.contentSnippet || item.content || '').replace(/<[^>]+>/g, '').substring(0, 200),
      url: item.link,
      source: feedConfig.source,
      image_url: extractImage(item)
    }));

    console.log(`  ✅ ${articles.length} articles`);
    return articles;
  } catch (error) {
    console.log(`  ❌ ${error.message}`);
    return [];
  }
}

// Fetch all feeds in parallel (batches of 4)
const allArticles = [];
for (let i = 0; i < feeds.length; i += 4) {
  const batch = feeds.slice(i, i + 4);
  const results = await Promise.all(batch.map(f => fetchFeed(f)));
  results.forEach(r => allArticles.push(...r));
  if (i + 4 < feeds.length) await new Promise(r => setTimeout(r, 300));
}

console.log(`\n✅ Scraped ${allArticles.length} real articles`);

if (allArticles.length > 0) {
  const briefingDate = new Date().toISOString().split('T')[0];

  const records = allArticles.map(a => ({
    briefing_date: briefingDate,
    category: a.category,
    title: a.title,
    summary: a.summary,
    url: a.url,
    source: a.source,
    image_url: a.image_url
  }));

  const { data, error } = await supabase
    .from('news_briefings')
    .upsert(records, { onConflict: 'briefing_date,url', ignoreDuplicates: true });

  if (error) {
    console.error('❌ DB error:', error);
  } else {
    const cats = {};
    records.forEach(r => { cats[r.category] = (cats[r.category] || 0) + 1; });
    console.log(`✅ Upserted ${records.length} articles`);
    Object.entries(cats).forEach(([c, n]) => console.log(`  ${c}: ${n}`));
  }
}

console.log('\n🎉 Done → https://mission-control-mocha-omega.vercel.app/news');
