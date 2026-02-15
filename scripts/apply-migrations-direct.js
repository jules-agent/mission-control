const { Client } = require('pg');
const fs = require('fs');

const connectionString = 'postgresql://postgres.nkszxblxadfghbepewsr:OU4jXyKO20Z90tV9@aws-0-us-west-1.pooler.supabase.com:6543/postgres';

async function executeMigration(client, sqlFile, name) {
  console.log(`\n=== ${name} ===`);
  const sql = fs.readFileSync(sqlFile, 'utf8');
  
  try {
    await client.query(sql);
    console.log(`✅ ${name} applied successfully`);
    return true;
  } catch (err) {
    // Check if it's a benign "already exists" error
    if (err.message.includes('already exists') || err.message.includes('duplicate')) {
      console.log(`⚠️  ${name} - some objects already exist (continuing)`);
      return true;
    }
    console.error(`❌ ${name} failed:`, err.message);
    throw err;
  }
}

async function main() {
  const client = new Client({ connectionString });
  
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected');
    
    // Apply migrations in order
    await executeMigration(client, './migrations/add-privacy-controls.sql', 'Privacy Controls Migration');
    await executeMigration(client, './scripts/consolidate-domains.sql', 'Domain Consolidation Migration');
    
    console.log('\n🎉 All migrations completed successfully!');
    
  } catch (err) {
    console.error('\n💥 Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
