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

console.log('📰 Real news from 2026-02-08:\n');

const { data } = await supabase
  .from('news_briefings')
  .select('category, title, url, source')
  .eq('briefing_date', '2026-02-08')
  .limit(10);

data?.forEach(article => {
  console.log(`[${article.category}] ${article.title}`);
  console.log(`  ${article.url}`);
  console.log(`  Source: ${article.source}\n`);
});
