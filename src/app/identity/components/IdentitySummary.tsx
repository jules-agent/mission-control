'use client';

import { useState, useEffect, useCallback } from 'react';

interface IdentitySummaryProps {
  identityId: string;
  identityName: string;
  influenceCount: number;
}

export function IdentitySummary({ identityId, identityName, influenceCount }: IdentitySummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const cacheKey = `identity-summary-${identityId}`;
  const countKey = `identity-summary-count-${identityId}`;

  useEffect(() => {
    setSummary(null);
    setExpanded(false);
    const cached = localStorage.getItem(cacheKey);
    const cachedCount = localStorage.getItem(countKey);
    
    if (cached) {
      setSummary(cached);
      const prevCount = parseInt(cachedCount || '0');
      if (Math.abs(influenceCount - prevCount) >= 3) {
        generateSummary();
      }
    } else if (influenceCount > 0) {
      generateSummary();
    }
  }, [identityId]);

  const generateSummary = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/identity/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identityId }),
      });
      const data = await res.json();
      if (data.summary) {
        setSummary(data.summary);
        localStorage.setItem(cacheKey, data.summary);
        localStorage.setItem(countKey, String(influenceCount));
      }
    } catch (err) {
      console.error('Failed to generate summary:', err);
    } finally {
      setLoading(false);
    }
  }, [identityId, influenceCount, loading]);

  if (influenceCount === 0) return null;

  // Truncate to ~60 chars for collapsed view
  const truncated = summary && summary.length > 60
    ? summary.slice(0, 60).replace(/\s+\S*$/, '') + '…'
    : summary;

  return (
    <div className="mb-1">
      {loading ? (
        <div className="flex items-center gap-2 py-1">
          <span className="text-[13px] text-zinc-600 animate-pulse italic">✨ Composing...</span>
        </div>
      ) : summary ? (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left group"
        >
          <p className={`text-[13px] leading-[1.4] text-zinc-500 italic transition-all duration-200 ${
            expanded ? '' : 'line-clamp-1'
          }`}>
            ✨ {expanded ? summary : truncated}
          </p>
          {expanded && (
            <div className="flex items-center gap-3 mt-1.5">
              <button
                onClick={(e) => { e.stopPropagation(); generateSummary(); }}
                className="text-[11px] text-zinc-600 hover:text-zinc-400 active:text-zinc-300 transition-colors flex items-center gap-1"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                </svg>
                Regenerate
              </button>
            </div>
          )}
        </button>
      ) : null}
    </div>
  );
}
