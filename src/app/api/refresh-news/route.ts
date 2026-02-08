import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST() {
  try {
    const scriptPath = '/Users/jules/.openclaw/workspace/scripts/populate-news-dashboard.js';
    
    // Run the news import script
    const { stdout, stderr } = await execAsync(`node ${scriptPath}`, {
      timeout: 120000, // 2 minute timeout (news scraping can take a while)
      cwd: '/Users/jules/.openclaw/workspace/scripts',
    });
    
    console.log('News refresh output:', stdout);
    if (stderr) console.error('News refresh stderr:', stderr);
    
    return NextResponse.json({ 
      success: true,
      message: 'News refreshed successfully',
      output: stdout,
    });
  } catch (error) {
    console.error('News refresh error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
