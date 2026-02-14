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

interface PhysicalAttributes {
  height?: string;
  weight?: string;
  build?: string;
  shirtSize?: string;
  pantSize?: string;
  shoeSize?: string;
  hairColor?: string;
  eyeColor?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identityId, category, budgetMin, budgetMax, offset = 0, limit = 10 } = body;

    if (!identityId || !category || budgetMin === undefined || budgetMax === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify user is authenticated
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch identity data
    const { data: identity, error: identityError } = await supabase
      .from('identities')
      .select('name, physical_attributes')
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

    // Build context for GPT based on category
    const physicalAttrs: PhysicalAttributes = identity.physical_attributes || {};
    
    // Map shopping categories to identity categories
    const categoryMapping: Record<string, string[]> = {
      books: ['Intellectual Interests', 'Entertainment', 'Philosophy'],
      fashion: ['Fashion & Style', 'Brands', 'Aesthetic', 'Accessories'],
      music: ['Music', 'Artists', 'Genres', 'Moods'],
      gaming: ['Entertainment', 'Intellectual Interests'],
      home: [],
      kitchen: ['Food Preferences', 'Food & Dining'],
      fitness: ['Daily Rhythm', 'Values'],
      art: ['Art & Hobbies'],
      kids: ['Parenting'],
      automotive: ['Business & Industry'],
      gifts: [], // Use all categories
      surprise: [], // Use all categories
    };

    const relevantCategoryNames = categoryMapping[category] || [];
    
    // Filter influences by relevant categories
    let relevantInfluences = influences;
    if (relevantCategoryNames.length > 0) {
      const relevantCategoryIds = (categories || [])
        .filter((c: Category) => relevantCategoryNames.some(name => c.name.includes(name)))
        .map((c: Category) => c.id);
      
      if (relevantCategoryIds.length > 0) {
        relevantInfluences = influences.filter(inf => 
          relevantCategoryIds.includes(inf.category_id)
        );
      }
    }

    // Take top 20 influences by alignment
    const topInfluences = relevantInfluences
      .sort((a, b) => b.alignment - a.alignment)
      .slice(0, 20);

    // Build GPT prompt
    let contextLines: string[] = [];
    
    if (topInfluences.length > 0) {
      contextLines.push('User interests and influences (by alignment):');
      topInfluences.forEach(inf => {
        contextLines.push(`- ${inf.name} (${inf.alignment}% alignment)`);
      });
    }

    // Add physical attributes for fashion/fitness categories
    if ((category === 'fashion' || category === 'fitness') && Object.keys(physicalAttrs).length > 0) {
      contextLines.push('\nPhysical attributes:');
      if (physicalAttrs.height) contextLines.push(`- Height: ${physicalAttrs.height}`);
      if (physicalAttrs.weight) contextLines.push(`- Weight: ${physicalAttrs.weight}`);
      if (physicalAttrs.build) contextLines.push(`- Build: ${physicalAttrs.build}`);
      if (physicalAttrs.shirtSize) contextLines.push(`- Shirt size: ${physicalAttrs.shirtSize}`);
      if (physicalAttrs.pantSize) contextLines.push(`- Pant size: ${physicalAttrs.pantSize}`);
      if (physicalAttrs.shoeSize) contextLines.push(`- Shoe size: ${physicalAttrs.shoeSize}`);
    }

    const userContext = contextLines.join('\n');

    // Category-specific instructions
    const categoryInstructions: Record<string, string> = {
      books: 'Recommend books based on their intellectual interests and entertainment preferences. Include both fiction and non-fiction.',
      fashion: 'Recommend clothing items that match their style and physical attributes. Include sizing guidance when relevant.',
      music: 'Recommend vinyl records, band merchandise, instruments, or music gear based on their music tastes.',
      gaming: 'Recommend video games, consoles, gaming accessories, or tech gadgets.',
      home: 'Recommend home decor, furniture, or living space items.',
      kitchen: 'Recommend cooking equipment, utensils, or food-related items based on their food preferences.',
      fitness: 'Recommend fitness equipment, workout gear, or health/wellness products.',
      art: 'Recommend art supplies, creative tools, or hobby-related items.',
      kids: 'Recommend toys, educational items, or products suitable for children.',
      automotive: 'Recommend car accessories, tools, or automotive-related products.',
      gifts: 'Recommend gift ideas that would be perfect FOR this person based on their complete profile.',
      surprise: 'Recommend surprising and delightful items from ANY category based on their profile.',
    };

    const instruction = categoryInstructions[category] || 'Recommend relevant products.';

    // Pagination guidance (offset tells AI to generate different items)
    const pageNum = Math.floor(offset / limit) + 1;
    const paginationNote = pageNum > 1 
      ? `This is page ${pageNum} of results. Generate DIFFERENT products than previous pages - be creative and diverse!`
      : 'This is the first page of results.';

    const prompt = `You are a personal shopping assistant. ${instruction}

Budget range: $${budgetMin} - $${budgetMax}

${userContext}

${paginationNote}

Generate EXACTLY ${limit} product recommendations as a JSON array. Each product must have:
- name: Product name (string)
- price: Exact price with $ symbol (e.g., "$49.99")
- reason: One-line explanation of why this matches their profile (string, reference specific interests/attributes)
- store: Store name (e.g., "Amazon", "Nordstrom", "Best Buy")
- url: Direct search URL that will find this product (string)
- imageHint: Brief description for potential image (optional)

IMPORTANT URL REQUIREMENTS:
- For books: https://www.amazon.com/s?k={url_encoded_book_title}
- For music/vinyl: https://www.amazon.com/s?k={url_encoded_artist_or_album}
- For fashion: https://www.amazon.com/s?k={url_encoded_product_name}
- For electronics: https://www.amazon.com/s?k={url_encoded_product_name}
- Use URL encoding (spaces become +, special chars encoded)
- Generate REAL search URLs that will find the actual product
- All URLs should start with https://

Price guidelines:
- Stay within budget range
- Vary prices throughout the list
- Include mix of lower and higher-priced items within range

Return ONLY the JSON array, no other text.`;

    // Call GPT-4o-mini
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful shopping assistant that returns product recommendations as valid JSON arrays.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8, // Higher temperature for more varied results
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content || '[]';
    
    // Parse JSON response
    let products;
    try {
      // Clean response (remove markdown code blocks if present)
      const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      products = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('Failed to parse GPT response:', responseText);
      return NextResponse.json(
        { error: 'Failed to generate recommendations' },
        { status: 500 }
      );
    }

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Shopping API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
