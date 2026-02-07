#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
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

console.log('🧹 Cleaning fake URLs...\n');

// Fetch all articles
const { data: articles, error } = await supabase
  .from('news_briefings')
  .select('*')
  .eq('briefing_date', new Date().toISOString().split('T')[0]);

if (error) {
  console.error('❌ Error fetching articles:', error);
  process.exit(1);
}

console.log(`📊 Found ${articles.length} total articles`);

// Identify fake URLs (ones without date paths like /2026/02/07/)
const fakeArticles = articles.filter(article => {
  const url = article.url;
  // Real article URLs have date paths like /2026/02/07/ or /news/2026/
  const hasDatePath = /\/\d{4}\/\d{2}\/\d{2}\//.test(url) || 
                      /\/news\/\d{4}\//.test(url) ||
                      /\/article\//.test(url) ||
                      /\/story\//.test(url);
  return !hasDatePath;
});

console.log(`🗑️  Found ${fakeArticles.length} articles with fake URLs`);

if (fakeArticles.length > 0) {
  const idsToDelete = fakeArticles.map(a => a.id);
  
  const { error: deleteError } = await supabase
    .from('news_briefings')
    .delete()
    .in('id', idsToDelete);
  
  if (deleteError) {
    console.error('❌ Error deleting:', deleteError);
  } else {
    console.log(`✅ Deleted ${fakeArticles.length} fake articles`);
  }
}

// Show remaining real articles
const { data: remaining } = await supabase
  .from('news_briefings')
  .select('category')
  .eq('briefing_date', new Date().toISOString().split('T')[0]);

const categoryCounts = {};
remaining.forEach(a => {
  categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1;
});

console.log('\n📊 Remaining real articles by category:');
Object.entries(categoryCounts).forEach(([cat, count]) => {
  console.log(`  ${cat}: ${count}`);
});

console.log('\n✅ Cleanup complete!');
