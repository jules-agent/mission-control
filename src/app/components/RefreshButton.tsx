'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

export function RefreshButton() {
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');

  const handleRefresh = async () => {
    setRefreshing(true);
    setMessage('Triggering sync...');
    
    try {
      const response = await fetch('/api/refresh-usage', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage('✅ Sync triggered - reloading in 30s...');
        // Wait for sync to complete, then reload
        setTimeout(() => window.location.reload(), 30000);
      } else if (data.autoSync) {
        // Gateway not accessible - auto-sync is active
        setMessage('⏱️ Auto-syncs every 30 min');
        setTimeout(() => {
          setRefreshing(false);
          setMessage('');
        }, 3000);
      } else {
        setMessage(`❌ ${data.error || 'Failed'}`);
        setTimeout(() => {
          setRefreshing(false);
          setMessage('');
        }, 3000);
      }
    } catch (error) {
      setMessage('❌ Error refreshing');
      setTimeout(() => {
        setRefreshing(false);
        setMessage('');
      }, 3000);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        title="Refresh usage data from OpenClaw"
      >
        <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
        {refreshing ? 'SYNCING...' : '🔄 REFRESH'}
      </button>
      {message && (
        <div className="absolute top-full mt-1 left-0 whitespace-nowrap text-[10px] font-medium">
          {message}
        </div>
      )}
    </div>
  );
}
