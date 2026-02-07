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

console.log('🔄 Moving old articles to archive date...\n');

// Move all today's articles to an archive date
const today = new Date().toISOString().split('T')[0];
const archiveDate = '2026-01-01'; // Archive date

const { data: existing, error: fetchError } = await supabase
  .from('news_briefings')
  .select('id')
  .eq('briefing_date', today);

if (fetchError) {
  console.error('❌ Fetch error:', fetchError);
  process.exit(1);
}

console.log(`Found ${existing?.length || 0} articles to archive`);

if (existing && existing.length > 0) {
  const ids = existing.map(a => a.id);
  
  const { error: updateError } = await supabase
    .from('news_briefings')
    .update({ briefing_date: archiveDate })
    .in('id', ids);
  
  if (updateError) {
    console.error('❌ Update error:', updateError);
    process.exit(1);
  }
  
  console.log(`✅ Moved ${existing.length} articles to archive (${archiveDate})`);
  console.log('✅ Today is now clear for fresh real news!\n');
}
