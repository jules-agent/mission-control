import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { identityId, parentCategoryId, parentCategoryName } = await request.json();
    if (!identityId) {
      return NextResponse.json({ error: 'identityId required' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    // Auth check
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get existing categories + influences for context
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, parent_id, level')
      .eq('identity_id', identityId)
      .order('level');

    const { data: allInfluences } = await supabase
      .from('influences')
      .select('name, category_id')
      .in('category_id', (categories || []).map(c => c.id));

    // Build category tree description
    const rootCats = (categories || []).filter(c => !c.parent_id);
    const treeLines: string[] = [];
    for (const root of rootCats) {
      const subs = (categories || []).filter(c => c.parent_id === root.id);
      const rootInfluences = (allInfluences || []).filter(i => i.category_id === root.id).map(i => i.name);
      if (subs.length > 0) {
        const subNames = subs.map(s => {
          const subInf = (allInfluences || []).filter(i => i.category_id === s.id).map(i => i.name);
          return `  - ${s.name}${subInf.length ? ` (${subInf.slice(0, 3).join(', ')})` : ''}`;
        }).join('\n');
        treeLines.push(`${root.name}${rootInfluences.length ? ` (${rootInfluences.slice(0, 3).join(', ')})` : ''}\n${subNames}`);
      } else {
        treeLines.push(`${root.name}${rootInfluences.length ? ` (${rootInfluences.slice(0, 5).join(', ')})` : ''}`);
      }
    }

    const isSubcategory = !!parentCategoryId;
    const context = isSubcategory
      ? `Suggest 3 useful SUBCATEGORIES to add under "${parentCategoryName}". These should be meaningful subdivisions that help organize influences within that category.`
      : `Suggest 3 useful NEW TOP-LEVEL CATEGORIES that this person doesn't have yet. Look at their existing categories and interests to find gaps — areas of their identity not yet represented.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.8,
        max_tokens: 300,
        messages: [
          {
            role: 'system',
            content: `You suggest identity profile categories. Categories organize a person's interests, preferences, and influences. Be specific and personalized based on what you see in their existing profile. Reply with JSON only: {"suggestions":[{"name":"Category Name","reason":"Why this fits","type":"custom"}]}`
          },
          {
            role: 'user',
            content: `${context}\n\nExisting profile:\n${treeLines.join('\n') || 'Empty profile'}`
          }
        ]
      })
    });

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content?.trim() || '';

    try {
      const parsed = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] || '{}');
      return NextResponse.json({ suggestions: parsed.suggestions || [] });
    } catch {
      return NextResponse.json({ suggestions: [] });
    }
  } catch (error: any) {
    console.error('Suggest category error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
