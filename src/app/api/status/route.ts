import { NextResponse } from "next/server";

type ServiceStatus = {
  id: string;
  service: string;
  status: "operational" | "degraded" | "down" | "pending";
  latencyMs?: number;
  lastChecked: string;
  error?: string;
};

async function checkService(
  id: string,
  name: string,
  checkFn: () => Promise<{ ok: boolean; latencyMs: number; error?: string }>
): Promise<ServiceStatus> {
  const now = new Date().toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  try {
    const result = await checkFn();
    return {
      id,
      service: name,
      status: result.ok ? "operational" : "degraded",
      latencyMs: result.latencyMs,
      lastChecked: now,
      error: result.error,
    };
  } catch (err) {
    return {
      id,
      service: name,
      status: "down",
      lastChecked: now,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

async function pingUrl(url: string, headers?: Record<string, string>): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(10000),
    });
    const latencyMs = Date.now() - start;
    return {
      ok: response.ok,
      latencyMs,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : "Request failed",
    };
  }
}

export async function GET() {
  // Run all checks in parallel
  const checks = await Promise.all([
    // Brave Search API
    checkService("brave-search-api", "Brave Search API", async () => {
      const braveKey = process.env.BRAVE_API_KEY;
      if (!braveKey) return { ok: false, latencyMs: 0, error: "No API key configured" };
      return pingUrl(
        "https://api.search.brave.com/res/v1/web/search?q=test&count=1",
        { "X-Subscription-Token": braveKey }
      );
    }),

    // GitHub API
    checkService("github-api", "GitHub API", async () => {
      return pingUrl("https://api.github.com");
    }),

    // OpenAI API (just ping, don't make actual request)
    checkService("openai-api", "OpenAI API", async () => {
      return pingUrl("https://api.openai.com/v1/models", {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY || ""}`,
      });
    }),

    // Anthropic API
    checkService("anthropic-api", "Anthropic API", async () => {
      // Anthropic doesn't have a simple ping endpoint, check their status page
      return pingUrl("https://status.anthropic.com");
    }),

    // Vercel (check our own deployment)
    checkService("vercel-deployment", "Vercel Deployment", async () => {
      return pingUrl("https://mission-control-mocha-omega.vercel.app/api/status");
    }),
  ]);

  // Add static entries for local services (can't ping from Vercel)
  const now = new Date().toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const staticServices: ServiceStatus[] = [
    {
      id: "openclaw-gateway",
      service: "OpenClaw Gateway",
      status: "operational", // Assumed if this request is coming through
      lastChecked: now,
    },
    {
      id: "imessage-bridge",
      service: "iMessage Bridge",
      status: "operational",
      lastChecked: now,
    },
  ];

  return NextResponse.json({
    statuses: [...staticServices, ...checks],
    checkedAt: now,
  });
}
