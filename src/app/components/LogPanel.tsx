'use client';

import { useState } from 'react';
import { X, FileText } from 'lucide-react';

// Work log entries - add new entries at the top
const LOG_ENTRIES = [
  { date: '2/5/2026', time: '4:35 PM', text: 'Tornado: Adding search box with comma-separated AND logic + fixing color system completely + tornado favicon' },
  { date: '2/5/2026', time: '4:19 PM', text: 'Generated morning news rap lyrics; AIML music API issues - sent lyrics as text' },
  { date: '2/5/2026', time: '4:09 PM', text: 'Fixed G3-Tornado row color visibility text/gradient conflicts in dark mode' },
  { date: '2/5/2026', time: '3:54 PM', text: 'Wrote 1997 NYC boom-bap lyrics for daily news rap; created 6:30am daily cron' },
  { date: '2/5/2026', time: '3:42 PM', text: 'Diagnosed total model blackout - both Kimi providers had auth failures' },
  { date: '2/5/2026', time: '3:22 PM', text: 'Regenerated NVIDIA API key; switched session to Kimi K2.5 as primary' },
  { date: '2/5/2026', time: '3:10 PM', text: 'Reordered model chain: Kimi K2.5 primary, Opus fallback, Gemini Flash last resort' },
  { date: '2/5/2026', time: '2:19 PM', text: 'Maximum density UI update: compact all panels, 2-col status, 3-col automation, inline task filters' },
  { date: '2/5/2026', time: '2:15 PM', text: 'Created new Supabase project "mission-control" for usage data storage' },
  { date: '2/5/2026', time: '1:52 PM', text: 'Updated usage sync cron from 5min to 15min intervals' },
  { date: '2/5/2026', time: '1:45 PM', text: 'Increased UI density: emblem 20% bigger, tighter padding throughout' },
  { date: '2/5/2026', time: '1:30 PM', text: 'Integrated lobster mission emblem into header with CSS text overlay' },
  { date: '2/5/2026', time: '1:15 PM', text: 'Generated SpaceX × Lobster logo concepts via DALL-E 3 (3 versions)' },
  { date: '2/5/2026', time: '12:45 PM', text: 'Created Automation Schedule panel showing all cron jobs + heartbeat tasks' },
  { date: '2/5/2026', time: '12:30 PM', text: 'Removed Moonshot Kimi K2 entirely - using only NVIDIA Kimi K2.5 (free) with Opus fallbacks' },
  { date: '2/5/2026', time: '12:15 PM', text: 'Fixed $45 overspend root cause: Moonshot Kimi K2 had 401 auth error → fell back to Opus for 472 messages' },
  { date: '2/5/2026', time: '11:45 AM', text: 'Connected real OpenClaw usage data to dashboard via sync script' },
  { date: '2/5/2026', time: '11:30 AM', text: 'Saved humor/style preferences to USER.md (Chappelle, Schulz, Shane Gillis, Rogan)' },
  { date: '2/5/2026', time: '11:15 AM', text: 'Saved UP.FIT government contacts (Gennaro/LVMPD, Abdalla/SPPD) to USER.md' },
  { date: '2/5/2026', time: '11:00 AM', text: 'Added deployment verification process to security playbook' },
  { date: '2/5/2026', time: '10:45 AM', text: 'Established Trust Protocol - verification phrase required for risky actions' },
  { date: '2/5/2026', time: '10:30 AM', text: 'Added API cost chart with recharts library' },
  { date: '2/5/2026', time: '10:15 AM', text: 'Added SpaceX-style Mission Control header with animated telemetry, mission time counter, trajectory line' },
  { date: '2/5/2026', time: '10:00 AM', text: 'Major UI redesign with glass theme and animated gradients' },
  { date: '2/5/2026', time: '9:45 AM', text: 'Added SessionProvider to fix 500 error on dashboard' },
  { date: '2/5/2026', time: '9:30 AM', text: 'Added Vercel environment variables (AUTH_EMAIL, AUTH_PASSWORD, BRAVE_API_KEY)' },
  { date: '2/5/2026', time: '9:15 AM', text: 'Fixed GitGuardian security alert - moved credentials to environment variables' },
  { date: '2/5/2026', time: '9:00 AM', text: 'Updated HEARTBEAT.md with news scan and API cost thresholds' },
  { date: '2/5/2026', time: '8:45 AM', text: 'Created questions-for-ben.md with queue of questions' },
  { date: '2/5/2026', time: '8:30 AM', text: 'Set up Lunch Reminder cron at 8am M-F' },
  { date: '2/5/2026', time: '8:15 AM', text: 'Set up Morning Briefing cron at 6:45am PST' },
  { date: '2/5/2026', time: '8:00 AM', text: 'Fixed stale dashboard status data - added real-time status checks API with latency tracking' },
  { date: '2/5/2026', time: '7:45 AM', text: 'Set birthday reminder cron for Maggie (Feb 8)' },
  { date: '2/5/2026', time: '7:30 AM', text: 'Saved Ben\'s food preferences and wife Maggie\'s info to USER.md' },
  { date: '2/5/2026', time: '7:15 AM', text: 'Set up 4-hour cron job for task review' },
  { date: '2/5/2026', time: '7:00 AM', text: 'Added task ranking with up/down controls and source tracking' },
  { date: '2/5/2026', time: '6:45 AM', text: 'Fixed Brave Search API key integration' },
  { date: '2/4/2026', time: '11:00 PM', text: 'Mission Control dashboard deployed - auth, status panel, tasks panel working' },
  { date: '2/4/2026', time: '10:00 PM', text: 'Added Model Workflow panel and API Usage panel with time period filters' },
  { date: '2/4/2026', time: '9:00 PM', text: 'Set Kimi K2.5 as default model, documented workflow in TOOLS.md' },
  { date: '2/4/2026', time: '4:30 PM', text: 'G3-Tornado MVP complete - auth, tasks, notes, FU tracking all working' },
  { date: '2/4/2026', time: '12:00 PM', text: 'Jules born - first boot, named by Ben' },
];

export function LogButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-white text-xs font-medium transition-colors"
      >
        <FileText className="w-3.5 h-3.5" />
        Log
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[80vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h2 className="font-semibold text-white">Work Log</h2>
                <span className="text-xs text-slate-500">{LOG_ENTRIES.length} entries</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Log entries */}
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
              <div className="space-y-2">
                {LOG_ENTRIES.map((entry, i) => (
                  <div key={i} className="flex gap-3 py-2 border-b border-slate-800/50 last:border-0">
                    <div className="flex-shrink-0 text-[11px] text-slate-500 font-mono w-28">
                      {entry.date} {entry.time}
                    </div>
                    <div className="text-sm text-slate-300">• {entry.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
