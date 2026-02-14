import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { interest, identityId } = await request.json();
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

    const categoryList = (categories || [])
      .map(c => {
        const parent = categories?.find(p => p.id === c.parent_id);
        return parent ? `${parent.name} > ${c.name}` : c.name;
      })
      .join(', ');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 100,
        messages: [
          {
            role: 'system',
            content: `You categorize interests/influences into identity profile categories. Given an interest and existing categories, pick the best match. If no existing category fits well, suggest a new one. Reply with JSON only: {"category":"exact category name","isNew":false,"suggestedType":"music|food|philosophy|custom","confidence":"high|medium|low"}`
          },
          {
            role: 'user',
            content: `Interest: "${interest}"\nExisting categories: ${categoryList || 'none yet'}`
          }
        ]
      })
    });

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content?.trim() || '';
    
    try {
      const parsed = JSON.parse(content);
      // Find the matching category ID if it exists
      const match = categories?.find(c => c.name.toLowerCase() === parsed.category?.toLowerCase());
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
