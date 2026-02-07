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

console.log('💣 NUKE: Deleting ALL news articles...');

// Delete everything by selecting all and deleting
const { data: all } = await supabase.from('news_briefings').select('id');
console.log(`Found ${all?.length || 0} articles to delete`);

if (all && all.length > 0) {
  const ids = all.map(a => a.id);
  const { error } = await supabase.from('news_briefings').delete().in('id', ids);
  
  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('✅ ALL articles nuked!');
  }
}
