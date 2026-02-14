# Auto-Fix Cron Pattern for App Reports

## Overview
Similar to G3 Tornado's auto-fix engine, you can set up cron jobs that periodically check for new reports and take automated actions.

## Pattern

### 1. Vercel Cron (recommended)
Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/process-reports",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### 2. Cron API Route
Create `/api/cron/process-reports/route.ts`:
```typescript
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get pending reports older than 24h
  const { data: staleReports } = await supabase
    .from("app_reports")
    .select("*")
    .eq("status", "pending")
    .lt("created_at", new Date(Date.now() - 86400000).toISOString());

  // Example actions:
  // - Send notification to admin
  // - Auto-escalate priority
  // - Attempt auto-fix for known patterns

  return NextResponse.json({ processed: staleReports?.length || 0 });
}
```

### 3. Notification Patterns
- Send daily digest email of pending reports
- Slack/Discord webhook for critical bugs
- Auto-assign priority based on keywords

## Not Yet Implemented
These crons are documented but not created. Build when needed.
