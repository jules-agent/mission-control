import { NextResponse } from 'next/server';

// Gateway URL - use Tailscale URL for remote access, localhost for local dev
const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL;
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN;

export async function POST() {
  // If no gateway URL configured, we can't trigger remote sync
  if (!GATEWAY_URL) {
    return NextResponse.json({ 
      success: false,
      error: 'Gateway URL not configured. Usage syncs automatically every 30 minutes.',
      autoSync: true,
    }, { status: 503 });
  }

  try {
    // Create a one-time cron job to run the sync script
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (GATEWAY_TOKEN) {
      headers['Authorization'] = `Bearer ${GATEWAY_TOKEN}`;
    }

    const cronResponse = await fetch(`${GATEWAY_URL}/v1/cron/add`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Manual Usage Sync',
        sessionTarget: 'main',
        payload: {
          kind: 'systemEvent',
          text: 'bash /Users/jules/.openclaw/workspace/scripts/sync-usage.sh'
        },
        schedule: {
          kind: 'at',
          at: new Date(Date.now() + 2000).toISOString() // 2 seconds from now
        },
        deleteAfterRun: true, // Auto-delete after completion
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!cronResponse.ok) {
      const errorText = await cronResponse.text();
      throw new Error(`${cronResponse.status} - ${errorText}`);
    }

    const cronData = await cronResponse.json();
    
    return NextResponse.json({ 
      success: true,
      message: 'Sync triggered - reload in 30 seconds',
      jobId: cronData.id,
    });
  } catch (error) {
    console.error('Refresh error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
