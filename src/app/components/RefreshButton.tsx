'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

export function RefreshButton() {
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');

  const handleRefresh = async () => {
    setRefreshing(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/refresh-usage', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage('✅ Usage data refreshed');
        // Reload the page to show updated data
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setMessage('❌ Refresh failed');
      }
    } catch (error) {
      setMessage('❌ Error refreshing');
    } finally {
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
