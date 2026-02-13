import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const identityId = searchParams.get('id');
  const userId = searchParams.get('user_id');

  const supabase = await createClient();

  try {
    if (identityId) {
      // Get specific identity with all data
      const { data: identity, error: identityError } = await supabase
        .from('identities')
        .select('*')
        .eq('id', identityId)
        .single();

      if (identityError) throw identityError;

      // Get categories
      const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .eq('identity_id', identityId)
        .order('level');

      // Get influences
      const categoryIds = categories?.map(c => c.id) || [];
      const { data: influences } = categoryIds.length > 0 ? await supabase
        .from('influences')
        .select('*')
        .in('category_id', categoryIds)
        .order('position') : { data: [] };

      return NextResponse.json({
        identity,
        categories: categories || [],
        influences: influences || []
      });
    } else if (userId) {
      // Get all identities for user
      const { data: identities, error } = await supabase
        .from('identities')
        .select('*')
        .eq('user_id', userId)
        .order('created_at');

      if (error) throw error;

      return NextResponse.json({ identities: identities || [] });
    } else {
      return NextResponse.json({ error: 'Missing id or user_id parameter' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const { user_id, name, is_base, parent_id } = body;

    const { data, error } = await supabase
      .from('identities')
      .insert({
        user_id,
        name,
        is_base: is_base || false,
        parent_id: parent_id || null
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
