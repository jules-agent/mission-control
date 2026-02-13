import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nqikobnkhpyfduqgfrew.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xaWtvYm5raHB5ZmR1cWdmcmV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDMyNjg1MCwiZXhwIjoyMDg1OTAyODUwfQ.2tuEjmqh6yU37IOqXVB56MLFqxjKuInqLQu9ml6C8o0';

const supabase = createClient(supabaseUrl, supabaseKey);

const migrationSQL = readFileSync('./supabase/migrations/20260213_master_identity_system.sql', 'utf8');

console.log('📊 Applying Master Identity System migration...\n');

// Execute migration
const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

if (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}

console.log('✅ Migration applied successfully!');
console.log('\nTables created:');
console.log('- identities');
console.log('- categories');
console.log('- influences');
console.log('- recommendations');
console.log('- play_history');
console.log('- patterns');
console.log('- auto_switch_rules');
