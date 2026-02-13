import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface MatchRequest {
  identity_id: string;
  context: {
    mood?: string;
    time_of_day?: string;
    song_type?: string;
    category_types?: string[]; // ['music', 'philosophy']
  };
  count?: number;
}

interface Influence {
  id: string;
  category_id: string;
  name: string;
  alignment: number;
  position: number;
  mood_tags: string[];
  metadata: any;
}

interface Category {
  id: string;
  type: string;
  influence_curve_override: any;
}

export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    const body: MatchRequest = await request.json();
    const { identity_id, context, count = 10 } = body;

    // Get identity settings
    const { data: identity } = await supabase
      .from('identities')
      .select('*')
      .eq('id', identity_id)
      .single();

    if (!identity) {
      return NextResponse.json({ error: 'Identity not found' }, { status: 404 });
    }

    // Get categories of requested types
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .eq('identity_id', identity_id)
      .in('type', context.category_types || ['music']);

    if (!categories || categories.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    const categoryIds = categories.map((c: Category) => c.id);

    // Get influences for these categories
    const { data: influences } = await supabase
      .from('influences')
      .select('*')
      .in('category_id', categoryIds)
      .order('position');

    if (!influences || influences.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    // Get play history for recency tracking (last 20 days)
    const twentyDaysAgo = new Date();
    twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);

    const { data: playHistory } = await supabase
      .from('play_history')
      .select('influence_id, played_at')
      .eq('identity_id', identity_id)
      .gte('played_at', twentyDaysAgo.toISOString());

    const playedCounts = new Map<string, { count: number; lastPlayed: Date }>();
    (playHistory || []).forEach((play: any) => {
      const existing = playedCounts.get(play.influence_id) || { count: 0, lastPlayed: new Date(0) };
      playedCounts.set(play.influence_id, {
        count: existing.count + 1,
        lastPlayed: new Date(Math.max(existing.lastPlayed.getTime(), new Date(play.played_at).getTime()))
      });
    });

    // Score influences
    const scored = influences.map((influence: Influence) => {
      let score = influence.alignment;

      // Apply position weighting (exponential decay)
      const positionWeight = Math.exp(-0.1 * influence.position);
      score *= positionWeight;

      // Mood match bonus
      if (context.mood && influence.mood_tags?.includes(context.mood)) {
        score *= 1.2;
      }

      // Recency penalty
      const playData = playedCounts.get(influence.id);
      if (playData) {
        const daysSincePlay = (Date.now() - playData.lastPlayed.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSincePlay <= 5) {
          score *= 0.7;
        } else if (daysSincePlay <= 10) {
          score *= 0.9;
        }
      } else {
        // Unplayed boost
        score *= 1.5;
      }

      return {
        ...influence,
        score
      };
    });

    // Filter by serving threshold (60%)
    const filtered = scored.filter(item => item.alignment >= 60);

    // Sort by score and take top N
    const matches = filtered
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .map(({ score, ...influence }) => ({
        ...influence,
        match_score: Math.round(score * 10) / 10
      }));

    return NextResponse.json({ matches });
  } catch (error: any) {
    console.error('Match error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
