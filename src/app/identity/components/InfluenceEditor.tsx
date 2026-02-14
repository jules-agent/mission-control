'use client';

import { useState, useEffect } from 'react';

interface Influence {
  id: string;
  category_id?: string;
  name: string;
  alignment: number;
  position: number;
  mood_tags?: string[];
}

interface InfluenceEditorProps {
  influences: Influence[];
  onUpdate: (influences: Influence[]) => void;
  categoryType: string;
  categoryId: string;
  categoryName: string;
  allInfluences?: Record<string, Influence[]>;
  isAggregated?: boolean;
  onSendToAddFlow?: (interest: string, alignment: number) => void;
}

function getAlignmentColor(alignment: number): string {
  if (alignment >= 60) return '#34C759';
  if (alignment >= 40) return '#FFD60A';
  if (alignment >= 20) return '#FF9500';
  return '#FF3B30';
}

function getAlignmentDot(alignment: number): string {
  if (alignment >= 60) return '🟢';
  if (alignment >= 40) return '🟡';
  if (alignment >= 20) return '🟠';
  return '🔴';
}

export function InfluenceEditor({ influences, onUpdate, categoryType, categoryId, categoryName, allInfluences, isAggregated, onSendToAddFlow }: InfluenceEditorProps) {
  const [items, setItems] = useState(influences);
  const [editingAlignment, setEditingAlignment] = useState<string | null>(null);
  const [alignmentInput, setAlignmentInput] = useState('');
  const [showBelowThreshold, setShowBelowThreshold] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAlignment, setNewAlignment] = useState('50');
  const [newMoodTags, setNewMoodTags] = useState('');
  const [recommendation, setRecommendation] = useState<{name: string; reason: string; alignment: number} | null>(null);
  const [loadingRec, setLoadingRec] = useState(false);
  const [dismissedRecs, setDismissedRecs] = useState<string[]>([]);
  const [blockedRecs, setBlockedRecs] = useState<string[]>([]);

  // Load dismissed recs from localStorage (with 7-day expiry) + permanent blocks
  useEffect(() => {
    const key = `rec-dismissed-${categoryId}`;
    const blockKey = `rec-blocked-${categoryId}`;
    try {
      const stored = JSON.parse(localStorage.getItem(key) || '[]') as { name: string; ts: number }[];
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const valid = stored.filter(d => d.ts > weekAgo);
      if (valid.length !== stored.length) localStorage.setItem(key, JSON.stringify(valid));
      setDismissedRecs(valid.map(d => d.name));
    } catch { setDismissedRecs([]); }
    try {
      const blocked = JSON.parse(localStorage.getItem(blockKey) || '[]') as string[];
      setBlockedRecs(blocked);
    } catch { setBlockedRecs([]); }
  }, [categoryId]);

  function dismissRec(name: string) {
    const key = `rec-dismissed-${categoryId}`;
    try {
      const stored = JSON.parse(localStorage.getItem(key) || '[]') as { name: string; ts: number }[];
      stored.push({ name, ts: Date.now() });
      localStorage.setItem(key, JSON.stringify(stored));
      setDismissedRecs(prev => [...prev, name]);
    } catch {}
  }

  function blockRecPermanently(name: string) {
    const blockKey = `rec-blocked-${categoryId}`;
    try {
      const blocked = JSON.parse(localStorage.getItem(blockKey) || '[]') as string[];
      if (!blocked.includes(name)) {
        blocked.push(name);
        localStorage.setItem(blockKey, JSON.stringify(blocked));
      }
      setBlockedRecs(prev => [...prev, name]);
    } catch {}
  }

  useEffect(() => { setItems(influences); }, [influences]);

  const serving = items.filter(i => i.alignment >= 60).length;
  const displayItems = showBelowThreshold ? items : items.filter(i => i.alignment >= 60);
  const belowCount = items.length - serving;

  function moveItem(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    const reordered = [...items];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    const updated = reordered.map((item, i) => ({ ...item, position: i }));
    setItems(updated);
    onUpdate(updated);
  }

  function updateAlignment(id: string, newAlignment: number) {
    const clamped = Math.max(0, Math.min(100, newAlignment));
    const updated = items.map(item => item.id === id ? { ...item, alignment: clamped } : item);
    setItems(updated);
    onUpdate(updated);
  }

  function removeInfluence(id: string) {
    const updated = items.filter(item => item.id !== id).map((item, i) => ({ ...item, position: i }));
    setItems(updated);
    onUpdate(updated);
  }

  function addInfluence() {
    if (!newName.trim()) return;
    const tags = newMoodTags.trim() ? newMoodTags.split(',').map(t => t.trim()).filter(Boolean) : [];
    const newInfluence: Influence = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      alignment: Math.max(0, Math.min(100, parseInt(newAlignment) || 50)),
      position: items.length,
      mood_tags: tags,
    };
    const updated = [...items, newInfluence];
    setItems(updated);
    onUpdate(updated);
    setNewName('');
    setNewAlignment('50');
    setNewMoodTags('');
    setShowAddForm(false);
  }

  async function getRecommendation() {
    setLoadingRec(true);
    try {
      const res = await fetch('/api/identity/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryName,
          categoryType,
          existingInfluences: items.map(i => ({ name: i.name, alignment: i.alignment })),
          recentlyDismissed: [...dismissedRecs, ...blockedRecs],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRecommendation(data);
    } catch (err) {
      console.error('Recommendation error:', err);
      alert('Failed to get recommendation');
    } finally {
      setLoadingRec(false);
    }
  }

  function acceptRecommendation() {
    if (!recommendation) return;
    if (onSendToAddFlow) {
      // Send through the full Add Interest Flow (categorize → confirm → alignment → rank → save)
      onSendToAddFlow(recommendation.name, recommendation.alignment);
      setRecommendation(null);
    } else {
      // Fallback: add directly to current category
      const newInfluence: Influence = {
        id: crypto.randomUUID(),
        name: recommendation.name,
        alignment: recommendation.alignment,
        position: items.length,
        mood_tags: [],
      };
      const updated = [...items, newInfluence];
      setItems(updated);
      onUpdate(updated);
      setRecommendation(null);
    }
  }

  return (
    <div>
      {/* Serving threshold header */}
      {items.length > 0 && (
        <div className="flex items-center justify-between mb-2 pl-1">
          <p className="text-[13px] text-zinc-500">
            Serving {serving} of {items.length} items (threshold: 60%)
          </p>
          {belowCount > 0 && (
            <button
              onClick={() => setShowBelowThreshold(!showBelowThreshold)}
              className="text-[13px] text-[#007AFF] active:opacity-60"
            >
              {showBelowThreshold ? 'Hide Below' : `Show ${belowCount} Below`}
            </button>
          )}
        </div>
      )}

      {displayItems.length === 0 && items.length === 0 ? (
        <p className="text-[13px] text-zinc-600 py-3 pl-1">No influences yet</p>
      ) : displayItems.length === 0 ? (
        <p className="text-[13px] text-zinc-600 py-3 pl-1">All {items.length} influences below threshold</p>
      ) : (
        <div>
          {displayItems.map((influence, displayIndex) => {
            const realIndex = items.findIndex(i => i.id === influence.id);
            const color = getAlignmentColor(influence.alignment);
            return (
              <div
                key={influence.id}
                className="flex items-center min-h-[44px] group"
                style={displayIndex < displayItems.length - 1 ? { borderBottom: '0.5px solid rgba(255,255,255,0.06)' } : {}}
              >
                {/* Up/Down arrows */}
                <div className="flex flex-col mr-1 flex-shrink-0">
                  <button
                    onClick={() => moveItem(realIndex, -1)}
                    disabled={realIndex === 0}
                    className="text-zinc-500 hover:text-white disabled:opacity-20 text-[12px] leading-none p-0.5 active:opacity-60"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveItem(realIndex, 1)}
                    disabled={realIndex === items.length - 1}
                    className="text-zinc-500 hover:text-white disabled:opacity-20 text-[12px] leading-none p-0.5 active:opacity-60"
                  >
                    ▼
                  </button>
                </div>

                {/* Color dot */}
                <span className="w-[10px] h-[10px] rounded-full flex-shrink-0 mr-2" style={{ backgroundColor: color }} />

                {/* Name */}
                <span className="flex-1 text-[15px] text-white truncate mr-2">
                  {influence.name}
                  {isAggregated && influence.category_id && (
                    <span className="text-[11px] text-zinc-600 ml-1">•</span>
                  )}
                </span>

                {/* Alignment % - tappable */}
                {editingAlignment === influence.id ? (
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={alignmentInput}
                    onChange={e => setAlignmentInput(e.target.value)}
                    onBlur={() => {
                      updateAlignment(influence.id, parseInt(alignmentInput) || 0);
                      setEditingAlignment(null);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        updateAlignment(influence.id, parseInt(alignmentInput) || 0);
                        setEditingAlignment(null);
                      }
                    }}
                    className="w-14 text-right bg-zinc-800 rounded px-1 py-0.5 text-[15px] font-medium text-white focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => {
                      setEditingAlignment(influence.id);
                      setAlignmentInput(Math.round(influence.alignment).toString());
                    }}
                    className="text-[15px] font-medium tabular-nums flex-shrink-0 active:opacity-60 min-w-[40px] text-right"
                    style={{ color }}
                  >
                    {Math.round(influence.alignment)}%
                  </button>
                )}

                {/* Delete */}
                <button
                  onClick={() => removeInfluence(influence.id)}
                  className="ml-2 text-zinc-600 hover:text-red-400 active:opacity-60 text-[14px] flex-shrink-0 p-1"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3 mt-2 pl-1">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-[13px] text-[#007AFF] active:opacity-60 transition-opacity"
        >
          + Add Influence
        </button>
        <button
          onClick={getRecommendation}
          disabled={loadingRec}
          className="text-[13px] text-[#007AFF] active:opacity-60 transition-opacity disabled:opacity-40"
        >
          {loadingRec ? '⏳ Loading...' : '✨ Recommend'}
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="mt-2 p-3 bg-zinc-900/80 rounded-xl space-y-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Influence name"
            className="w-full py-2 px-3 bg-zinc-800 rounded-lg text-[15px] text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
            autoFocus
          />
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              max="100"
              value={newAlignment}
              onChange={e => setNewAlignment(e.target.value)}
              placeholder="Alignment %"
              className="w-24 py-2 px-3 bg-zinc-800 rounded-lg text-[15px] text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
            />
            <input
              type="text"
              value={newMoodTags}
              onChange={e => setNewMoodTags(e.target.value)}
              placeholder="Mood tags (comma sep)"
              className="flex-1 py-2 px-3 bg-zinc-800 rounded-lg text-[15px] text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={addInfluence}
              className="px-4 py-2 bg-[#007AFF] rounded-lg text-[15px] font-medium text-white active:opacity-80"
            >
              Add
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-[15px] text-zinc-400 active:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Recommendation card */}
      {recommendation && (
        <div className="mt-3 p-3 bg-zinc-900/80 rounded-xl border border-zinc-700/50">
          <p className="text-[13px] text-zinc-500 mb-1">✨ Recommended</p>
          <p className="text-[17px] font-semibold text-white">{recommendation.name}</p>
          <p className="text-[13px] text-zinc-400 mt-1">{recommendation.reason}</p>
          <p className="text-[13px] mt-1" style={{ color: getAlignmentColor(recommendation.alignment) }}>
            Suggested alignment: {recommendation.alignment}%
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={acceptRecommendation}
              className="px-4 py-2 bg-[#34C759] rounded-lg text-[15px] font-medium text-white active:opacity-80"
            >
              ✓ Add
            </button>
            <button
              onClick={() => {
                dismissRec(recommendation.name);
                setRecommendation(null);
                getRecommendation();
              }}
              disabled={loadingRec}
              className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-[15px] text-zinc-300 active:opacity-80 disabled:opacity-40"
            >
              {loadingRec ? '⏳' : '↻ Try Another'}
            </button>
            <button
              onClick={() => {
                blockRecPermanently(recommendation.name);
                setRecommendation(null);
                getRecommendation();
              }}
              disabled={loadingRec}
              className="px-4 py-2 bg-zinc-800 border border-red-900/40 rounded-lg text-[15px] text-red-400 active:opacity-80 disabled:opacity-40"
              title="Never recommend this again"
            >
              👎
            </button>
            <button
              onClick={() => {
                dismissRec(recommendation.name);
                setRecommendation(null);
              }}
              className="px-4 py-2 text-[15px] text-zinc-500 active:opacity-60"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
