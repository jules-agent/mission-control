import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const { migration } = await request.json();
    
    if (!migration) {
      return NextResponse.json({ error: 'Migration name required' }, { status: 400 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Read migration file
    const migrationPath = path.join(process.cwd(), 'migrations', `${migration}.sql`);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Migration error:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      migration,
      result: data 
    });
    
  } catch (err: any) {
    console.error('Migration failed:', err);
    return NextResponse.json({ 
      success: false, 
      error: err.message 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint with { migration: "filename" } to run migrations',
    available: ['add-privacy-controls']
  });
}
