#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
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

const sql = readFileSync(join(__dirname, 'fix-rls-delete.sql'), 'utf8');

console.log('📝 Applying DELETE policy...');
console.log(sql);

const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

if (error) {
  console.error('❌ Error:', error);
} else {
  console.log('✅ DELETE policy added!');
}
