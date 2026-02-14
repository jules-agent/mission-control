'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

interface Report {
  id: string;
  app_name: string;
  type: string;
  status: string;
  description: string;
  screenshot_url: string | null;
  user_email: string | null;
  priority: string;
  resolution_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

const APP_COLORS: Record<string, string> = {
  identity: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  dadengine: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  soundtrack: 'bg-green-500/20 text-green-300 border-green-500/30',
  storyspark: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
};

const APP_LABELS: Record<string, string> = {
  identity: 'Identity',
  dadengine: 'DadEngine',
  soundtrack: 'Soundtrack',
  storyspark: 'StorySpark',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-300',
  in_progress: 'bg-blue-500/20 text-blue-300',
  resolved: 'bg-green-500/20 text-green-300',
  rejected: 'bg-red-500/20 text-red-300',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-zinc-400',
  medium: 'text-yellow-400',
  high: 'text-orange-400',
  critical: 'text-red-400',
};

export default function AdminReportsPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [appFilter, setAppFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});

  const fetchReports = useCallback(async () => {
    const params = new URLSearchParams();
    if (appFilter !== 'all') params.set('app_name', appFilter);
    if (typeFilter !== 'all') params.set('type', typeFilter);
    if (statusFilter !== 'all') params.set('status', statusFilter);

    const res = await fetch(`/api/reports?${params}`);
    if (res.ok) {
      const data = await res.json();
      setReports(data);
    }
    setLoading(false);
  }, [appFilter, typeFilter, statusFilter]);

  useEffect(() => {
    if (authStatus === 'unauthenticated') router.push('/login');
  }, [authStatus, router]);

  useEffect(() => {
    if (authStatus === 'authenticated') fetchReports();
  }, [authStatus, fetchReports]);

  async function updateReport(id: string, updates: Partial<Report>) {
    const res = await fetch('/api/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    if (res.ok) fetchReports();
  }

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  const stats = {
    pending: reports.filter(r => r.status === 'pending').length,
    in_progress: reports.filter(r => r.status === 'in_progress').length,
    resolved_week: reports.filter(r => {
      if (r.status !== 'resolved' || !r.resolved_at) return false;
      const weekAgo = new Date(Date.now() - 7 * 86400000);
      return new Date(r.resolved_at) > weekAgo;
    }).length,
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Header */}
      <header className="border-b border-zinc-800 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">📋 App Reports</h1>
            <p className="text-xs text-zinc-500 mt-1">Bug reports &amp; feature requests across all apps</p>
          </div>
          <a href="/" className="text-xs text-zinc-500 hover:text-white transition">← Mission Control</a>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Banner */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
            <div className="text-xs text-yellow-400/70">Pending</div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.in_progress}</div>
            <div className="text-xs text-blue-400/70">In Progress</div>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.resolved_week}</div>
            <div className="text-xs text-green-400/70">Resolved This Week</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* App filter */}
          <div className="flex gap-1">
            {['all', 'identity', 'dadengine', 'soundtrack', 'storyspark'].map(app => (
              <button
                key={app}
                onClick={() => setAppFilter(app)}
                className={`px-3 py-1.5 text-xs rounded-md border transition ${
                  appFilter === app
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {app === 'all' ? 'All Apps' : APP_LABELS[app] || app}
              </button>
            ))}
          </div>
          <div className="w-px bg-zinc-800" />
          {/* Type filter */}
          <div className="flex gap-1">
            {['all', 'bug', 'feature'].map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 text-xs rounded-md border transition ${
                  typeFilter === t
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {t === 'all' ? 'All Types' : t === 'bug' ? '🐛 Bugs' : '✨ Features'}
              </button>
            ))}
          </div>
          <div className="w-px bg-zinc-800" />
          {/* Status filter */}
          <div className="flex gap-1">
            {['all', 'pending', 'in_progress', 'resolved', 'rejected'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs rounded-md border transition ${
                  statusFilter === s
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {s === 'all' ? 'All Status' : s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-2">
          {reports.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">No reports found</div>
          ) : reports.map(report => (
            <div
              key={report.id}
              className="border border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-700 transition"
            >
              {/* Report Header */}
              <button
                onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
                className="w-full px-4 py-3 flex items-center gap-3 text-left"
              >
                <span className="text-lg">{report.type === 'bug' ? '🐛' : '✨'}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${APP_COLORS[report.app_name] || 'bg-zinc-800 text-zinc-400'}`}>
                  {APP_LABELS[report.app_name] || report.app_name}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_COLORS[report.status] || ''}`}>
                  {report.status.replace('_', ' ')}
                </span>
                <span className={`text-[10px] ${PRIORITY_COLORS[report.priority] || ''}`}>
                  {report.priority}
                </span>
                <span className="flex-1 text-sm text-zinc-300 truncate">{report.description}</span>
                <span className="text-[10px] text-zinc-600 whitespace-nowrap">
                  {new Date(report.created_at).toLocaleDateString()}
                </span>
              </button>

              {/* Expanded Details */}
              {expandedId === report.id && (
                <div className="px-4 pb-4 border-t border-zinc-800 pt-3 space-y-3">
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">{report.description}</p>
                  {report.user_email && (
                    <p className="text-xs text-zinc-500">From: {report.user_email}</p>
                  )}
                  {report.screenshot_url && (
                    <a href={report.screenshot_url} target="_blank" className="text-xs text-blue-400 hover:underline">
                      View Screenshot →
                    </a>
                  )}

                  {/* Status Actions */}
                  <div className="flex gap-2 flex-wrap">
                    {['pending', 'in_progress', 'resolved', 'rejected'].map(s => (
                      <button
                        key={s}
                        onClick={() => updateReport(report.id, { status: s } as any)}
                        className={`px-3 py-1 text-xs rounded border transition ${
                          report.status === s
                            ? 'bg-white/10 border-white/30 text-white'
                            : 'border-zinc-700 text-zinc-500 hover:text-white'
                        }`}
                      >
                        {s.replace('_', ' ')}
                      </button>
                    ))}
                  </div>

                  {/* Priority */}
                  <div className="flex gap-2 items-center">
                    <span className="text-xs text-zinc-500">Priority:</span>
                    {['low', 'medium', 'high', 'critical'].map(p => (
                      <button
                        key={p}
                        onClick={() => updateReport(report.id, { priority: p } as any)}
                        className={`px-2 py-0.5 text-[10px] rounded border transition ${
                          report.priority === p
                            ? `border-white/30 ${PRIORITY_COLORS[p]}`
                            : 'border-zinc-800 text-zinc-600 hover:text-zinc-400'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  {/* Resolution Notes */}
                  <div>
                    <textarea
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-300 placeholder-zinc-600 resize-none"
                      rows={2}
                      placeholder="Resolution notes..."
                      value={editingNotes[report.id] ?? report.resolution_notes ?? ''}
                      onChange={(e) => setEditingNotes(prev => ({ ...prev, [report.id]: e.target.value }))}
                    />
                    {(editingNotes[report.id] !== undefined && editingNotes[report.id] !== (report.resolution_notes ?? '')) && (
                      <button
                        onClick={() => {
                          updateReport(report.id, { resolution_notes: editingNotes[report.id] } as any);
                          setEditingNotes(prev => { const n = { ...prev }; delete n[report.id]; return n; });
                        }}
                        className="mt-1 px-3 py-1 text-xs bg-white/10 rounded border border-white/20 text-white hover:bg-white/20"
                      >
                        Save Notes
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
