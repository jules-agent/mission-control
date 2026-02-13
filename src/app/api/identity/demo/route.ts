import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service role client bypasses RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    // Get all identities
    const { data: identities, error: idError } = await supabase
      .from('identities')
      .select('*')
      .order('created_at', { ascending: true });

    if (idError) throw idError;

    // Get category counts for each identity
    const identitiesWithStats = await Promise.all(
      (identities || []).map(async (identity) => {
        const { count: categoryCount } = await supabase
          .from('categories')
          .select('*', { count: 'exact', head: true })
          .eq('identity_id', identity.id);

        const { count: influenceCount } = await supabase
          .from('influences')
          .select('category_id, categories!inner(identity_id)', { count: 'exact', head: true })
          .eq('categories.identity_id', identity.id);

        return {
          ...identity,
          stats: {
            categories: categoryCount || 0,
            influences: influenceCount || 0
          }
        };
      })
    );

    return NextResponse.json({
      identities: identitiesWithStats,
      total: identities?.length || 0
    });
  } catch (error: any) {
    console.error('Demo API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
