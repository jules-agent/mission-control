const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applySchema() {
  const sql = fs.readFileSync("supabase/news_briefings.sql", "utf-8");
  
  console.log("Applying schema...");
  console.log("SQL:", sql.substring(0, 200) + "...\n");
  
  const { data, error } = await supabase.rpc("exec_sql", { sql_query: sql });
  
  if (error) {
    console.error("Error:", error);
    process.exit(1);
  }
  
  console.log("✅ Schema applied successfully!");
  console.log("Result:", data);
}

applySchema();
