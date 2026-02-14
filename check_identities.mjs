import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nqikobnkhpyfduqgfrew.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xaWtvYm5raHB5ZmR1cWdmcmV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDMyNjg1MCwiZXhwIjoyMDg1OTAyODUwfQ.2tuEjmqh6yU37IOqXVB56MLFqxjKuInqLQu9ml6C8o0';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// Check all identities
const { data: identities, error } = await supabase
  .from('identities')
  .select('*')
  .order('created_at');

if (error) {
  console.error('Error:', error);
} else {
  console.log('Existing identities:');
  console.log(JSON.stringify(identities, null, 2));
}

// Check categories
const { data: categories } = await supabase
  .from('categories')
  .select('*');

console.log('\nExisting categories:');
console.log(JSON.stringify(categories, null, 2));

// Check influences count
const { data: influences, count } = await supabase
  .from('influences')
  .select('*', { count: 'exact' });

console.log(`\nTotal influences: ${count}`);
