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
console.log(`🗑️  Deleting ALL articles from ${today}...`);

const { data, error } = await supabase
  .from('news_briefings')
  .delete()
  .eq('briefing_date', today);

if (error) {
  console.error('❌ Error:', error);
} else {
  console.log('✅ All articles deleted. Ready for fresh scrape.');
}
