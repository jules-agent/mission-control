import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://nqikobnkhpyfduqgfrew.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xaWtvYm5raHB5ZmR1cWdmcmV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDMyNjg1MCwiZXhwIjoyMDg1OTAyODUwfQ.2tuEjmqh6yU37IOqXVB56MLFqxjKuInqLQu9ml6C8o0';

const supabase = createClient(supabaseUrl, supabaseKey);

const sql = readFileSync('./supabase/migrations/20260213_master_identity_system.sql', 'utf8');

console.log('Applying Master Identity System schema via REST API...\n');

// Use Supabase Management API
const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
  method: 'POST',
  headers: {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ query: sql })
});

if (!response.ok) {
  console.error('Failed:', await response.text());
} else {
  console.log('✅ Schema applied successfully!');
}
