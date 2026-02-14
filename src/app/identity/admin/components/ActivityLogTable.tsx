'use client';

import { useState } from 'react';

interface ActivityItem {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  user_id: string;
  user_email: string;
  created_at: string;
  details?: any;
}

interface Props {
  activity: ActivityItem[];
}

export function ActivityLogTable({ activity }: Props) {
  const [filterEmail, setFilterEmail] = useState('');

  const filteredActivity = activity.filter(item =>
    item.user_email.toLowerCase().includes(filterEmail.toLowerCase()) ||
    item.entity_name.toLowerCase().includes(filterEmail.toLowerCase())
  );

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'created_identity': return '✨ Created Identity';
      case 'added_influence': return '➕ Added Influence';
      case 'removed_influence': return '➖ Removed Influence';
      case 'updated_profile': return '✏️ Updated Profile';
      default: return action;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created_identity': return 'text-emerald-400';
      case 'added_influence': return 'text-blue-400';
      case 'removed_influence': return 'text-red-400';
      case 'updated_profile': return 'text-amber-400';
      default: return 'text-zinc-400';
    }
  };

  return (
    <div>
      {/* Search */}
      <div className="p-4 border-b border-zinc-800">
        <input
          type="text"
          placeholder="Filter by email or entity name..."
          value={filterEmail}
          onChange={(e) => setFilterEmail(e.target.value)}
          className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-[#007AFF]"
        />
      </div>

      {/* Activity log */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="px-4 py-3 text-left font-semibold text-zinc-400 w-40">Action</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-400">Entity</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-400">User</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-400 w-32">Date</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-400">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filteredActivity.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  No activity found
                </td>
              </tr>
            ) : (
              filteredActivity.map(item => (
                <tr key={item.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`font-medium ${getActionColor(item.action)}`}>
                      {getActionLabel(item.action)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{item.entity_name}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{item.entity_type}</div>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{item.user_email}</td>
                  <td className="px-4 py-3 text-zinc-400">
                    {new Date(item.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {item.details && (
                      <div className="max-w-xs truncate">
                        {JSON.stringify(item.details)}
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
