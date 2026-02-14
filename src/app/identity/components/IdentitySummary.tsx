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
  const [hasGenerated, setHasGenerated] = useState(false);

  // Cache key
  const cacheKey = `identity-summary-${identityId}`;
  const countKey = `identity-summary-count-${identityId}`;

  useEffect(() => {
    // Load from localStorage
    const cached = localStorage.getItem(cacheKey);
    const cachedCount = localStorage.getItem(countKey);
    
    if (cached) {
      setSummary(cached);
      setHasGenerated(true);
      
      // Auto-regenerate if influence count changed significantly (±3)
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
        setHasGenerated(true);
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

  return (
    <div className="relative px-1 mb-2">
      <p className="text-[15px] leading-relaxed text-zinc-400 italic">
        {loading ? (
          <span className="animate-pulse text-zinc-600">Composing portrait...</span>
        ) : summary ? (
          <>
            {summary}
            <button
              onClick={generateSummary}
              className="ml-2 text-zinc-600 hover:text-zinc-400 active:text-zinc-300 transition-colors inline-flex items-center"
              title="Regenerate summary"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
              </svg>
            </button>
          </>
        ) : null}
      </p>
    </div>
  );
}
