const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://nkszxblxadfghbepewsr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rc3p4Ymx4YWRmZ2hiZXBld3NyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODk3NTkxOCwiZXhwIjoyMDU0NTUxOTE4fQ.y3P3-SW16ZKx0dE3vGHdCtWvNtYNwqBj7rVkfLNuMdg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('📦 Reading migration file...');
  const sql = fs.readFileSync('./migrations/add-privacy-controls.sql', 'utf8');
  
  console.log('🚀 Applying migration to database...');
  
  // Split by semicolon and execute each statement
  const statements = sql.split(';').filter(s => s.trim().length > 0);
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i].trim();
    if (stmt.startsWith('--') || stmt.length === 0) continue;
    
    console.log(`  [${i+1}/${statements.length}] Executing...`);
    const { error } = await supabase.rpc('exec_sql', { sql_query: stmt });
    
    if (error) {
      console.error(`❌ Error on statement ${i+1}:`, error.message);
      console.error('Statement:', stmt.substring(0, 200));
      // Continue anyway for some errors (like "column already exists")
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }
  }
  
  console.log('✅ Migration complete!');
}

applyMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
