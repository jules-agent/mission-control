import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST() {
  try {
    const scriptPath = '/Users/jules/.openclaw/workspace/scripts/sync-usage.sh';
    
    // Run the sync script
    const { stdout, stderr } = await execAsync(`bash ${scriptPath}`, {
      timeout: 30000, // 30 second timeout
    });
    
    console.log('Sync output:', stdout);
    if (stderr) console.error('Sync stderr:', stderr);
    
    return NextResponse.json({ 
      success: true,
      message: 'Usage data refreshed successfully',
      output: stdout,
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
