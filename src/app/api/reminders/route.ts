import { NextRequest, NextResponse } from 'next/server';

const OPENCLAW_GATEWAY = 'http://localhost:4318';

// Get all cron jobs
export async function GET() {
  try {
    const response = await fetch(`${OPENCLAW_GATEWAY}/api/cron/jobs`, {
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }
    
    const data = await response.json();
    return NextResponse.json({ jobs: data.jobs || [] });
  } catch (err) {
    console.error('Failed to fetch cron jobs:', err);
    return NextResponse.json({ error: 'Gateway unreachable' }, { status: 503 });
  }
}

// Add a new reminder
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, text, atMs } = body;
    
    if (!name || !text || !atMs) {
      return NextResponse.json({ error: 'Missing required fields: name, text, atMs' }, { status: 400 });
    }
    
    const job = {
      name,
      schedule: { kind: 'at', atMs },
      payload: { kind: 'systemEvent', text },
      sessionTarget: 'main',
    };
    
    const response = await fetch(`${OPENCLAW_GATEWAY}/api/cron/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job),
    });
    
    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: err }, { status: 500 });
    }
    
    const data = await response.json();
    return NextResponse.json({ success: true, job: data });
  } catch (err) {
    console.error('Failed to add reminder:', err);
    return NextResponse.json({ error: 'Gateway unreachable' }, { status: 503 });
  }
}

// Delete a reminder
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('id');
    
    if (!jobId) {
      return NextResponse.json({ error: 'Missing job id' }, { status: 400 });
    }
    
    const response = await fetch(`${OPENCLAW_GATEWAY}/api/cron/jobs/${jobId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to delete reminder:', err);
    return NextResponse.json({ error: 'Gateway unreachable' }, { status: 503 });
  }
}
