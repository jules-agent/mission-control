import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '../../../lib/supabase';

// Get all reminders
export async function GET() {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .order('due_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch reminders:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reminders: data || [] });
}

// Add a new reminder
export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { name, text, due_at, created_by = 'ben' } = body;

    if (!name || !text || !due_at) {
      return NextResponse.json({ error: 'Missing required fields: name, text, due_at' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('reminders')
      .insert({ name, text, due_at, created_by })
      .select()
      .single();

    if (error) {
      console.error('Failed to add reminder:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, reminder: data });
  } catch (err) {
    console.error('Failed to add reminder:', err);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

// Update a reminder (mark complete/uncomplete)
export async function PATCH(request: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { id, completed } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing reminder id' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (typeof completed === 'boolean') {
      updates.completed = completed;
      updates.completed_at = completed ? new Date().toISOString() : null;
    }

    const { data, error } = await supabase
      .from('reminders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update reminder:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, reminder: data });
  } catch (err) {
    console.error('Failed to update reminder:', err);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

// Delete a reminder
export async function DELETE(request: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing reminder id' }, { status: 400 });
    }

    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete reminder:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to delete reminder:', err);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
