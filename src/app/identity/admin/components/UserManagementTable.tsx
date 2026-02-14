'use client';

import { useState } from 'react';

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  identities_count: number;
  influences_count: number;
  banned: boolean;
  status: string;
}

interface Props {
  users: User[];
  onUpdate: () => void;
}

export function UserManagementTable({ users, onUpdate }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState<string | null>(null);
  const [impersonating, setImpersonating] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [resetResult, setResetResult] = useState<{ userId: string; password: string } | null>(null);

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLoginAs = async (userId: string) => {
    setImpersonating(userId);
    try {
      const res = await fetch('/api/identity/admin/login-as', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('impersonation_token', data.token);
        localStorage.setItem('impersonation_target', JSON.stringify(data.targetUser));
        window.location.href = '/identity';
      } else {
        alert(data.error || 'Failed to start impersonation');
      }
    } catch (err) {
      console.error('Failed to impersonate:', err);
      alert('Failed to start impersonation');
    }
    setImpersonating(null);
  };

  const handleResetPassword = async (userId: string, action: 'send_email' | 'manual_reset') => {
    setResetResult(null);
    setMessage('');
    
    try {
      const res = await fetch('/api/identity/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        if (action === 'manual_reset' && data.tempPassword) {
          setResetResult({ userId, password: data.tempPassword });
          setMessage(`Temporary password: ${data.tempPassword}`);
        } else {
          setMessage(data.message || 'Password reset email sent!');
        }
        setUserMenuOpen(null);
      } else {
        setMessage(data.error || 'Failed to reset password');
      }
    } catch (err) {
      setMessage('Error resetting password');
    }
    
    setTimeout(() => setMessage(''), 5000);
  };

  const handleBanUser = async (userId: string, banned: boolean) => {
    const confirmMsg = banned 
      ? 'Ban this user? They will not be able to log in.'
      : 'Unban this user?';
    
    if (!confirm(confirmMsg)) return;
    
    try {
      const res = await fetch('/api/identity/admin/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, banned }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage(data.message);
        onUpdate();
      } else {
        setMessage(data.error || 'Failed to update ban status');
      }
    } catch (err) {
      setMessage('Error updating ban status');
    }
    
    setUserMenuOpen(null);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleInviteUser = async () => {
    if (!inviteEmail) return;
    
    setInviteLoading(true);
    setMessage('');
    
    try {
      const res = await fetch('/api/identity/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage(`✅ Invite created! Link: ${data.signupUrl}`);
        setInviteEmail('');
        setShowInviteForm(false);
        onUpdate();
      } else {
        setMessage(`❌ ${data.error || 'Failed to create invite'}`);
      }
    } catch (err) {
      setMessage('❌ Error creating invite');
    }
    
    setInviteLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage('Copied to clipboard!');
    setTimeout(() => setMessage(''), 2000);
  };

  return (
    <div>
      {/* Header with search and invite button */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-[#007AFF]"
          />
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="px-4 py-2 bg-[#007AFF] hover:bg-blue-600 rounded-lg text-sm font-medium transition-colors"
          >
            + Invite User
          </button>
        </div>
        
        {message && (
          <div className={`mt-3 px-4 py-2 rounded-lg text-sm ${
            message.includes('❌') || message.includes('Error') 
              ? 'bg-red-900/20 text-red-400 border border-red-800'
              : 'bg-emerald-900/20 text-emerald-400 border border-emerald-800'
          }`}>
            {message}
            <button onClick={() => setMessage('')} className="ml-3 opacity-60 hover:opacity-100">✕</button>
          </div>
        )}

        {showInviteForm && (
          <div className="mt-3 p-4 bg-zinc-800 rounded-lg border border-zinc-700">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-xs text-zinc-400 mb-1">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-[#007AFF]"
                />
              </div>
              <button
                onClick={handleInviteUser}
                disabled={inviteLoading || !inviteEmail}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
              >
                {inviteLoading ? 'Creating...' : 'Create Invite'}
              </button>
            </div>
          </div>
        )}

        {resetResult && (
          <div className="mt-3 p-4 bg-emerald-900/20 rounded-lg border border-emerald-800">
            <p className="text-sm text-emerald-400 font-medium mb-2">
              ✅ Temporary password for {users.find(u => u.id === resetResult.userId)?.email}:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-zinc-900 rounded border border-emerald-800 text-emerald-300 font-mono text-sm">
                {resetResult.password}
              </code>
              <button
                onClick={() => copyToClipboard(resetResult.password)}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 rounded text-sm transition-colors"
              >
                📋 Copy
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Users table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="px-4 py-3 text-left font-semibold text-zinc-400">User</th>
              <th className="px-4 py-3 text-center font-semibold text-zinc-400 w-24">Identities</th>
              <th className="px-4 py-3 text-center font-semibold text-zinc-400 w-24">Influences</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-400 w-32">Joined</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-400 w-32">Last Login</th>
              <th className="px-4 py-3 text-center font-semibold text-zinc-400 w-24">Status</th>
              <th className="px-4 py-3 text-center font-semibold text-zinc-400 w-20">Actions</th>
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
              filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{user.email}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{user.id.slice(0, 8)}...</div>
                  </td>
                  <td className="px-4 py-3 text-center text-zinc-300">{user.identities_count}</td>
                  <td className="px-4 py-3 text-center text-zinc-300">{user.influences_count}</td>
                  <td className="px-4 py-3 text-zinc-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      user.banned 
                        ? 'bg-red-900/50 text-red-300'
                        : 'bg-emerald-900/50 text-emerald-300'
                    }`}>
                      {user.banned ? '🚫 Banned' : '✓ Active'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center relative">
                    <button
                      onClick={() => setUserMenuOpen(userMenuOpen === user.id ? null : user.id)}
                      className="text-zinc-400 hover:text-white hover:bg-zinc-700 rounded px-2 py-1 text-lg transition-colors"
                    >
                      ⋮
                    </button>
                    {userMenuOpen === user.id && (
                      <div className="absolute right-0 top-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-[9999] min-w-[200px] py-1">
                        <button
                          onClick={() => {
                            handleLoginAs(user.id);
                            setUserMenuOpen(null);
                          }}
                          disabled={impersonating === user.id}
                          className="w-full text-left px-3 py-2 text-sm text-purple-400 hover:bg-purple-900/30 disabled:opacity-50"
                        >
                          👤 Login as User
                        </button>
                        <div className="border-t border-zinc-700 my-1" />
                        <button
                          onClick={() => handleResetPassword(user.id, 'send_email')}
                          className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
                        >
                          📧 Send Reset Email
                        </button>
                        <button
                          onClick={() => handleResetPassword(user.id, 'manual_reset')}
                          className="w-full text-left px-3 py-2 text-sm text-amber-400 hover:bg-amber-900/30"
                        >
                          🔑 Reset Password (Manual)
                        </button>
                        <div className="border-t border-zinc-700 my-1" />
                        <button
                          onClick={() => handleBanUser(user.id, !user.banned)}
                          className={`w-full text-left px-3 py-2 text-sm ${
                            user.banned
                              ? 'text-emerald-400 hover:bg-emerald-900/30'
                              : 'text-red-400 hover:bg-red-900/30'
                          }`}
                        >
                          {user.banned ? '✓ Unban User' : '🚫 Ban User'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
