'use client';

import { useState } from 'react';
import { InfluenceEditor } from './InfluenceEditor';

interface Category {
  id: string;
  identity_id: string;
  parent_id: string | null;
  name: string;
  type: string;
  level: number;
  subcategories?: Category[];
}

interface Influence {
  id: string;
  category_id?: string;
  name: string;
  alignment: number;
  position: number;
  mood_tags?: string[];
}

interface CategoryTreeProps {
  categories: Category[];
  influences: Record<string, Influence[]>;
  onAddCategory: (parentId: string | null, type: string) => void;
  onAddInfluence: (categoryId: string, name: string) => void;
  onUpdateInfluences: (categoryId: string, influences: Influence[]) => void;
  onDeleteCategory: (categoryId: string) => void;
}

function getAlignmentDotColor(alignment: number): string {
  if (alignment >= 75) return '#34C759';
  if (alignment >= 60) return '#8BD86B';
  if (alignment >= 50) return '#C0D94E';
  if (alignment >= 40) return '#FFD60A';
  if (alignment >= 25) return '#FF9500';
  return '#FF3B30';
}

export function CategoryTree({
  categories,
  influences,
  onAddCategory,
  onAddInfluence,
  onUpdateInfluences,
  onDeleteCategory
}: CategoryTreeProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [addingSubTo, setAddingSubTo] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState('');
  const [newSubType, setNewSubType] = useState('custom');
  const [addingRoot, setAddingRoot] = useState(false);
  const [newRootName, setNewRootName] = useState('');
  const [newRootType, setNewRootType] = useState('custom');

  function toggleCategory(id: string) {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function countAllInfluences(category: Category): { direct: number; total: number } {
    const direct = (influences[category.id] || []).length;
    let total = direct;
    if (category.subcategories) {
      for (const sub of category.subcategories) {
        total += countAllInfluences(sub).total;
      }
    }
    return { direct, total };
  }

  function renderInfluencePreview(categoryInfluences: Influence[]) {
    if (categoryInfluences.length === 0) return null;
    const sorted = [...categoryInfluences].sort((a, b) => a.position - b.position);
    const top3 = sorted.slice(0, 3);
    const remaining = sorted.length - 3;

    return (
      <div className="flex items-center gap-2 mt-1">
        {top3.map(inf => (
          <span key={inf.id} className="flex items-center gap-1 text-xs text-zinc-400">
            <span
              className="inline-block w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: getAlignmentDotColor(inf.alignment) }}
            />
            <span className="truncate max-w-[80px]">{inf.name}</span>
          </span>
        ))}
        {remaining > 0 && (
          <span className="text-xs text-zinc-500">+{remaining} more</span>
        )}
      </div>
    );
  }

  function renderCategory(category: Category, depth: number = 0) {
    const isExpanded = expandedCategories.has(category.id);
    const categoryInfluences = influences[category.id] || [];
    const hasSubcategories = category.subcategories && category.subcategories.length > 0;
    const { direct, total } = countAllInfluences(category);

    return (
      <div key={category.id} style={{ marginLeft: depth > 0 ? 24 : 0 }}>
        <div className="rounded-lg border border-zinc-800 overflow-hidden mb-2">
          {/* Category Header */}
          <button
            onClick={() => toggleCategory(category.id)}
            className="w-full px-4 py-3 bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="text-xl flex-shrink-0">{getCategoryIcon(category.type)}</span>
              <div className="text-left min-w-0 flex-1">
                <h3 className="font-semibold text-white">{category.name}</h3>
                {total > 0 && (
                  <p className="text-xs text-zinc-400">
                    {total} influence{total !== 1 ? 's' : ''}
                    {hasSubcategories && direct !== total
                      ? ` (${direct} direct, ${total - direct} in subcategories)`
                      : ''}
                  </p>
                )}
                {!isExpanded && renderInfluencePreview(categoryInfluences)}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <svg
                className={`w-5 h-5 text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="bg-black/40 border-t border-zinc-800">
              {/* Direct Influences */}
              <div className="p-4">
                <InfluenceEditor
                  influences={categoryInfluences}
                  onUpdate={(updated) => onUpdateInfluences(category.id, updated)}
                  categoryType={category.type}
                />
              </div>

              {/* Subcategories */}
              {hasSubcategories && (
                <div className="px-4 pb-4">
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                    Subcategories
                  </h4>
                  {category.subcategories!.map(sub => renderCategory(sub, depth + 1))}
                </div>
              )}

              {/* Actions */}
              <div className="px-4 pb-3 flex items-center gap-2">
                {addingSubTo === category.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <select
                      value={newSubType}
                      onChange={e => setNewSubType(e.target.value)}
                      className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white"
                    >
                      <option value="music">Music</option>
                      <option value="philosophy">Philosophy</option>
                      <option value="news">News</option>
                      <option value="food">Food</option>
                      <option value="custom">Custom</option>
                    </select>
                    <input
                      type="text"
                      value={newSubName}
                      onChange={e => setNewSubName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newSubName.trim()) {
                          onAddCategory(category.id, newSubType);
                          setAddingSubTo(null);
                          setNewSubName('');
                        }
                        if (e.key === 'Escape') {
                          setAddingSubTo(null);
                          setNewSubName('');
                        }
                      }}
                      placeholder="Subcategory name..."
                      className="flex-1 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white placeholder-zinc-500"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        if (newSubName.trim()) {
                          onAddCategory(category.id, newSubType);
                          setAddingSubTo(null);
                          setNewSubName('');
                        }
                      }}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => { setAddingSubTo(null); setNewSubName(''); }}
                      className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs text-white"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setAddingSubTo(category.id)}
                      className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-xs text-zinc-400 hover:text-white transition-colors"
                    >
                      + Subcategory
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${category.name}" and all its influences?`)) {
                          onDeleteCategory(category.id);
                        }
                      }}
                      className="px-2 py-1 bg-zinc-800 hover:bg-red-900/50 border border-zinc-700 hover:border-red-800 rounded text-xs text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {categories.length === 0 ? (
        <div className="text-center py-8 text-zinc-400">
          <p className="mb-4">No categories yet</p>
        </div>
      ) : (
        categories.map(category => renderCategory(category, 0))
      )}

      {/* Add Root Category */}
      {addingRoot ? (
        <div className="flex items-center gap-2 p-3 border-2 border-dashed border-zinc-700 rounded-lg">
          <select
            value={newRootType}
            onChange={e => setNewRootType(e.target.value)}
            className="px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm text-white"
          >
            <option value="music">Music</option>
            <option value="philosophy">Philosophy</option>
            <option value="news">News</option>
            <option value="food">Food</option>
            <option value="custom">Custom</option>
          </select>
          <input
            type="text"
            value={newRootName}
            onChange={e => setNewRootName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && newRootName.trim()) {
                onAddCategory(null, newRootType);
                setAddingRoot(false);
                setNewRootName('');
              }
              if (e.key === 'Escape') {
                setAddingRoot(false);
                setNewRootName('');
              }
            }}
            placeholder="Category name..."
            className="flex-1 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm text-white placeholder-zinc-500"
            autoFocus
          />
          <button
            onClick={() => {
              if (newRootName.trim()) {
                onAddCategory(null, newRootType);
                setAddingRoot(false);
                setNewRootName('');
              }
            }}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white"
          >
            Add
          </button>
          <button
            onClick={() => { setAddingRoot(false); setNewRootName(''); }}
            className="px-2 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded text-sm text-white"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAddingRoot(true)}
          className="w-full px-4 py-3 border-2 border-dashed border-zinc-700 hover:border-zinc-600 rounded-lg text-zinc-400 hover:text-zinc-300 transition-colors"
        >
          + Add Root Category
        </button>
      )}
    </div>
  );
}

function getCategoryIcon(type: string): string {
  const icons: Record<string, string> = {
    music: '🎵', philosophy: '🧠', news: '📰', food: '🍽️', custom: '⚙️',
    artists: '🎤', genres: '🎸', moods: '🌈', eras: '📅', producers: '🎚️',
    thinkers: '💭', schools: '🏛️', themes: '💡'
  };
  return icons[type] || '📁';
}
