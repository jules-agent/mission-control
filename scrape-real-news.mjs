#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
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

// RSS feeds mapped to categories
const feeds = [
  // Tesla/EV
  { url: 'https://electrek.co/feed/', category: 'tesla_ev', source: 'Electrek' },
  { url: 'https://www.teslarati.com/feed/', category: 'tesla_ev', source: 'Teslarati' },
  
  // Crypto
  { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', category: 'crypto', source: 'CoinDesk' },
  { url: 'https://cointelegraph.com/rss', category: 'crypto', source: 'CoinTelegraph' },
  
  // Stocks/Finance
  { url: 'https://finance.yahoo.com/news/rssindex', category: 'stocks', source: 'Yahoo Finance' },
  
  // Tech/AI
  { url: 'https://techcrunch.com/feed/', category: 'tech', source: 'TechCrunch' },
  { url: 'https://www.theverge.com/rss/index.xml', category: 'tech', source: 'The Verge' },
  
  // LA Food
  { url: 'https://la.eater.com/rss/index.xml', category: 'la_food', source: 'Eater LA' },
  
  // Business/Fleet
  { url: 'https://www.reuters.com/rssFeed/businessNews', category: 'business', source: 'Reuters' }
];

async function fetchFeed(feedConfig) {
  try {
    console.log(`📰 Fetching ${feedConfig.source}...`);
    const feed = await parser.parseURL(feedConfig.url);
    
    const articles = feed.items.slice(0, 3).map(item => ({
      category: feedConfig.category,
      title: item.title?.substring(0, 150) || 'Untitled',
      summary: (item.contentSnippet || item.content || '').substring(0, 250) + '...',
      url: item.link,
      source: feedConfig.source,
      image_url: item.enclosure?.url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=225&fit=crop'
    }));
    
    console.log(`  ✅ Got ${articles.length} articles`);
    return articles;
    
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return [];
  }
}

// Fetch all feeds
const allArticles = [];

for (const feed of feeds) {
  const articles = await fetchFeed(feed);
  allArticles.push(...articles);
  
  // Rate limit
  await new Promise(resolve => setTimeout(resolve, 500));
}

console.log(`\n✅ Scraped ${allArticles.length} real articles`);

// Insert into database with TOMORROW's date (to avoid fake URL conflicts)
if (allArticles.length > 0) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const briefingDate = tomorrow.toISOString().split('T')[0];
  
  const records = allArticles.map(article => ({
    briefing_date: briefingDate,
    category: article.category,
    title: article.title,
    summary: article.summary,
    url: article.url,
    source: article.source,
    image_url: article.image_url
  }));
  
  const { data, error } = await supabase
    .from('news_briefings')
    .upsert(records, { 
      onConflict: 'briefing_date,url',
      ignoreDuplicates: false 
    });
  
  if (error) {
    console.error('❌ Database error:', error);
  } else {
    console.log(`✅ Inserted ${records.length} articles into database`);
    console.log('\n📊 By category:');
    
    const categoryCounts = {};
    records.forEach(r => {
      categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
    });
    
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count} articles`);
    });
  }
}

console.log('\n🎉 Real news scraping complete!');
console.log('🌐 View at: https://mission-control-mocha-omega.vercel.app/news');
