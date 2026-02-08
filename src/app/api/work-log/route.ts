import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

export async function GET() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/work_log?order=created_at.desc`,
    { headers, next: { revalidate: 0 } }
  );
  const data = await res.json();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { date, time, text } = body;

  if (!date || !time || !text) {
    return NextResponse.json({ error: 'date, time, and text are required' }, { status: 400 });
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/work_log`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=representation' },
    body: JSON.stringify({ date, time, text }),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status === 201 ? 201 : res.status });
}
