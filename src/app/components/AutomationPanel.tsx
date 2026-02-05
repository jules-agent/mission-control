'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, Bell, Zap, RefreshCw, X, Plus } from 'lucide-react';

type CronJob = {
  id: string;
  name: string;
  enabled: boolean;
  schedule: {
    kind: 'at' | 'every' | 'cron';
    atMs?: number;
    everyMs?: number;
    expr?: string;
  };
  payload: {
    kind: string;
    text: string;
  };
  state?: {
    nextRunAtMs?: number;
  };
};

const HEARTBEAT_TASKS = [
  'Status checks',
  'Email scan',
  'Calendar (2h)',
  'News scan',
  'Cost monitor',
];

function formatSchedule(schedule: CronJob['schedule']): string {
  if (schedule.kind === 'every' && schedule.everyMs) {
    const mins = schedule.everyMs / 60000;
    if (mins >= 60) return `Every ${mins / 60}h`;
    return `Every ${mins}m`;
  }
  if (schedule.kind === 'at' && schedule.atMs) {
    const date = new Date(schedule.atMs);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === new Date(now.getTime() + 86400000).toDateString();
    
    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (isToday) return `${timeStr} today`;
    if (isTomorrow) return `${timeStr} tomorrow`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  if (schedule.kind === 'cron' && schedule.expr) {
    // Simple cron parsing
    if (schedule.expr.includes('6 * * *')) return '6am daily';
    if (schedule.expr.includes('45 6')) return '6:45am';
    if (schedule.expr.includes('0 8 * * 1-5')) return '8am M-F';
    return schedule.expr;
  }
  return 'Unknown';
}

function formatTimeUntil(ms: number): string {
  const diff = ms - Date.now();
  if (diff < 0) return 'now';
  if (diff < 60000) return '<1m';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
}

export function AutomationPanel() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReminder, setNewReminder] = useState({ name: '', text: '', when: '' });
  
  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/reminders');
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const deleteReminder = async (id: string) => {
    try {
      const res = await fetch(`/api/reminders?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setJobs(jobs.filter(j => j.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const addReminder = async () => {
    if (!newReminder.name || !newReminder.text || !newReminder.when) return;
    
    // Parse the "when" field - support formats like "3pm today", "5pm tomorrow", "Feb 10 9am"
    let atMs: number;
    const now = new Date();
    const whenLower = newReminder.when.toLowerCase();
    
    if (whenLower.includes('today')) {
      const timeMatch = whenLower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
      if (timeMatch) {
        let hour = parseInt(timeMatch[1]);
        const min = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        if (timeMatch[3] === 'pm' && hour !== 12) hour += 12;
        if (timeMatch[3] === 'am' && hour === 12) hour = 0;
        const date = new Date(now);
        date.setHours(hour, min, 0, 0);
        atMs = date.getTime();
      } else {
        return;
      }
    } else if (whenLower.includes('tomorrow')) {
      const timeMatch = whenLower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
      if (timeMatch) {
        let hour = parseInt(timeMatch[1]);
        const min = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        if (timeMatch[3] === 'pm' && hour !== 12) hour += 12;
        if (timeMatch[3] === 'am' && hour === 12) hour = 0;
        const date = new Date(now.getTime() + 86400000);
        date.setHours(hour, min, 0, 0);
        atMs = date.getTime();
      } else {
        return;
      }
    } else {
      // Try to parse as a date
      const parsed = Date.parse(newReminder.when);
      if (isNaN(parsed)) return;
      atMs = parsed;
    }
    
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newReminder.name, text: `⏰ REMINDER: ${newReminder.text}`, atMs }),
      });
      if (res.ok) {
        fetchJobs();
        setNewReminder({ name: '', text: '', when: '' });
        setShowAddForm(false);
      }
    } catch (err) {
      console.error('Failed to add:', err);
    }
  };

  // Separate jobs into categories
  const scheduledJobs = jobs.filter(j => j.schedule.kind === 'every' || j.schedule.kind === 'cron');
  const oneTimeReminders = jobs.filter(j => j.schedule.kind === 'at');

  return (
    <div className="glass-panel p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <h2 className="font-medium text-white text-sm">Automation</h2>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-emerald-400 hover:text-emerald-300 text-xs flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add
          </button>
          <div className="text-[10px] text-slate-500">
            {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} PST
          </div>
        </div>
      </div>

      {/* Add Reminder Form */}
      {showAddForm && (
        <div className="mb-3 p-2 bg-slate-800/50 rounded-lg space-y-2">
          <input
            type="text"
            placeholder="Name (e.g., Call dentist)"
            value={newReminder.name}
            onChange={(e) => setNewReminder({ ...newReminder, name: e.target.value })}
            className="w-full bg-slate-900/50 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-500"
          />
          <input
            type="text"
            placeholder="Message text"
            value={newReminder.text}
            onChange={(e) => setNewReminder({ ...newReminder, text: e.target.value })}
            className="w-full bg-slate-900/50 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-500"
          />
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="When (e.g., 3pm today, 9am tomorrow)"
              value={newReminder.when}
              onChange={(e) => setNewReminder({ ...newReminder, when: e.target.value })}
              className="flex-1 bg-slate-900/50 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-500"
            />
            <button
              onClick={addReminder}
              className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs hover:bg-emerald-500/30"
            >
              Save
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-3">
        {/* Scheduled Jobs */}
        <div>
          <h3 className="text-[10px] font-medium text-slate-500 uppercase mb-1">Scheduled</h3>
          <div className="space-y-0.5">
            {loading ? (
              <div className="text-xs text-slate-500">Loading...</div>
            ) : scheduledJobs.length === 0 ? (
              <div className="text-xs text-slate-500">No scheduled jobs</div>
            ) : (
              scheduledJobs.slice(0, 5).map((job) => (
                <div key={job.id} className="flex items-center justify-between py-1 px-1.5 rounded bg-slate-800/30 text-xs">
                  <span className="text-slate-300 truncate">{job.name.replace(/\s*\([^)]*\)/, '')}</span>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-slate-500">{formatSchedule(job.schedule)}</span>
                    {job.state?.nextRunAtMs && (
                      <span className="text-cyan-400 font-mono">{formatTimeUntil(job.state.nextRunAtMs)}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Heartbeat Tasks */}
        <div>
          <h3 className="text-[10px] font-medium text-slate-500 uppercase mb-1">Heartbeat</h3>
          <div className="space-y-0.5">
            {HEARTBEAT_TASKS.map((task, i) => (
              <div key={i} className="flex items-center gap-1.5 py-1 px-1.5 rounded bg-slate-800/30 text-xs">
                <RefreshCw className="w-3 h-3 text-emerald-400" />
                <span className="text-slate-300">{task}</span>
              </div>
            ))}
          </div>
        </div>

        {/* One-time Reminders */}
        <div>
          <h3 className="text-[10px] font-medium text-slate-500 uppercase mb-1">Reminders</h3>
          <div className="space-y-0.5">
            {loading ? (
              <div className="text-xs text-slate-500">Loading...</div>
            ) : oneTimeReminders.length === 0 ? (
              <div className="text-xs text-slate-500 italic">No reminders</div>
            ) : (
              oneTimeReminders.map((job) => (
                <div key={job.id} className="flex items-center justify-between py-1 px-1.5 rounded bg-slate-800/30 text-xs group">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Bell className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    <span className="text-slate-300 truncate">{job.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500">{formatSchedule(job.schedule)}</span>
                    <button
                      onClick={() => deleteReminder(job.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-0.5"
                      title="Delete reminder"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
