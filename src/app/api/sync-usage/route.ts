import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '../../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const data = await request.json();
    
    // Validate the data
    if (!data.period || !['today', 'week', 'month', 'total'].includes(data.period)) {
      return NextResponse.json({ error: 'Invalid period' }, { status: 400 });
    }

    // Upsert the usage stats
    const { error } = await supabase
      .from('usage_stats')
      .upsert({
        period: data.period,
        input_tokens: data.inputTokens || 0,
        output_tokens: data.outputTokens || 0,
        cache_read_tokens: data.cacheReadTokens || 0,
        cache_write_tokens: data.cacheWriteTokens || 0,
        total_cost: data.totalCost || 0,
        messages: data.messages || 0,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'period',
      });

    if (error) {
      console.error('Supabase upsert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Sync usage error:', err);
    return NextResponse.json({ error: 'Failed to sync usage data' }, { status: 500 });
  }
}
