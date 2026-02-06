'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, Bell, Zap, RefreshCw, X, Plus, Check, Circle } from 'lucide-react';

type Reminder = {
  id: string;
  name: string;
  text: string;
  due_at: string;
  completed: boolean;
  completed_at: string | null;
  created_by: 'ben' | 'jules';
  created_at: string;
};

const SCHEDULED_JOBS = [
  { name: 'Heartbeat', schedule: '1h', desc: 'Status checks, news, cost monitor', model: null },
  { name: 'Morning Report', schedule: '6am', desc: 'Daily briefing', model: 'opus' },
  { name: 'Morning Status', schedule: '6:45am', desc: 'News + ideas', model: 'opus' },
  { name: 'Lunch Reminder', schedule: '8am M-F', desc: "Don't forget lunch!", model: null },
  { name: 'Task Review', schedule: '4h', desc: 'Mission Control tasks', model: null },
  { name: 'Usage Sync', schedule: '15m', desc: 'Sync API stats', model: null },
];

function formatTimeUntil(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff < 0) return 'past due';
  if (diff < 60000) return '<1m';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
}

function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = date.toDateString() === new Date(now.getTime() + 86400000).toDateString();
  
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (isToday) return `${timeStr} today`;
  if (isTomorrow) return `${timeStr} tomorrow`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function AutomationPanel() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [newReminder, setNewReminder] = useState({ name: '', text: '', when: '' });
  const [saving, setSaving] = useState(false);
  
  const fetchReminders = useCallback(async () => {
    try {
      const res = await fetch('/api/reminders');
      if (res.ok) {
        const data = await res.json();
        setReminders(data.reminders || []);
      }
    } catch (err) {
      console.error('Failed to fetch reminders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    const refreshInterval = setInterval(fetchReminders, 30000); // Refresh every 30s
    return () => {
      clearInterval(interval);
      clearInterval(refreshInterval);
    };
  }, [fetchReminders]);

  const toggleComplete = async (reminder: Reminder) => {
    try {
      const res = await fetch('/api/reminders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reminder.id, completed: !reminder.completed }),
      });
      if (res.ok) {
        setReminders(reminders.map(r => 
          r.id === reminder.id ? { ...r, completed: !r.completed } : r
        ));
      }
    } catch (err) {
      console.error('Failed to toggle:', err);
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      const res = await fetch(`/api/reminders?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReminders(reminders.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const addReminder = async () => {
    if (!newReminder.name || !newReminder.text || !newReminder.when) return;
    setSaving(true);
    
    // Parse the "when" field
    let due_at: string;
    const now = new Date();
    const whenLower = newReminder.when.toLowerCase();
    
    try {
      if (whenLower.includes('today')) {
        const timeMatch = whenLower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
        if (timeMatch) {
          let hour = parseInt(timeMatch[1]);
          const min = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
          if (timeMatch[3] === 'pm' && hour !== 12) hour += 12;
          if (timeMatch[3] === 'am' && hour === 12) hour = 0;
          const date = new Date(now);
          date.setHours(hour, min, 0, 0);
          due_at = date.toISOString();
        } else {
          setSaving(false);
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
          due_at = date.toISOString();
        } else {
          setSaving(false);
          return;
        }
      } else {
        // Try to parse as a date
        const parsed = Date.parse(newReminder.when);
        if (isNaN(parsed)) {
          setSaving(false);
          return;
        }
        due_at = new Date(parsed).toISOString();
      }

      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newReminder.name, 
          text: newReminder.text, 
          due_at,
          created_by: 'ben'
        }),
      });
      
      if (res.ok) {
        await fetchReminders();
        setNewReminder({ name: '', text: '', when: '' });
        setShowAddForm(false);
      }
    } catch (err) {
      console.error('Failed to add:', err);
    } finally {
      setSaving(false);
    }
  };

  const activeReminders = reminders.filter(r => !r.completed);
  const completedReminders = reminders.filter(r => r.completed);
  const overdueReminders = activeReminders.filter(r => new Date(r.due_at) < new Date());

  return (
    <div className="glass-panel p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <h2 className="font-medium text-white text-sm">Automation</h2>
          {overdueReminders.length > 0 && (
            <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded font-bold">
              {overdueReminders.length} overdue
            </span>
          )}
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
        <div className="mb-3 p-2 bg-slate-800/50 rounded-lg space-y-2 border border-slate-700">
          <input
            type="text"
            placeholder="Title (e.g., Call dentist)"
            value={newReminder.name}
            onChange={(e) => setNewReminder({ ...newReminder, name: e.target.value })}
            className="w-full bg-slate-900/50 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Details / message"
            value={newReminder.text}
            onChange={(e) => setNewReminder({ ...newReminder, text: e.target.value })}
            className="w-full bg-slate-900/50 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="When (3pm today, 9am tomorrow, Feb 10 2pm)"
              value={newReminder.when}
              onChange={(e) => setNewReminder({ ...newReminder, when: e.target.value })}
              className="flex-1 bg-slate-900/50 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
            <button
              onClick={addReminder}
              disabled={saving || !newReminder.name || !newReminder.text || !newReminder.when}
              className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded text-xs hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '...' : 'Save'}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-2 py-1.5 text-slate-500 hover:text-slate-300 text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-3">
        {/* Scheduled Jobs */}
        <div>
          <h3 className="text-[10px] font-medium text-slate-500 uppercase mb-1">Scheduled</h3>
          <div className="space-y-0.5">
            {SCHEDULED_JOBS.map((job, i) => (
              <div key={i} className="flex items-center justify-between py-1 px-1.5 rounded bg-slate-800/30 text-xs">
                <span className="text-slate-300 truncate flex items-center gap-1" title={job.desc}>
                  {job.name}
                  {job.model === 'opus' && (
                    <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-purple-500/20 text-purple-400 rounded text-[9px] font-medium">
                      🧠
                    </span>
                  )}
                </span>
                <span className="text-slate-500 text-[10px]">{job.schedule}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Active Reminders */}
        <div>
          <h3 className="text-[10px] font-medium text-slate-500 uppercase mb-1">
            Reminders ({activeReminders.length})
          </h3>
          <div className="space-y-0.5 max-h-[200px] overflow-y-auto">
            {loading ? (
              <div className="text-xs text-slate-500">Loading...</div>
            ) : activeReminders.length === 0 ? (
              <div className="text-xs text-slate-500 italic py-2">No active reminders</div>
            ) : (
              activeReminders.map((reminder) => {
                const isOverdue = new Date(reminder.due_at) < new Date();
                return (
                  <div 
                    key={reminder.id} 
                    className={`flex items-center justify-between py-1.5 px-1.5 rounded text-xs group ${
                      isOverdue ? 'bg-red-500/10 border border-red-500/30' : 'bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <button
                        onClick={() => toggleComplete(reminder)}
                        className="text-slate-500 hover:text-emerald-400 flex-shrink-0"
                        title="Mark complete"
                      >
                        <Circle className="w-3.5 h-3.5" />
                      </button>
                      <div className="min-w-0">
                        <div className={`truncate ${isOverdue ? 'text-red-400' : 'text-slate-300'}`}>
                          {reminder.name}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">{reminder.text}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className={`text-[10px] ${isOverdue ? 'text-red-400 font-bold' : 'text-cyan-400'}`}>
                        {formatTimeUntil(reminder.due_at)}
                      </span>
                      <span className="text-[9px] text-slate-600 w-4 text-center">
                        {reminder.created_by === 'jules' ? '🤖' : '👤'}
                      </span>
                      <button
                        onClick={() => deleteReminder(reminder.id)}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-0.5"
                        title="Delete"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Completed Reminders */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[10px] font-medium text-slate-500 uppercase">
              Completed ({completedReminders.length})
            </h3>
            {completedReminders.length > 0 && (
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="text-[10px] text-slate-600 hover:text-slate-400"
              >
                {showCompleted ? 'Hide' : 'Show'}
              </button>
            )}
          </div>
          <div className="space-y-0.5 max-h-[200px] overflow-y-auto">
            {!showCompleted ? (
              <div className="text-xs text-slate-600 italic py-2">
                {completedReminders.length} completed
              </div>
            ) : completedReminders.length === 0 ? (
              <div className="text-xs text-slate-600 italic py-2">None yet</div>
            ) : (
              completedReminders.slice(0, 10).map((reminder) => (
                <div 
                  key={reminder.id} 
                  className="flex items-center justify-between py-1 px-1.5 rounded bg-slate-800/20 text-xs group opacity-60"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <button
                      onClick={() => toggleComplete(reminder)}
                      className="text-emerald-500 flex-shrink-0"
                      title="Mark incomplete"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-slate-500 truncate line-through">{reminder.name}</span>
                  </div>
                  <button
                    onClick={() => deleteReminder(reminder.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
