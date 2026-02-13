'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Identity {
  id: string;
  name: string;
  is_base: boolean;
  created_at: string;
  stats: {
    categories: number;
    influences: number;
  };
}

export default function DemoPage() {
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadIdentities();
  }, []);

  async function loadIdentities() {
    try {
      const response = await fetch('/api/identity/demo');
      if (!response.ok) throw new Error('Failed to load identities');
      
      const data = await response.json();
      setIdentities(data.identities);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading identities...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Master Identity System - Demo</h1>
            <Link
              href="/identity"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
            >
              Full Version (Login Required)
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Identity Profiles</h2>
          <p className="text-zinc-400">
            Hierarchical preference system with {identities.reduce((sum, i) => sum + i.stats.categories, 0)} categories 
            and {identities.reduce((sum, i) => sum + i.stats.influences, 0)} influences across {identities.length} profiles
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {identities.map((identity) => (
            <div
              key={identity.id}
              className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-1">{identity.name}</h3>
                  <p className="text-sm text-zinc-500">
                    {new Date(identity.created_at).toLocaleDateString()}
                  </p>
                </div>
                {identity.is_base && (
                  <span className="px-3 py-1 bg-blue-600/20 text-blue-400 text-xs font-medium rounded-full">
                    Base
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 px-4 bg-zinc-800/50 rounded-lg">
                  <span className="text-zinc-400">Categories</span>
                  <span className="text-2xl font-bold text-blue-400">
                    {identity.stats.categories}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 px-4 bg-zinc-800/50 rounded-lg">
                  <span className="text-zinc-400">Influences</span>
                  <span className="text-2xl font-bold text-green-400">
                    {identity.stats.influences}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800">
                <p className="text-xs text-zinc-500">
                  ID: <code className="text-zinc-400">{identity.id}</code>
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-zinc-900 rounded-xl border border-zinc-800 p-8">
          <h3 className="text-xl font-semibold mb-4">About Master Identity System</h3>
          <div className="space-y-4 text-zinc-300">
            <p>
              A hierarchical preference engine that cascades user identity across all tools (music, news, food, etc.)
            </p>
            <ul className="list-disc list-inside space-y-2 text-zinc-400">
              <li>Percentage-based weighting (0-100%)</li>
              <li>Unlimited nesting depth</li>
              <li>60% serving threshold for recommendations</li>
              <li>Context-aware matching (time of day, mood, activity)</li>
              <li>20-day recency tracking with unplayed boost (1.5×)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
