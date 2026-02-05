'use client';

import { useState, useEffect } from 'react';
import { Clock, Calendar, Repeat, Bell, Zap, RefreshCw } from 'lucide-react';

const SCHEDULED_JOBS = [
  { id: '1', name: 'Usage Sync', schedule: 'Every 15m', next: '10m' },
  { id: '2', name: 'Heartbeat', schedule: 'Hourly', next: '25m' },
  { id: '3', name: 'Task Review', schedule: 'Every 4h', next: '2h' },
  { id: '4', name: 'Morning Brief', schedule: '6:45am', next: '15h' },
  { id: '5', name: 'Lunch Reminder', schedule: '8am M-F', next: '16h' },
];

const HEARTBEAT_TASKS = [
  'Status checks',
  'Email scan',
  'Calendar (2h)',
  'News scan',
  'Cost monitor',
];

const ONE_TIME = [
  { name: 'Google Voice', when: '3pm today' },
  { name: 'Flowers followup', when: '5pm today' },
  { name: "Maggie's bday", when: 'Feb 8' },
];

export function AutomationPanel() {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-panel p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <h2 className="font-medium text-white text-sm">Automation</h2>
        </div>
        <div className="text-[10px] text-slate-500">
          {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} PST
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {/* Scheduled Jobs */}
        <div>
          <h3 className="text-[10px] font-medium text-slate-500 uppercase mb-1">Scheduled</h3>
          <div className="space-y-0.5">
            {SCHEDULED_JOBS.map((job) => (
              <div key={job.id} className="flex items-center justify-between py-1 px-1.5 rounded bg-slate-800/30 text-xs">
                <span className="text-slate-300 truncate">{job.name}</span>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-slate-500">{job.schedule}</span>
                  <span className="text-cyan-400 font-mono">{job.next}</span>
                </div>
              </div>
            ))}
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
            {ONE_TIME.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-1 px-1.5 rounded bg-slate-800/30 text-xs">
                <div className="flex items-center gap-1.5">
                  <Bell className="w-3 h-3 text-amber-400" />
                  <span className="text-slate-300 truncate">{item.name}</span>
                </div>
                <span className="text-[10px] text-slate-500">{item.when}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
