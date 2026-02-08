'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

export function RefreshNewsButton() {
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');

  const handleRefresh = async () => {
    setRefreshing(true);
    setMessage('Importing news...');
    
    try {
      const response = await fetch('/api/refresh-news', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage('✅ News refreshed');
        // Reload the page to show updated data
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setMessage(`❌ ${data.error || 'Refresh failed'}`);
      }
    } catch (error) {
      setMessage('❌ Error refreshing');
    } finally {
      if (!message.startsWith('✅')) {
        setTimeout(() => {
          setRefreshing(false);
          setMessage('');
        }, 3000);
      }
    }
  };

  return (
    <div className="relative flex items-center gap-2">
      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-400 transition-colors hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        title="Fetch latest news and update dashboard"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        {refreshing ? 'Refreshing...' : 'Refresh News'}
      </button>
      {message && (
        <span className="text-xs font-medium text-slate-300">
          {message}
        </span>
      )}
    </div>
  );
}
