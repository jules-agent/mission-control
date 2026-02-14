import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nqikobnkhpyfduqgfrew.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xaWtvYm5raHB5ZmR1cWdmcmV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDMyNjg1MCwiZXhwIjoyMDg1OTAyODUwfQ.2tuEjmqh6yU37IOqXVB56MLFqxjKuInqLQu9ml6C8o0';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

const OBAMA_IDENTITY_ID = '3637529f-c495-4089-8744-9fee54bf1f05';
const MUSK_IDENTITY_ID = 'cbc01c0f-6766-4063-9171-bf27b1746ee0';

async function verifyProfile(identityId, name) {
  console.log(`\n📊 ${name} PROFILE:`);
  console.log('==================\n');

  // Get categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('identity_id', identityId);

  console.log(`Categories: ${categories.length}`);

  // Get influences
  const categoryIds = categories.map(c => c.id);
  const { data: influences, count } = await supabase
    .from('influences')
    .select('*', { count: 'exact' })
    .in('category_id', categoryIds);

  console.log(`Influences: ${count}`);

  // Break down by category
  console.log('\nBreakdown by category:');
  for (const cat of categories) {
    const catInfluences = influences.filter(i => i.category_id === cat.id);
    if (catInfluences.length > 0) {
      console.log(`  ${cat.name}: ${catInfluences.length} influences`);
    }
  }
}

async function main() {
  await verifyProfile(OBAMA_IDENTITY_ID, 'BARACK OBAMA');
  await verifyProfile(MUSK_IDENTITY_ID, 'ELON MUSK');
  
  console.log('\n✅ Verification complete!\n');
}

main().catch(console.error);
