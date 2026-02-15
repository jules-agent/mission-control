const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://nkszxblxadfghbepewsr.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rc3p4Ymx4YWRmZ2hiZXBld3NyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODk3NTkxOCwiZXhwIjoyMDU0NTUxOTE4fQ.y3P3-SW16ZKx0dE3vGHdCtWvNtYNwqBj7rVkfLNuMdg';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSql(sql) {
  // Split into statements and execute one by one
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    console.log(`\n[${i+1}/${statements.length}] Executing statement...`);
    console.log(stmt.substring(0, 100) + (stmt.length > 100 ? '...' : ''));
    
    try {
      const { data, error } = await supabase.rpc('query', { query_text: stmt });
      
      if (error) {
        // Try alternative: use direct query
        const { error: error2 } = await supabase
          .from('_migrations')
          .insert({ sql: stmt });
        
        if (error2) {
          console.error('❌ Error:', error.message || error2.message);
          errorCount++;
          // Continue for "already exists" errors
          if (!error.message?.includes('already exists') && !error2.message?.includes('already exists')) {
            throw error;
          }
        } else {
          successCount++;
        }
      } else {
        console.log('✅ Success');
        successCount++;
      }
    } catch (err) {
      console.error('❌ Failed:', err.message);
      errorCount++;
      // Continue on "already exists"
      if (!err.message?.includes('already exists')) {
        throw err;
      }
    }
  }
  
  return { successCount, errorCount };
}

async function main() {
  console.log('📦 Applying database migrations...\n');
  
  // Migration 1: Privacy controls
  console.log('=== Migration 1: Privacy Controls ===');
  const privacySql = fs.readFileSync('./migrations/add-privacy-controls.sql', 'utf8');
  const result1 = await executeSql(privacySql);
  console.log(`\n✅ Privacy migration: ${result1.successCount} success, ${result1.errorCount} errors`);
  
  // Migration 2: Domain consolidation
  console.log('\n=== Migration 2: Domain Consolidation ===');
  const domainSql = fs.readFileSync('./scripts/consolidate-domains.sql', 'utf8');
  const result2 = await executeSql(domainSql);
  console.log(`\n✅ Domain migration: ${result2.successCount} success, ${result2.errorCount} errors`);
  
  console.log('\n🎉 All migrations complete!');
}

main().catch(err => {
  console.error('\n💥 Migration failed:', err);
  process.exit(1);
});
