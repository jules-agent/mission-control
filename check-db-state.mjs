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

const today = new Date().toISOString().split('T')[0];

console.log(`📊 Database state check for ${today}\n`);

// Check today's articles
const { data: todayArticles } = await supabase
  .from('news_briefings')
  .select('id, title, url, briefing_date')
  .eq('briefing_date', today);

console.log(`Today (${today}): ${todayArticles?.length || 0} articles`);
if (todayArticles && todayArticles.length > 0) {
  console.log('Sample URLs:');
  todayArticles.slice(0, 3).forEach(a => console.log(`  - ${a.url}`));
}

// Check archive
const { data: archiveArticles } = await supabase
  .from('news_briefings')
  .select('id, briefing_date')
  .eq('briefing_date', '2026-01-01');

console.log(`\nArchive (2026-01-01): ${archiveArticles?.length || 0} articles`);

// Check all dates
const { data: allDates } = await supabase
  .from('news_briefings')
  .select('briefing_date')
  .order('briefing_date', { ascending: false });

const dateCounts = {};
allDates?.forEach(a => {
  dateCounts[a.briefing_date] = (dateCounts[a.briefing_date] || 0) + 1;
});

console.log('\nAll dates in DB:');
Object.entries(dateCounts).forEach(([date, count]) => {
  console.log(`  ${date}: ${count} articles`);
});
