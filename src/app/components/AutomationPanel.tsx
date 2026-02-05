'use client';

import { useState, useEffect } from 'react';
import { Clock, Calendar, Repeat, Bell, Zap, RefreshCw } from 'lucide-react';

interface ScheduledJob {
  id: string;
  name: string;
  schedule: {
    kind: 'cron' | 'every' | 'at';
    expr?: string;
    everyMs?: number;
    atMs?: number;
    tz?: string;
  };
  enabled?: boolean;
  state?: {
    nextRunAtMs?: number;
    lastRunAtMs?: number;
    lastStatus?: string;
  };
}

// Hardcoded jobs based on actual cron configuration
const SCHEDULED_JOBS: ScheduledJob[] = [
  {
    id: '1',
    name: 'Morning Briefing',
    schedule: { kind: 'cron', expr: '45 6 * * *', tz: 'America/Los_Angeles' },
    enabled: true,
    state: { nextRunAtMs: Date.now() + 16 * 60 * 60 * 1000 }
  },
  {
    id: '2', 
    name: 'Daily Report',
    schedule: { kind: 'cron', expr: '0 6 * * *', tz: 'America/Los_Angeles' },
    enabled: true,
    state: { nextRunAtMs: Date.now() + 15 * 60 * 60 * 1000 }
  },
  {
    id: '3',
    name: 'Lunch Reminder',
    schedule: { kind: 'cron', expr: '0 8 * * 1-5', tz: 'America/Los_Angeles' },
    enabled: true,
    state: { nextRunAtMs: Date.now() + 17 * 60 * 60 * 1000 }
  },
  {
    id: '4',
    name: 'Hourly Heartbeat',
    schedule: { kind: 'cron', expr: '0 5-23,0 * * *', tz: 'America/Los_Angeles' },
    enabled: true,
    state: { lastRunAtMs: Date.now() - 30 * 60 * 1000, nextRunAtMs: Date.now() + 30 * 60 * 1000 }
  },
  {
    id: '5',
    name: 'Usage Data Sync',
    schedule: { kind: 'every', everyMs: 300000 },
    enabled: true,
    state: { lastRunAtMs: Date.now() - 2 * 60 * 1000, nextRunAtMs: Date.now() + 3 * 60 * 1000 }
  },
  {
    id: '6',
    name: 'Task Review',
    schedule: { kind: 'every', everyMs: 14400000 },
    enabled: true,
    state: { nextRunAtMs: Date.now() + 2 * 60 * 60 * 1000 }
  },
];

const HEARTBEAT_TASKS = [
  'Service status checks',
  'Unread emails scan',
  'Calendar events (next 2h)',
  'News scan (Tesla/EV/JDM)',
  'API cost monitoring',
];

function formatSchedule(schedule: ScheduledJob['schedule']): string {
  if (schedule.kind === 'cron') {
    const expr = schedule.expr || '';
    // Parse common patterns
    if (expr.includes('6 * * *')) return '6:00 AM daily';
    if (expr.includes('45 6')) return '6:45 AM daily';
    if (expr.includes('8 * * 1-5')) return '8:00 AM weekdays';
    if (expr.includes('5-23,0')) return 'Hourly (5am-1am)';
    return expr;
  }
  if (schedule.kind === 'every') {
    const mins = (schedule.everyMs || 0) / 60000;
    if (mins >= 60) return `Every ${mins / 60}h`;
    return `Every ${mins}m`;
  }
  if (schedule.kind === 'at' && schedule.atMs) {
    return new Date(schedule.atMs).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
  return 'Unknown';
}

function formatTimeUntil(ms: number): string {
  const diff = ms - Date.now();
  if (diff < 0) return 'overdue';
  if (diff < 60000) return '<1m';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
}

function getScheduleIcon(kind: string) {
  switch (kind) {
    case 'cron': return <Calendar className="w-3.5 h-3.5" />;
    case 'every': return <Repeat className="w-3.5 h-3.5" />;
    case 'at': return <Bell className="w-3.5 h-3.5" />;
    default: return <Clock className="w-3.5 h-3.5" />;
  }
}

export function AutomationPanel() {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Sort jobs by next run time
  const sortedJobs = [...SCHEDULED_JOBS].sort((a, b) => {
    const aNext = a.state?.nextRunAtMs || Infinity;
    const bNext = b.state?.nextRunAtMs || Infinity;
    return aNext - bNext;
  });

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-yellow-400" />
          <div>
            <h2 className="text-lg font-semibold text-white">Automation Schedule</h2>
            <p className="text-xs text-slate-400">Scheduled jobs & heartbeat tasks</p>
          </div>
        </div>
        <div className="text-xs text-slate-500">
          {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} PST
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Scheduled Jobs */}
        <div>
          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
            Scheduled Jobs
          </h3>
          <div className="space-y-1.5">
            {sortedJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between py-1.5 px-2 rounded bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className={`${job.enabled !== false ? 'text-cyan-400' : 'text-slate-600'}`}>
                    {getScheduleIcon(job.schedule.kind)}
                  </span>
                  <span className={`text-sm ${job.enabled !== false ? 'text-slate-200' : 'text-slate-500'}`}>
                    {job.name}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-500">{formatSchedule(job.schedule)}</span>
                  {job.state?.nextRunAtMs && (
                    <span className="text-cyan-400 font-mono min-w-[3ch] text-right">
                      {formatTimeUntil(job.state.nextRunAtMs)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Heartbeat Tasks */}
        <div>
          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
            Heartbeat Checks
          </h3>
          <div className="space-y-1.5">
            {HEARTBEAT_TASKS.map((task, i) => (
              <div
                key={i}
                className="flex items-center gap-2 py-1.5 px-2 rounded bg-slate-800/30"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-sm text-slate-300">{task}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2 italic">
            Runs hourly 5am-1am PST via HEARTBEAT.md
          </p>
        </div>
      </div>
    </div>
  );
}
