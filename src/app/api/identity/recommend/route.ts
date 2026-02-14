import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { categoryName, categoryType, existingInfluences, recentlyDismissed } = await request.json();

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const influenceList = existingInfluences
      .map((i: { name: string; alignment: number }) => `${i.name} (${i.alignment}% alignment)`)
      .join(', ');

    const prompt = `You are helping someone build their personal identity map. They have a category called "${categoryName}" (type: ${categoryType}) with these existing influences: ${influenceList || 'none yet'}.

Based on their existing taste and preferences, suggest ONE new influence they would likely appreciate. This should be personalized and specific — not generic or obvious. Consider:
- What patterns exist in their current influences
- What gaps or complementary additions would enrich their profile
- Something that shows deep knowledge of the domain

${recentlyDismissed?.length ? `\nDO NOT suggest any of these (already dismissed): ${recentlyDismissed.join(', ')}\n` : ''}
Respond in JSON format only:
{
  "name": "Name of the influence",
  "reason": "One sentence explaining why this fits their profile",
  "alignment": 65
}

The alignment should be your best guess at how aligned this person would be (0-100%). Keep the reason concise and insightful.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI API error: ${err}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
    // Parse JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse recommendation');
    }

    const recommendation = JSON.parse(jsonMatch[0]);
    return NextResponse.json(recommendation);
  } catch (error: any) {
    console.error('Recommendation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
