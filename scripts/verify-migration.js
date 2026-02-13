const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyMigration() {
  console.log('🔍 Checking if Master Identity System tables exist...\n');
  
  const tables = [
    'identities',
    'categories',
    'influences',
    'recommendations',
    'play_history',
    'patterns',
    'auto_switch_rules'
  ];
  
  const results = {};
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      if (error) {
        if (error.message.includes('does not exist') || error.code === '42P01') {
          results[table] = '❌ NOT FOUND';
        } else {
          results[table] = `⚠️  ERROR: ${error.message}`;
        }
      } else {
        results[table] = '✅ EXISTS';
      }
    } catch (err) {
      results[table] = `⚠️  ERROR: ${err.message}`;
    }
  }
  
  console.log('Table Status:');
  console.log('─'.repeat(50));
  for (const [table, status] of Object.entries(results)) {
    console.log(`${table.padEnd(20)} ${status}`);
  }
  console.log('─'.repeat(50));
  
  const allExist = Object.values(results).every(v => v === '✅ EXISTS');
  
  if (allExist) {
    console.log('\n✅ All tables exist! Migration was successful.\n');
    return true;
  } else {
    console.log('\n❌ Some tables are missing. Please apply the migration manually:');
    console.log('   1. The migration SQL is in your clipboard');
    console.log('   2. Go to: https://supabase.com/dashboard/project/nqikobnkhpyfduqgfrew/sql/new');
    console.log('   3. Paste the SQL and click RUN\n');
    return false;
  }
}

verifyMigration().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
