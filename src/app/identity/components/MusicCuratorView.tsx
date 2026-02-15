'use client';

import { useState } from 'react';
import Link from 'next/link';

interface MusicCuratorViewProps {
  profile: any;
  categories: any[];
  influences: Record<string, any[]>;
}

export default function MusicCuratorView({ profile, categories, influences }: MusicCuratorViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const musicDomain = categories.find(c => c.name === 'Music' && !c.parent_id);
  const subcategories = categories.filter(c => c.parent_id === musicDomain?.id);
  
  const activeCat = selectedCategory 
    ? categories.find(c => c.id === selectedCategory)
    : null;
  
  const activeInfluences = activeCat ? (influences[activeCat.id] || []) : [];
  const filteredInfluences = searchQuery
    ? activeInfluences.filter(inf => 
        inf.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activeInfluences;
  
  // Get top artists, producers, genres for quick overview
  const topArtists = (influences[subcategories.find(c => c.name === 'Artists')?.id] || [])
    .sort((a, b) => b.alignment - a.alignment)
    .slice(0, 10);
  
  const topProducers = (influences[subcategories.find(c => c.name === 'Producers')?.id] || [])
    .sort((a, b) => b.alignment - a.alignment)
    .slice(0, 5);
  
  const topGenres = (influences[subcategories.find(c => c.name === 'Genres')?.id] || [])
    .sort((a, b) => b.alignment - a.alignment)
    .slice(0, 5);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/identity" className="text-gray-400 hover:text-white transition-colors">
              ← Back
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                🎵 Music Curator
              </h1>
              <p className="text-sm text-gray-400">Shape your music preferences for song generation</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
              Generate Morning Song
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Categories */}
          <div className="space-y-4">
            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
              <h2 className="text-lg font-bold mb-3">Music Categories</h2>
              <div className="space-y-2">
                {subcategories.map(cat => {
                  const count = (influences[cat.id] || []).length;
                  const isActive = selectedCategory === cat.id;
                  
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-purple-600 text-white'
                          : 'hover:bg-white/10 text-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{cat.name}</span>
                        <span className="text-sm text-gray-400">{count}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Quick Overview */}
            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
              <h2 className="text-lg font-bold mb-3">Top Preferences</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Top Artists</p>
                  <div className="space-y-1">
                    {topArtists.slice(0, 3).map(artist => (
                      <div key={artist.id} className="text-sm">
                        {artist.name} <span className="text-purple-400">({artist.alignment}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-gray-400 mb-1">Top Producers</p>
                  <div className="space-y-1">
                    {topProducers.slice(0, 3).map(prod => (
                      <div key={prod.id} className="text-sm">
                        {prod.name} <span className="text-purple-400">({prod.alignment}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Content - Influences */}
          <div className="lg:col-span-2">
            {!selectedCategory ? (
              <div className="bg-white/5 backdrop-blur-xl rounded-xl p-12 border border-white/10 text-center">
                <div className="text-6xl mb-4">🎵</div>
                <h2 className="text-2xl font-bold mb-2">Select a Category</h2>
                <p className="text-gray-400">Choose a music category from the left to view and edit influences</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${activeCat?.name.toLowerCase()}...`}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                {/* Influences List */}
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">{activeCat?.name}</h2>
                    <button className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm transition-colors">
                      + Add New
                    </button>
                  </div>
                  
                  {filteredInfluences.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">
                      {searchQuery ? 'No matches found' : 'No influences yet'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {filteredInfluences.map(influence => (
                        <div
                          key={influence.id}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="font-medium">{influence.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 max-w-xs bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                                  style={{ width: `${influence.alignment}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-400 w-12 text-right">
                                {influence.alignment}%
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
