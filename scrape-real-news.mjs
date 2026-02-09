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

// Ben's portfolio tickers (from memory/portfolio.md) — filter stocks category to these only
const PORTFOLIO_TICKERS = [
  // AI & Tech
  'NVDA', 'MSFT', 'GOOG', 'AAPL', 'AMZN', 'TSM', 'SMCI', 'PLTR', 'ARKK', 'AIPO', 'RONB', 'VUG',
  // Crypto & Blockchain
  'BTC', 'ETH', 'IBIT', 'ETHA', 'MSTR', 'MTPLF', 'CIFR', 'MARA', 'IREN',
  // EV & Future Tech
  'TSLA', 'RIVN', 'LCID',
  // Space
  'ASTS', 'RKLB',
  // Scarce Materials
  'TLOFF', 'TMC', 'IAU', 'SLV', 'STLD', 'NLR',
  // High Dividend
  'SCHD', 'DVY', 'JEPI', 'QYLD', 'NUSI', 'PTY', 'JNK', 'PGF', 'PGX', 'QQQX', 'BIZD', 'ARCC', 'MPW', 'BXSL',
  // Real Estate
  'IYR', 'VNQ', 'VNQI', 'VICI', 'IIPR',
  // Market ETFs
  'SPY', 'VTSAX', 'VWO', 'SGOV', 'LQD',
  // Other
  'DIS', 'NFLX', 'BABA', 'ABBV', 'GME', 'RKT', 'IBB', 'ASG', 'ETW', 'ETG', 'PSP', 'UTF', 'NMZ', 'HIX', 'THQ', 'STRC', 'HOOW'
];

// Macro market keywords (always relevant even if ticker not in portfolio)
const MACRO_KEYWORDS = ['fed', 'federal reserve', 'interest rate', 'inflation', 'cpi', 'ppi', 'jobs report', 'unemployment', 'gdp', 'recession', 'bull market', 'bear market', 'sp 500', 's&p 500', 'dow jones', 'nasdaq', 'treasury', 'bond yield', 'market crash', 'market rally'];

// Relevancy engine — matches Ben's interests without AI tokens
function getRelevancy(title, snippet, category) {
  const t = (title + ' ' + snippet).toLowerCase();
  
  // GLOBAL FILTERS: Skip unwanted content across all categories
  if (/\be[-\s]?bike|e[-\s]?scooter|electric\s+bike|electric\s+scooter/i.test(t)) {
    return null; // No e-bikes
  }
  if (/\bgaming|gamer|playstation|ps5|xbox|nintendo|switch\s+2|video\s+game/i.test(t)) {
    return null; // No gaming content
  }
  if (category === 'la_food' && /\bpizza\s+hut|mcdonald|burger\s+king|taco\s+bell|wendy|kfc|subway|chipotle/i.test(t)) {
    return null; // No mainstream chains
  }
  
  // FILTER: For stocks category, only allow portfolio tickers or macro news
  if (category === 'stocks') {
    const hasMacro = MACRO_KEYWORDS.some(kw => t.includes(kw));
    const hasPortfolioTicker = PORTFOLIO_TICKERS.some(ticker => {
      const regex = new RegExp(`\\b${ticker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(t);
    });
    
    if (!hasMacro && !hasPortfolioTicker) {
      return null; // Skip this article — not relevant
    }
  }
  
  const parts = [];
  
  // Add the actual article snippet first (trimmed)
  const cleanSnippet = snippet.replace(/\s+/g, ' ').trim().substring(0, 200);
  if (cleanSnippet) parts.push(cleanSnippet);
  
  // Then add personalized relevancy note
  const tags = [];
  
  // Tesla / Unplugged Performance relevancy (avoid using "UP" in tags to prevent false positives)
  if (/tesla|cybertruck|model [s3xy]|supercharger/i.test(t)) tags.push('🎯 Direct opportunity — aftermarket parts & service');
  if (/fsd|autopilot|self.?driv/i.test(t)) tags.push('🎯 FSD progress affects customer base');
  if (/battery|range|charging/i.test(t)) tags.push('⚡ Battery/range tech — affects performance builds');
  if (/delivery|production|factory/i.test(t)) tags.push('📊 Production volume = more customers');
  
  // EV competition
  if (/rivian|lucid|polestar|byd|nio/i.test(t)) tags.push('👀 Competitor watch — EV market dynamics');
  if (/ev.*(fleet|commercial|police|government)/i.test(t)) tags.push('🚨 Fleet opportunity — fleet/gov EV adoption');
  
  // Crypto relevancy
  if (/bitcoin|btc/i.test(t)) tags.push('₿ Portfolio watch — BTC position');
  if (/ethereum|eth\b/i.test(t)) tags.push('📊 ETH position impact');
  if (/etf|institutional/i.test(t)) tags.push('🏦 Institutional flow — market maturity signal');
  if (/regulation|sec\b|fed\b/i.test(t)) tags.push('⚖️ Regulatory impact on holdings');
  
  // Stock market
  if (/tsla/i.test(t)) tags.push('🎯 Direct TSLA holding impact');
  if (/earnings|revenue|profit/i.test(t)) tags.push('📊 Earnings signal — check positions');
  if (/rate.?cut|interest.?rate|fed/i.test(t)) tags.push('🏦 Rate move — affects growth stocks & real estate');
  if (/crash|selloff|correction|bear/i.test(t)) tags.push('⚠️ Risk alert — review exposure');
  if (/rally|surge|bull|record/i.test(t)) tags.push('📈 Momentum signal — opportunity window');
  
  // Tech/AI (avoid using company names in tags to prevent false positives)
  if (/ai\b|artificial.?intel|llm|gpt|claude|openai/i.test(t)) tags.push('🤖 AI advancement — automation opportunity');
  if (/drone|uav/i.test(t)) tags.push('🚨 Drone tech — Skydio/partnership relevance');
  if (/autonom|self.?driv/i.test(t)) tags.push('🎯 Fleet automation angle');
  if (/apple|google|meta|amazon/i.test(t)) tags.push('📊 Big Tech signal — portfolio/market indicator');
  
  // Whisky
  if (/yamazaki|hibiki|hakushu|nikka|suntory/i.test(t)) tags.push('🎯 Japanese whisky — check investment potential');
  if (/macallan|dalmore|springbank/i.test(t)) tags.push('💰 Premium Scotch — flip potential');
  if (/auction|rare|limited|allocat/i.test(t)) tags.push('🔥 Scarcity play — act fast if under $1,200');
  if (/cask.?strength|single.?cask|independent.?bottl/i.test(t)) tags.push('💎 IB/cask strength — your sweet spot');
  
  // LA Food
  if (/korean|bbq|kbbq/i.test(t)) tags.push('🔥 Your favorite — Korean BBQ alert');
  if (/japanese|ramen|sushi|omakase/i.test(t)) tags.push('🍣 Japanese food — right up your alley');
  if (/venice|santa.?monica|mar.?vista|culver/i.test(t)) tags.push('📍 Near home — worth checking out');
  if (/hawthorne|inglewood|lax/i.test(t)) tags.push('📍 Near work — lunch spot potential');
  if (/keto|low.?carb|meat|steak|lamb|brisket/i.test(t)) tags.push('✅ Keto-friendly option');
  if (/open|new|debut/i.test(t)) tags.push('🆕 New opening — try before it gets packed');
  
  // Business/Fleet (avoid using company names in tags to prevent false positives)
  if (/police|law.?enforce|public.?safety/i.test(t)) tags.push('🚨 Target customer — gov/police fleet');
  if (/fleet|commercial.?vehicle/i.test(t)) tags.push('🎯 Fleet market intel');
  if (/jdm|import|nsx|supra|gtr|r3[245]/i.test(t)) tags.push('🏎️ JDM market opportunity');
  if (/koenigsegg/i.test(t)) tags.push('🤝 Manufacturing partner mention');
  
  // Elon / SpaceX
  if (/elon|musk|spacex/i.test(t)) tags.push('🚀 Elon/SpaceX — ecosystem signal');
  
  // Default if no specific tags matched (avoid company names in tags)
  if (tags.length === 0) {
    const catDefaults = {
      tesla_ev: '⚡ EV market intel — monitor for impact',
      stocks: '📈 Market signal — check portfolio exposure',
      tech: '🤖 Tech trend — potential business application',
      la_food: '🍽️ LA dining scene — potential spot to try',
      whisky: '🥃 Whisky market — investment/collecting intel',
      business: '💡 Business/auto industry intel'
    };
    tags.push(catDefaults[category] || '📰 General news');
  }
  
  // Combine snippet + relevancy tags
  return parts.join(' ') + (tags.length > 0 ? ' — ' + tags.join(' | ') : '');
}

console.log('🔍 Scraping REAL news from RSS feeds...\n');

// RSS feeds mapped to categories — expanded for density
const feeds = [
  // Tesla/EV (3 sources)
  { url: 'https://electrek.co/feed/', category: 'tesla_ev', source: 'Electrek', max: 6 },
  { url: 'https://www.teslarati.com/feed/', category: 'tesla_ev', source: 'Teslarati', max: 4 },
  { url: 'https://insideevs.com/rss/news/all/', category: 'tesla_ev', source: 'InsideEVs', max: 4 },

  // Crypto (3 sources) — grouped as 'stocks' since it's investment content
  { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', category: 'stocks', source: 'CoinDesk', max: 2 },
  { url: 'https://cointelegraph.com/rss', category: 'stocks', source: 'CoinTelegraph', max: 2 },
  { url: 'https://decrypt.co/feed', category: 'stocks', source: 'Decrypt', max: 2 },

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

  // Whisky — use r/Scotch and r/whiskey RSS
  { url: 'https://old.reddit.com/r/Scotch/.rss', category: 'whisky', source: 'r/Scotch', max: 5 },
  { url: 'https://old.reddit.com/r/whiskey/.rss', category: 'whisky', source: 'r/whiskey', max: 5 },

  // Business/Automotive (2 sources)
  { url: 'https://jalopnik.com/rss', category: 'business', source: 'Jalopnik', max: 5 },
  { url: 'https://www.thedrive.com/feed', category: 'business', source: 'The Drive', max: 5 },
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

    const articles = feed.items.slice(0, feedConfig.max).map(item => {
      const title = (item.title || 'Untitled').substring(0, 150);
      const snippet = (item.contentSnippet || item.content || '').replace(/<[^>]+>/g, '').substring(0, 300);
      const relevancy = getRelevancy(title, snippet, feedConfig.category);
      
      // Skip articles that didn't pass relevancy filter (returns null)
      if (relevancy === null) return null;
      
      return {
        category: feedConfig.category,
        title,
        summary: relevancy,
        url: item.link,
        source: feedConfig.source,
        image_url: null // skip thumbnails — text only
      };
    }).filter(a => a !== null); // Remove nulls

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
    .upsert(records, { onConflict: 'briefing_date,url', ignoreDuplicates: false });

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
