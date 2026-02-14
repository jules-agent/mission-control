'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UserManagementTable } from './components/UserManagementTable';
import { ActivityLogTable } from './components/ActivityLogTable';
import { PendingInvitesTable } from './components/PendingInvitesTable';

const ADMIN_EMAIL = 'ben@unpluggedperformance.com';

export default function IdentityAdminPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);

  const supabase = createClient();

  useEffect(() => {
    checkAdminAuth();
  }, []);

  async function checkAdminAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || user.email !== ADMIN_EMAIL) {
      window.location.href = '/identity';
      return;
    }

    setIsAdmin(true);
    setLoading(false);
    await loadData();
  }

  async function loadData() {
    try {
      const [usersRes, activityRes, invitesRes] = await Promise.all([
        fetch('/api/identity/admin/users'),
        fetch('/api/identity/admin/activity'),
        fetch('/api/identity/admin/invite')
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }

      if (activityRes.ok) {
        const data = await activityRes.json();
        setActivity(data.activity || []);
      }

      if (invitesRes.ok) {
        const data = await invitesRes.json();
        setInvites(data.invites || []);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const tabs = [
    { key: 'users', label: 'Users', count: users.length },
    { key: 'activity', label: 'Activity Log', count: activity.length },
    { key: 'invites', label: 'Pending Invites', count: invites.filter(i => !i.accepted_at).length },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Identity System Admin</h1>
              <p className="text-sm text-zinc-400 mt-1">User management and system controls</p>
            </div>
            <a
              href="/identity"
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
            >
              ← Back to Identity
            </a>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-2 border-b border-zinc-800 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-[#007AFF] text-white'
                  : 'border-transparent text-zinc-400 hover:text-zinc-300'
              }`}
            >
              {tab.label}
              <span className="ml-2 text-xs opacity-60">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
          {activeTab === 'users' && (
            <UserManagementTable users={users} onUpdate={loadData} />
          )}
          {activeTab === 'activity' && (
            <ActivityLogTable activity={activity} />
          )}
          {activeTab === 'invites' && (
            <PendingInvitesTable invites={invites} onUpdate={loadData} />
          )}
        </div>
      </div>
    </div>
  );
}
