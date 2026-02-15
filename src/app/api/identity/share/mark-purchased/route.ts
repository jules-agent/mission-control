import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const { shareLinkId, influenceId, purchaserName, purchaserEmail, notes } = await request.json();
    
    if (!shareLinkId || !influenceId || !purchaserName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Record the purchase
    const { data, error } = await supabase
      .from('gift_tracking')
      .insert({
        share_link_id: shareLinkId,
        influence_id: influenceId,
        purchaser_name: purchaserName,
        purchaser_email: purchaserEmail,
        notes,
        is_confirmed: false, // Owner must confirm
      })
      .select()
      .single();
    
    if (error) {
      console.error('Failed to record purchase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // TODO: Send email notification to profile owner
    
    return NextResponse.json({ success: true, data });
    
  } catch (err: any) {
    console.error('Mark purchased error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
