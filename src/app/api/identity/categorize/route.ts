import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { interest, identityId, sourceCategory } = await request.json();
    if (!interest || !identityId) {
      return NextResponse.json({ error: 'interest and identityId required' }, { status: 400 });
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

    // Get existing categories for this identity
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, parent_id, level')
      .eq('identity_id', identityId)
      .order('level');

    // Build hierarchical category list — prefer subcategories (leaf nodes) for placement
    const rootCats = (categories || []).filter(c => !c.parent_id);
    const categoryLines: string[] = [];
    for (const root of rootCats) {
      const subs = (categories || []).filter(c => c.parent_id === root.id);
      if (subs.length > 0) {
        for (const sub of subs) {
          categoryLines.push(`"${root.name} > ${sub.name}" (use "${sub.name}" as the match)`);
        }
      } else {
        categoryLines.push(`"${root.name}"`);
      }
    }
    const categoryList = categoryLines.join('\n') || 'none yet';

    // If we know where this came from (e.g., AI recommendation from a specific category), bias toward it
    const sourceCategoryHint = sourceCategory 
      ? `\n\nIMPORTANT: This interest was recommended from the "${sourceCategory}" category. Unless it clearly belongs elsewhere, match it to "${sourceCategory}".`
      : '';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.1,
        max_tokens: 100,
        messages: [
          {
            role: 'system',
            content: `You categorize interests/influences into identity profile categories. RULES:
1. ALWAYS prefer an existing category over creating a new one
2. For subcategories like "Music > Artists", match to the subcategory name "Artists" 
3. Only suggest a new category if NOTHING existing fits at all
4. Match the EXACT name of an existing category — do not rename or rephrase it
Reply with JSON only: {"category":"exact category name from list","isNew":false,"suggestedType":"music|food|philosophy|custom","confidence":"high|medium|low"}`
          },
          {
            role: 'user',
            content: `Interest: "${interest}"\n\nExisting categories:\n${categoryList}${sourceCategoryHint}`
          }
        ]
      })
    });

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content?.trim() || '';
    
    try {
      const parsed = JSON.parse(content);
      // Find the matching category ID — try exact match, then case-insensitive, then partial
      const catName = parsed.category?.toLowerCase() || '';
      const match = categories?.find(c => c.name.toLowerCase() === catName) 
        || categories?.find(c => c.name.toLowerCase().includes(catName) || catName.includes(c.name.toLowerCase()));
      return NextResponse.json({
        category: parsed.category,
        categoryId: match?.id || null,
        isNew: parsed.isNew ?? !match,
        suggestedType: parsed.suggestedType || 'custom',
        confidence: parsed.confidence || 'medium',
      });
    } catch {
      return NextResponse.json({
        category: 'Interests',
        categoryId: null,
        isNew: true,
        suggestedType: 'custom',
        confidence: 'low',
      });
    }
  } catch (error: any) {
    console.error('Categorize error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
