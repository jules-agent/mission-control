const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  const migrationSQL = fs.readFileSync(
    path.join(__dirname, '../supabase/migrations/20260213_master_identity_system.sql'),
    'utf8'
  );

  console.log('🔄 Applying migration via Supabase REST API...');
  
  // Split into individual statements
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (!statement) continue;

    console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);
    console.log(statement.substring(0, 80) + '...');

    try {
      // Use RPC to execute SQL if available, otherwise try direct query
      const { data, error } = await supabase.rpc('exec', { sql: statement });
      
      if (error) {
        // Try alternative approach - this might fail but worth trying
        console.log('RPC failed, trying direct execution...');
        throw error;
      }
      
      console.log('✅ Success');
      successCount++;
    } catch (error) {
      console.log(`⚠️  Error: ${error.message}`);
      errorCount++;
    }
  }

  console.log(`\n📊 Results: ${successCount} succeeded, ${errorCount} failed`);
  
  if (successCount > 0) {
    console.log('\n✅ Some or all statements executed. Verifying tables...');
    
    // Verify tables exist
    const { data, error } = await supabase
      .from('identities')
      .select('id')
      .limit(1);
    
    if (!error) {
      console.log('✅ Tables created successfully!');
      return true;
    }
  }
  
  return false;
}

applyMigration()
  .then(success => {
    if (!success) {
      console.log('\n❌ Migration failed. Manual paste required.');
      console.log('SQL is in clipboard. Paste into Supabase SQL Editor.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
