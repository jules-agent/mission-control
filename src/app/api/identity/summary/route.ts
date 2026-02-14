import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { identityId } = await request.json();
    if (!identityId) {
      return NextResponse.json({ error: 'identityId required' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    // Verify user is authenticated
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Use service role for data access (bypasses RLS)
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch identity
    const { data: identity } = await supabase
      .from('identities')
      .select('*')
      .eq('id', identityId)
      .single();

    if (!identity) {
      return NextResponse.json({ error: 'Identity not found' }, { status: 404 });
    }

    // Security: verify identity belongs to authenticated user
    if (identity.user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Fetch all categories + influences
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .eq('identity_id', identityId)
      .order('level');

    const categoryIds = categories?.map(c => c.id) || [];
    let influences: any[] = [];
    if (categoryIds.length > 0) {
      const { data } = await supabase
        .from('influences')
        .select('*, categories!inner(name)')
        .in('category_id', categoryIds)
        .order('alignment', { ascending: false });
      influences = data || [];
    }

    if (influences.length === 0) {
      return NextResponse.json({ summary: 'Add some influences to generate a profile summary.' });
    }

    // Build a compact profile snapshot for GPT
    const grouped: Record<string, string[]> = {};
    for (const inf of influences) {
      const catName = inf.categories?.name || 'Other';
      if (!grouped[catName]) grouped[catName] = [];
      if (inf.alignment >= 60) {
        grouped[catName].push(inf.name);
      }
    }

    const profileLines = Object.entries(grouped)
      .map(([cat, items]) => `${cat}: ${items.join(', ')}`)
      .join('\n');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.8,
        max_tokens: 200,
        messages: [
          {
            role: 'system',
            content: `You write beautiful, poetic 2-3 sentence identity summaries. Be vivid and specific — reference actual influences. Write in third person. No generic platitudes. Make it feel like a gallery placard for a human soul. Keep it under 40 words.`
          },
          {
            role: 'user',
            content: `Write a concise identity summary for "${identity.name}" based on their profile:\n\n${profileLines}`
          }
        ]
      })
    });

    const result = await response.json();
    const summary = result.choices?.[0]?.message?.content?.trim() || 'Could not generate summary.';

    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error('Summary generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
