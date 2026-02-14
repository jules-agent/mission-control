'use client';

import { useState } from 'react';

interface Invite {
  id: string;
  email: string;
  invite_token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  invited_by: string;
}

interface Props {
  invites: Invite[];
  onUpdate: () => void;
}

export function PendingInvitesTable({ invites, onUpdate }: Props) {
  const [message, setMessage] = useState('');

  const copyInviteLink = (invite: Invite) => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jules3000.com';
    const signupUrl = `${baseUrl}/identity/login?email=${encodeURIComponent(invite.email)}&invite=${invite.invite_token}`;
    
    navigator.clipboard.writeText(signupUrl);
    setMessage('Invite link copied to clipboard!');
    setTimeout(() => setMessage(''), 3000);
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();
  const isAccepted = (acceptedAt: string | null) => !!acceptedAt;

  const getStatus = (invite: Invite) => {
    if (isAccepted(invite.accepted_at)) return 'accepted';
    if (isExpired(invite.expires_at)) return 'expired';
    return 'pending';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <span className="px-2 py-1 bg-emerald-900/50 text-emerald-300 rounded text-xs font-medium">✅ Accepted</span>;
      case 'expired':
        return <span className="px-2 py-1 bg-red-900/50 text-red-300 rounded text-xs font-medium">⏰ Expired</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded text-xs font-medium">⏳ Pending</span>;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <h3 className="text-lg font-semibold">Pending Invitations</h3>
        <p className="text-sm text-zinc-400 mt-1">
          Track and manage user invitations
        </p>
        
        {message && (
          <div className="mt-3 px-4 py-2 bg-emerald-900/20 text-emerald-400 border border-emerald-800 rounded-lg text-sm">
            {message}
            <button onClick={() => setMessage('')} className="ml-3 opacity-60 hover:opacity-100">✕</button>
          </div>
        )}
      </div>

      {/* Invites table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="px-4 py-3 text-left font-semibold text-zinc-400">Email</th>
              <th className="px-4 py-3 text-center font-semibold text-zinc-400 w-28">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-400 w-32">Created</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-400 w-32">Expires</th>
              <th className="px-4 py-3 text-center font-semibold text-zinc-400 w-32">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {invites.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  No pending invitations
                </td>
              </tr>
            ) : (
              invites.map(invite => {
                const status = getStatus(invite);
                
                return (
                  <tr key={invite.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{invite.email}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">Token: {invite.invite_token.slice(0, 12)}...</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(status)}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {new Date(invite.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {new Date(invite.expires_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => copyInviteLink(invite)}
                        className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs transition-colors"
                      >
                        📋 Copy Link
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
