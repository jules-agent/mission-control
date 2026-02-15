'use client';

import { useState } from 'react';
import Link from 'next/link';

interface NewsCuratorViewProps {
  profile: any;
  categories: any[];
  influences: Record<string, any[]>;
  newsCategory: any;
}

const NEWS_TOPICS = [
  { id: 'tesla-ev', name: 'Tesla/EV', emoji: '⚡', color: 'from-red-500 to-orange-500' },
  { id: 'crypto', name: 'Crypto/Markets', emoji: '₿', color: 'from-yellow-500 to-orange-500' },
  { id: 'tech-ai', name: 'Tech/AI', emoji: '🤖', color: 'from-blue-500 to-purple-500' },
  { id: 'business', name: 'Business', emoji: '💼', color: 'from-green-500 to-blue-500' },
  { id: 'whisky', name: 'Whisky Investing', emoji: '🥃', color: 'from-amber-700 to-amber-900' },
  { id: 'jdm', name: 'JDM/Automotive', emoji: '🏎️', color: 'from-gray-500 to-gray-700' },
];

export default function NewsCuratorView({ profile, categories, influences, newsCategory }: NewsCuratorViewProps) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [relevanceThreshold, setRelevanceThreshold] = useState(60);
  
  const newsSources = newsCategory ? (influences[newsCategory.id] || []) : [];
  
  // Get topic-specific stats (would need to tag influences with topics in real impl)
  const topicStats = NEWS_TOPICS.map(topic => ({
    ...topic,
    sourceCount: newsSources.length, // Placeholder
    avgRelevance: 75, // Placeholder
  }));
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-900 to-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/identity" className="text-gray-400 hover:text-white transition-colors">
              ← Back
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                📰 News Curator
              </h1>
              <p className="text-sm text-gray-400">Configure relevance filtering for morning reports</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-gray-400">Relevance Threshold</div>
              <div className="text-lg font-bold">{relevanceThreshold}%</div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={relevanceThreshold}
              onChange={(e) => setRelevanceThreshold(parseInt(e.target.value))}
              className="w-32"
            />
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Topic Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {topicStats.map(topic => (
            <button
              key={topic.id}
              onClick={() => setSelectedTopic(topic.id === selectedTopic ? null : topic.id)}
              className={`bg-gradient-to-br ${topic.color} p-6 rounded-xl text-left transition-all ${
                selectedTopic === topic.id
                  ? 'ring-4 ring-white/50 scale-105'
                  : 'hover:scale-102'
              }`}
            >
              <div className="text-4xl mb-2">{topic.emoji}</div>
              <h3 className="text-xl font-bold mb-1">{topic.name}</h3>
              <div className="flex items-center gap-4 text-sm">
                <span>{topic.sourceCount} sources</span>
                <span>·</span>
                <span>{topic.avgRelevance}% avg relevance</span>
              </div>
            </button>
          ))}
        </div>
        
        {/* News Sources */}
        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">News Sources</h2>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
              + Add Source
            </button>
          </div>
          
          {newsSources.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-6xl mb-4">📰</div>
              <p>No news sources configured yet</p>
              <p className="text-sm mt-2">Add sources to customize your morning report</p>
            </div>
          ) : (
            <div className="space-y-3">
              {newsSources
                .sort((a, b) => b.alignment - a.alignment)
                .map(source => (
                  <div
                    key={source.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-lg">{source.name}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 max-w-md bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${source.alignment}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-400 w-12 text-right">
                          {source.alignment}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {source.alignment >= relevanceThreshold ? (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                          INCLUDED
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs">
                          FILTERED
                        </span>
                      )}
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        ✏️
                      </button>
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-red-400">
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
        
        {/* Preview */}
        <div className="mt-8 bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
          <h2 className="text-xl font-bold mb-4">Morning Report Preview</h2>
          <div className="bg-black/50 rounded-lg p-4 font-mono text-sm">
            <div className="text-green-400">📰 Morning News Summary (Simulated)</div>
            <div className="mt-2 text-gray-400">
              Based on your {relevanceThreshold}% threshold, the following sources will be included:
            </div>
            <ul className="mt-2 space-y-1">
              {newsSources
                .filter(s => s.alignment >= relevanceThreshold)
                .slice(0, 5)
                .map(source => (
                  <li key={source.id} className="text-blue-400">
                    • {source.name} ({source.alignment}% relevance)
                  </li>
                ))}
            </ul>
            {newsSources.filter(s => s.alignment >= relevanceThreshold).length === 0 && (
              <div className="text-yellow-400 mt-2">
                ⚠️ No sources meet the threshold. Lower it to see more content.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
