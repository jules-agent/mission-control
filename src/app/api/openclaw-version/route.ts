import { NextResponse } from "next/server";
import { getSupabase } from "../../../lib/supabase";

const GITHUB_RELEASES_URL = "https://api.github.com/repos/openclaw/openclaw/releases/latest";

function compareVersions(v1: string, v2: string): number {
  // Compare semantic versions: YYYY.M.D-patch
  const parts1 = v1.split(/[.-]/).map(p => parseInt(p) || 0);
  const parts2 = v2.split(/[.-]/).map(p => parseInt(p) || 0);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

export async function GET() {
  try {
    // Get current version from agent status
    const supabase = getSupabase();
    let currentVersion = "2026.2.6-3"; // Fallback
    
    if (supabase) {
      const { data } = await supabase
        .from('agent_status')
        .select('openclaw_version')
        .order('last_heartbeat', { ascending: false })
        .limit(1)
        .single();
      
      if (data?.openclaw_version) {
        currentVersion = data.openclaw_version;
      }
    }
    
    // Fetch latest release from GitHub
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(GITHUB_RELEASES_URL, {
      headers: {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "OpenClaw-Mission-Control",
      },
      signal: controller.signal,
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}`);
    }

    const release = await response.json();
    const latestVersion = release.tag_name?.replace(/^v/, "") || null;
    const updateAvailable = latestVersion && compareVersions(latestVersion, currentVersion) > 0;

    return NextResponse.json({
      currentVersion,
      latestVersion,
      updateAvailable,
      releaseUrl: release.html_url,
      releaseName: release.name,
      publishedAt: release.published_at,
    });
  } catch (error) {
    console.error("Version check failed:", error);
    
    // Return current version even if check fails
    return NextResponse.json({
      currentVersion: "2026.2.6-3",
      latestVersion: null,
      updateAvailable: false,
      error: error instanceof Error ? error.message : "Version check failed",
    });
  }
}
