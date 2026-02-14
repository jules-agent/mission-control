'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface UserStat {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  banned: boolean;
  identity_count: number;
  total_influences: number;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'invite'>('users');
  const [users, setUsers] = useState<UserStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  async function checkAdminAccess() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || user.email !== 'ben@unpluggedperformance.com') {
      router.push('/identity');
      return;
    }

    loadUsers();
  }

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await fetch('/api/identity/admin?action=users');
      if (!res.ok) {
        if (res.status === 403) {
          router.push('/identity');
          return;
        }
        throw new Error('Failed to load users');
      }
      
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  async function handleBanToggle(userId: string, currentBanned: boolean) {
    if (!confirm(currentBanned ? 'Unban this user?' : 'Ban this user?')) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/identity/admin?action=ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ban: !currentBanned })
      });

      if (!res.ok) throw new Error('Failed to update ban status');

      showMessage('success', currentBanned ? 'User unbanned' : 'User banned');
      loadUsers();
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to update ban status');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleResetPassword(userId: string, email: string) {
    const newPassword = prompt(`Enter new password for ${email} (min 6 characters):`);
    if (!newPassword) return;

    if (newPassword.length < 6) {
      showMessage('error', 'Password must be at least 6 characters');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/identity/admin?action=reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword })
      });

      if (!res.ok) throw new Error('Failed to reset password');

      showMessage('success', `Password reset for ${email}`);
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to reset password');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteUser(userId: string, email: string) {
    if (!confirm(`⚠️ DELETE user ${email}? This will delete all their identities and data. This cannot be undone.`)) return;
    
    const confirmation = prompt(`Type "${email}" to confirm deletion:`);
    if (confirmation !== email) {
      showMessage('error', 'Confirmation failed');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/identity/admin?action=delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (!res.ok) throw new Error('Failed to delete user');

      showMessage('success', `User ${email} deleted`);
      loadUsers();
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleLoginAs(userId: string, email: string) {
    if (!confirm(`Login as ${email}? Your admin session will be stored and you can return to admin.`)) return;

    setActionLoading(true);
    try {
      // Get current session tokens to store
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No admin session found');

      // Store admin session in localStorage
      localStorage.setItem('adminReturnToken', JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        admin_email: session.user.email
      }));

      // Call API to get magic link for target user
      const res = await fetch('/api/identity/admin?action=login-as', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (!res.ok) throw new Error('Failed to create user session');

      const data = await res.json();

      // Store target user info for banner
      localStorage.setItem('viewingAsUser', JSON.stringify({
        email: data.targetUser.email,
        id: data.targetUser.id
      }));

      // Navigate to the magic link (this will establish the session)
      window.location.href = data.magicLink;
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to login as user');
      setActionLoading(false);
    }
  }

  async function handleInvite() {
    if (!inviteEmail || !invitePassword) {
      showMessage('error', 'Email and password required');
      return;
    }

    if (invitePassword.length < 6) {
      showMessage('error', 'Password must be at least 6 characters');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/identity/admin?action=invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, password: invitePassword })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create user');
      }

      showMessage('success', `User ${inviteEmail} created successfully`);
      setInviteEmail('');
      setInvitePassword('');
      loadUsers();
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to create user');
    } finally {
      setActionLoading(false);
    }
  }

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  function generatePassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center" style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div className="text-zinc-500 text-[17px]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <header className="pt-[env(safe-area-inset-top)] sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-zinc-800/60">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight">Admin Panel</h1>
            <p className="text-[13px] text-zinc-500 mt-0.5">Identity System</p>
          </div>
          <button
            onClick={() => router.push('/identity')}
            className="text-[15px] text-[#007AFF] active:opacity-60 transition-opacity"
          >
            ← Back to Identity
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Message Banner */}
        {message && (
          <div className={`mb-4 px-4 py-3 rounded-xl ${
            message.type === 'success'
              ? 'bg-emerald-900/30 border border-emerald-700/50 text-emerald-300'
              : 'bg-red-900/30 border border-red-700/50 text-red-300'
          }`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg text-[15px] font-medium transition-all ${
              activeTab === 'users'
                ? 'bg-[#007AFF] text-white'
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('invite')}
            className={`px-4 py-2 rounded-lg text-[15px] font-medium transition-all ${
              activeTab === 'invite'
                ? 'bg-[#007AFF] text-white'
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            Invite User
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
            {/* Search */}
            <div className="p-4 border-b border-zinc-800">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by email..."
                className="w-full bg-zinc-800 text-white px-4 py-2 rounded-lg border border-zinc-700 focus:border-[#007AFF] focus:outline-none text-[15px]"
              />
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-zinc-800/50 text-zinc-400 text-left">
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold text-center">Joined</th>
                    <th className="px-4 py-3 font-semibold text-center">Last Login</th>
                    <th className="px-4 py-3 font-semibold text-center"># Identities</th>
                    <th className="px-4 py-3 font-semibold text-center"># Influences</th>
                    <th className="px-4 py-3 font-semibold text-center">Status</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-zinc-800/30">
                        <td className="px-4 py-3 text-white">{user.email}</td>
                        <td className="px-4 py-3 text-center text-zinc-400">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-center text-zinc-400">
                          {user.last_sign_in_at 
                            ? new Date(user.last_sign_in_at).toLocaleDateString()
                            : '—'
                          }
                        </td>
                        <td className="px-4 py-3 text-center text-zinc-300">
                          {user.identity_count}
                        </td>
                        <td className="px-4 py-3 text-center text-zinc-300">
                          {user.total_influences}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {user.banned ? (
                            <span className="inline-block px-2 py-1 bg-red-900/30 text-red-400 rounded text-[11px] font-medium">
                              Banned
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-1 bg-emerald-900/30 text-emerald-400 rounded text-[11px] font-medium">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => handleLoginAs(user.id, user.email)}
                              disabled={actionLoading}
                              className="px-2 py-1 bg-[#007AFF]/20 text-[#007AFF] hover:bg-[#007AFF]/30 rounded text-[11px] font-medium transition-colors disabled:opacity-50"
                            >
                              Login As
                            </button>
                            <button
                              onClick={() => handleBanToggle(user.id, user.banned)}
                              disabled={actionLoading}
                              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors disabled:opacity-50 ${
                                user.banned
                                  ? 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50'
                                  : 'bg-orange-900/30 text-orange-400 hover:bg-orange-900/50'
                              }`}
                            >
                              {user.banned ? 'Unban' : 'Ban'}
                            </button>
                            <button
                              onClick={() => handleResetPassword(user.id, user.email)}
                              disabled={actionLoading}
                              className="px-2 py-1 bg-amber-900/30 text-amber-400 hover:bg-amber-900/50 rounded text-[11px] font-medium transition-colors disabled:opacity-50"
                            >
                              Reset PW
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id, user.email)}
                              disabled={actionLoading}
                              className="px-2 py-1 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded text-[11px] font-medium transition-colors disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Invite Tab */}
        {activeTab === 'invite' && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h2 className="text-[17px] font-semibold mb-4">Invite New User</h2>
            
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-[13px] text-zinc-400 mb-2">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full bg-zinc-800 text-white px-4 py-2 rounded-lg border border-zinc-700 focus:border-[#007AFF] focus:outline-none text-[15px]"
                />
              </div>

              <div>
                <label className="block text-[13px] text-zinc-400 mb-2">Password</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={invitePassword}
                    onChange={(e) => setInvitePassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="flex-1 bg-zinc-800 text-white px-4 py-2 rounded-lg border border-zinc-700 focus:border-[#007AFF] focus:outline-none text-[15px] font-mono"
                  />
                  <button
                    onClick={() => setInvitePassword(generatePassword())}
                    className="px-4 py-2 bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-zinc-700 hover:border-zinc-600 text-[13px] font-medium transition-colors"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <button
                onClick={handleInvite}
                disabled={actionLoading || !inviteEmail || !invitePassword}
                className="w-full px-4 py-3 bg-[#007AFF] hover:bg-[#0071E3] active:bg-[#0064CC] text-white rounded-lg text-[15px] font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
