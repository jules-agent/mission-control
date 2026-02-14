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
    const { user_id, name, is_base, parent_id, duplicate_from } = body;

    // Handle duplicate operation
    if (duplicate_from) {
      // Get source identity with all categories and influences
      const { data: sourceIdentity } = await supabase
        .from('identities')
        .select('*')
        .eq('id', duplicate_from)
        .single();

      if (!sourceIdentity) {
        return NextResponse.json({ error: 'Source identity not found' }, { status: 404 });
      }

      // Create new identity
      const { data: newIdentity, error: identityError } = await supabase
        .from('identities')
        .insert({
          user_id: sourceIdentity.user_id,
          name,
          is_base: false,
          parent_id: null
        })
        .select()
        .single();

      if (identityError) throw identityError;

      // Get all categories from source
      const { data: sourceCategories } = await supabase
        .from('categories')
        .select('*')
        .eq('identity_id', duplicate_from)
        .order('level', { ascending: true });

      if (sourceCategories && sourceCategories.length > 0) {
        // Map old category IDs to new ones
        const categoryIdMap: Record<string, string> = {};

        // Insert categories (maintaining hierarchy)
        for (const cat of sourceCategories) {
          const { data: newCat, error: catError } = await supabase
            .from('categories')
            .insert({
              identity_id: newIdentity.id,
              parent_id: cat.parent_id ? (categoryIdMap[cat.parent_id] || null) : null,
              name: cat.name,
              type: cat.type,
              level: cat.level
            })
            .select()
            .single();

          if (catError) throw catError;
          if (newCat) {
            categoryIdMap[cat.id] = newCat.id;
          }
        }

        // Get all influences from source categories
        const sourceIds = sourceCategories.map(c => c.id);
        const { data: sourceInfluences } = await supabase
          .from('influences')
          .select('*')
          .in('category_id', sourceIds);

        // Insert influences with new category IDs
        if (sourceInfluences && sourceInfluences.length > 0) {
          const newInfluences = sourceInfluences.map(inf => ({
            category_id: categoryIdMap[inf.category_id],
            name: inf.name,
            alignment: inf.alignment,
            position: inf.position,
            mood_tags: inf.mood_tags || []
          }));

          const { error: infError } = await supabase
            .from('influences')
            .insert(newInfluences);

          if (infError) throw infError;
        }
      }

      return NextResponse.json(newIdentity);
    }

    // Regular create
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

export async function PATCH(request: Request) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const { id, name } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'Missing id or name' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('identities')
      .update({ name })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const supabase = await createClient();

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    // Check if this is the only identity for the user
    const { data: identity } = await supabase
      .from('identities')
      .select('user_id')
      .eq('id', id)
      .single();

    if (identity) {
      const { data: userIdentities } = await supabase
        .from('identities')
        .select('id')
        .eq('user_id', identity.user_id);

      if (userIdentities && userIdentities.length === 1) {
        return NextResponse.json({ error: 'Cannot delete the only identity' }, { status: 400 });
      }
    }

    // Delete categories (cascades to influences)
    await supabase
      .from('categories')
      .delete()
      .eq('identity_id', id);

    // Delete identity
    const { error } = await supabase
      .from('identities')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
