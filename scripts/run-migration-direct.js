const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const connectionString = `postgresql://postgres:vK88OfddlsaH62vm@db.nqikobnkhpyfduqgfrew.supabase.co:5432/postgres`;

console.log('Attempting to connect to Supabase database...');

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../supabase/migrations/20260213_master_identity_system.sql'),
      'utf8'
    );
    
    console.log('📝 Executing migration...');
    await client.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify tables exist
    const { rows } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('identities', 'categories', 'influences', 'recommendations', 'play_history', 'patterns', 'auto_switch_rules')
      ORDER BY table_name
    `);
    
    console.log('\n📊 Created tables:');
    rows.forEach(row => console.log(`  - ${row.table_name}`));
    
    await client.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    await client.end();
    process.exit(1);
  }
}

runMigration();
