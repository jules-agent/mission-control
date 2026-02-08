/**
 * Work Log Panel - Database-backed work log
 * 
 * Entries are stored in Supabase `work_log` table.
 * 
 * To add a new entry manually:
 *   curl -X POST https://mission-control-xxx.vercel.app/api/work-log \
 *     -H "Content-Type: application/json" \
 *     -d '{"date": "2/8/2026", "time": "10:57 AM", "text": "Your log entry here"}'
 * 
 * Or programmatically:
 *   fetch('/api/work-log', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ date: '2/8/2026', time: '10:57 AM', text: 'Entry text' })
 *   })
 */
'use client';

import { useState, useEffect } from 'react';
import { X, FileText, Loader2 } from 'lucide-react';

interface LogEntry {
  id: string;
  date: string;
  time: string;
  text: string;
  created_at: string;
}

export function LogButton() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/work-log');
      const data = await res.json();
      setEntries(data);
    } catch (err) {
      console.error('Failed to fetch work log:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchEntries();
  }, [open]);

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
                <span className="text-xs text-slate-500">
                  {loading ? '...' : `${entries.length} entries`}
                </span>
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
              {loading ? (
                <div className="flex items-center justify-center py-12 text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Loading...
                </div>
              ) : (
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <div key={entry.id} className="flex gap-3 py-2 border-b border-slate-800/50 last:border-0">
                      <div className="flex-shrink-0 text-[11px] text-slate-500 font-mono w-28">
                        {entry.date} {entry.time}
                      </div>
                      <div className="text-sm text-slate-300">• {entry.text}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
