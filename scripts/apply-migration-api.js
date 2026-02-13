const fs = require('fs');
const path = require('path');

async function applyMigration() {
  require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const migrationPath = path.join(__dirname, '../supabase/migrations/20260213_master_identity_system.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('🔄 Applying Master Identity System migration via Supabase API...');
  
  // Use Supabase's PostgREST API to execute raw SQL
  // Note: This requires the rpc endpoint
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`
    },
    body: JSON.stringify({
      query: migrationSQL
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Migration failed:', error);
    
    // Try alternative: use pg_dump/psql approach
    console.log('\n⚠️  API method failed. Using direct psql approach...');
    console.log('Getting connection info from Supabase...');
    
    // Get project ref from URL
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)[1];
    console.log(`Project ref: ${projectRef}`);
    console.log(`\nTo apply manually:\n1. Go to https://supabase.com/dashboard/project/${projectRef}/settings/database`);
    console.log('2. Copy the connection string');
    console.log('3. Run: psql "<connection-string>" < supabase/migrations/20260213_master_identity_system.sql');
    process.exit(1);
  }
  
  const result = await response.json();
  console.log('✅ Migration applied successfully!');
  console.log(result);
}

applyMigration().catch(console.error);
