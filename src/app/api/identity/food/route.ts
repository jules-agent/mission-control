import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface Category {
  id: string;
  name: string;
  type: string;
  parent_id: string | null;
}

interface Influence {
  id: string;
  category_id: string;
  name: string;
  alignment: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      identityId,
      category,
      budgetMin,
      budgetMax,
      location,
      mode,
      maxDriveMinutes,
      offset = 0,
      limit = 10,
    } = body;

    if (
      !identityId ||
      !category ||
      budgetMin === undefined ||
      budgetMax === undefined ||
      !location ||
      !mode ||
      !maxDriveMinutes
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify user is authenticated
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch identity data
    const { data: identity, error: identityError } = await supabase
      .from('identities')
      .select('name')
      .eq('id', identityId)
      .single();

    if (identityError || !identity) {
      return NextResponse.json({ error: 'Identity not found' }, { status: 404 });
    }

    // Fetch categories for this identity
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('identity_id', identityId);

    if (categoriesError) {
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    // Fetch all influences
    const categoryIds = (categories || []).map((c: Category) => c.id);
    let influences: Influence[] = [];

    if (categoryIds.length > 0) {
      const { data: influencesData, error: influencesError } = await supabase
        .from('influences')
        .select('*')
        .in('category_id', categoryIds)
        .order('alignment', { ascending: false });

      if (!influencesError && influencesData) {
        influences = influencesData;
      }
    }

    // Filter for food-related categories
    const foodCategoryNames = ['Food Preferences', 'Food & Dining', 'Values', 'Philosophy'];
    const foodCategoryIds = (categories || [])
      .filter((c: Category) => foodCategoryNames.some((name) => c.name.includes(name)))
      .map((c: Category) => c.id);

    let foodInfluences = influences.filter((inf) => foodCategoryIds.includes(inf.category_id));

    // Take top 15 influences by alignment
    const topInfluences = foodInfluences.sort((a, b) => b.alignment - a.alignment).slice(0, 15);

    // Build GPT prompt
    let contextLines: string[] = [];

    if (topInfluences.length > 0) {
      contextLines.push('User food preferences and dietary influences:');
      topInfluences.forEach((inf) => {
        contextLines.push(`- ${inf.name} (${inf.alignment}% alignment)`);
      });
    }

    const userContext = contextLines.join('\n');

    // Map category to cuisine type
    const cuisineMap: Record<string, string> = {
      japanese: 'Japanese/Sushi',
      bbq: 'BBQ/Steakhouse',
      mexican: 'Mexican',
      italian: 'Italian/Pizza',
      korean: 'Korean',
      indian: 'Indian',
      mediterranean: 'Middle Eastern/Mediterranean',
      thai: 'Thai/Vietnamese',
      chinese: 'Chinese',
      american: 'American/Burgers',
      seafood: 'Seafood',
      healthy: 'Healthy/Salads',
      breakfast: 'Breakfast/Brunch',
      surprise: 'any cuisine',
    };

    const cuisineType = cuisineMap[category] || 'any cuisine';

    // Pagination guidance
    const pageNum = Math.floor(offset / limit) + 1;
    const paginationNote =
      pageNum > 1
        ? `This is page ${pageNum} of results. Generate DIFFERENT restaurants than previous pages - vary neighborhoods and styles!`
        : 'This is the first page of results.';

    const locationStr = `${location.city}, ${location.state}, ${location.country}`;

    const prompt = `You are a food recommendation assistant. Generate REAL restaurant recommendations for ${cuisineType} in ${locationStr}.

Budget range: $${budgetMin} - $${budgetMax} per person

${userContext}

Dining mode: ${mode === 'dine-in' ? 'Dine-in' : 'Delivery'}
Max ${mode === 'dine-in' ? 'drive' : 'delivery'} time: ${maxDriveMinutes} minutes

${paginationNote}

Generate EXACTLY ${limit} restaurant recommendations as a JSON array. Each restaurant must have:
- name: Real restaurant name (string)
- cuisine: Cuisine tag (e.g., "Japanese", "Steakhouse", "Mexican Fusion")
- priceRange: Price range (e.g., "$", "$$", "$$$", "$$$$")
- time: Estimated ${mode === 'dine-in' ? 'drive' : 'delivery'} time in minutes (number, 5-${maxDriveMinutes})
- rating: Rating out of 5 (number, e.g., 4.5) - optional
- reason: One-line explanation of why this matches their preferences (string)
${
  mode === 'dine-in'
    ? `- address: Full street address (string)
- directionsUrl: Google Maps URL to this restaurant (string)
- menuUrl: Google search URL to find the menu (string)`
    : `- deliveryPlatforms: Array of objects with name and url (e.g., [{ name: "DoorDash", url: "https://..." }, { name: "UberEats", url: "https://..." }])`
}

IMPORTANT:
- Use REAL restaurants that actually exist in ${locationStr}
- Vary the restaurants - different neighborhoods, styles, vibes
- Stay within budget range (use priceRange: "$" for cheap, "$$$$" for fine dining)
- ${mode === 'dine-in' ? 'directionsUrl should be: https://www.google.com/maps/search/?api=1&query={url_encoded_name}+{url_encoded_address}' : ''}
- ${mode === 'dine-in' ? 'menuUrl should be: https://www.google.com/search?q={url_encoded_name}+{city}+menu' : ''}
- ${mode === 'delivery' ? 'deliveryPlatforms URLs should be search links: https://www.doordash.com/search/?query={restaurant}, https://www.ubereats.com/search?q={restaurant}, https://www.grubhub.com/search?q={restaurant}' : ''}
- Use URL encoding (spaces become +, special chars encoded)
- Times should be realistic for ${locationStr}
- Reference user preferences in the reason

Return ONLY the JSON array, no other text.`;

    // Call GPT-4o-mini
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful food recommendation assistant that returns restaurant recommendations as valid JSON arrays.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8, // Higher temperature for more varied results
      max_tokens: 2500,
    });

    const responseText = completion.choices[0]?.message?.content || '[]';

    // Parse JSON response
    let restaurants;
    try {
      // Clean response (remove markdown code blocks if present)
      const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      restaurants = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('Failed to parse GPT response:', responseText);
      return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
    }

    return NextResponse.json({ restaurants });
  } catch (error) {
    console.error('Food API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
