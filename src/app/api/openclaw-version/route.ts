import { NextResponse } from "next/server";

const CURRENT_VERSION = "2026.2.6-3";
const GITHUB_RELEASES_URL = "https://api.github.com/repos/openclaw/openclaw/releases/latest";

export async function GET() {
  try {
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
    const updateAvailable = latestVersion && latestVersion !== CURRENT_VERSION;

    return NextResponse.json({
      currentVersion: CURRENT_VERSION,
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
      currentVersion: CURRENT_VERSION,
      latestVersion: null,
      updateAvailable: false,
      error: error instanceof Error ? error.message : "Version check failed",
    });
  }
}
