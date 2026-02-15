'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
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

interface CategorySuggestion {
  name: string;
  reason: string;
  type: string;
}

interface CategoryTreeProps {
  identityId?: string;
  categories: Category[];
  influences: Record<string, Influence[]>;
  onAddCategory: (parentId: string | null, type: string, suggestedName?: string) => void;
  onAddInfluence: (categoryId: string, name: string) => void;
  onUpdateInfluences: (categoryId: string, influences: Influence[]) => void;
  onDeleteCategory: (categoryId: string) => void;
  onSendToAddFlow?: (interest: string, alignment: number, sourceCategory?: string) => void;
}

function getAlignmentDotColor(alignment: number): string {
  if (alignment >= 60) return '#34C759';
  if (alignment >= 40) return '#FFD60A';
  if (alignment >= 20) return '#FF9500';
  return '#FF3B30';
}

function getCategoryIcon(type: string): string {
  const icons: Record<string, string> = {
    music: '🎵', philosophy: '🧠', news: '📰', food: '🍽️', custom: '⚙️',
    artists: '🎤', genres: '🎸', moods: '🌈', eras: '📅', producers: '🎚️',
    thinkers: '💭', schools: '🏛️', themes: '💡',
    business: '💼', communication: '💬', entertainment: '🎬', intellectual: '📚',
    daily: '☀️', values: '⭐', parenting: '👶',
    fashion: '👔', brands: '🏷️', aesthetic: '🎨', accessories: '💍',
    books: '📚', gaming: '🎮', home: '🏠', kitchen: '🍳', fitness: '🏋️',
    art: '🎨', kids: '🧸', automotive: '🚗', gifts: '🎁',
  };
  return icons[type] || '📁';
}

/** Recursively collect ALL influences from a category and all descendants */
function getAllInfluencesForCategory(category: Category, influences: Record<string, Influence[]>): Influence[] {
  let all: Influence[] = [];
  // Add direct influences with category_id preserved
  const direct = (influences[category.id] || []).map(inf => ({ ...inf, category_id: category.id }));
  all = all.concat(direct);
  // Recurse into subcategories
  if (category.subcategories) {
    for (const sub of category.subcategories) {
      all = all.concat(getAllInfluencesForCategory(sub, influences));
    }
  }
  return all;
}

/** Flatten all categories recursively */
function flattenCategories(cats: Category[]): { id: string; name: string; parent_id: string | null; type: string }[] {
  const result: { id: string; name: string; parent_id: string | null; type: string }[] = [];
  function walk(list: Category[]) {
    for (const c of list) {
      result.push({ id: c.id, name: c.name, parent_id: c.parent_id, type: c.type });
      if (c.subcategories) walk(c.subcategories);
    }
  }
  walk(cats);
  return result;
}

export function CategoryTree({
  identityId, categories, influences, onAddCategory, onAddInfluence, onUpdateInfluences, onDeleteCategory, onSendToAddFlow
}: CategoryTreeProps) {
  const allCategoriesFlat = flattenCategories(categories);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [suggestions, setSuggestions] = useState<{ parentId: string | null; items: CategorySuggestion[] } | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState<string | null>(null); // parentId or 'root'

  async function suggestCategories(parentId: string | null, parentName?: string) {
    if (!identityId) return;
    const key = parentId || 'root';
    setLoadingSuggestions(key);
    setSuggestions(null);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/identity/suggest-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ identityId, parentCategoryId: parentId, parentCategoryName: parentName }),
      });
      const data = await res.json();
      setSuggestions({ parentId, items: data.suggestions || [] });
    } catch (err) {
      console.error('Suggest error:', err);
    } finally {
      setLoadingSuggestions(null);
    }
  }

  function acceptSuggestion(suggestion: CategorySuggestion, parentId: string | null) {
    onAddCategory(parentId, suggestion.type || 'custom', suggestion.name);
    setSuggestions(prev => prev ? { ...prev, items: prev.items.filter(s => s.name !== suggestion.name) } : null);
  }

  function toggleCategory(id: string) {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function countAllInfluences(category: Category): number {
    let total = (influences[category.id] || []).length;
    if (category.subcategories) {
      for (const sub of category.subcategories) total += countAllInfluences(sub);
    }
    return total;
  }

  function renderInfluencePreviewDots(allInfs: Influence[]) {
    if (allInfs.length === 0) return null;
    const sorted = [...allInfs].sort((a, b) => b.alignment - a.alignment);
    const top5 = sorted.slice(0, 5);
    return (
      <div className="flex items-center gap-0.5">
        {top5.map((inf, i) => (
          <span
            key={inf.id + '-' + i}
            className="w-[5px] h-[5px] rounded-full"
            style={{ backgroundColor: getAlignmentDotColor(inf.alignment) }}
          />
        ))}
      </div>
    );
  }

  function renderCategory(category: Category, index: number, total: number, depth: number = 0) {
    const isExpanded = expandedCategories.has(category.id);
    const hasSubcategories = category.subcategories && category.subcategories.length > 0;
    const influenceCount = countAllInfluences(category);
    const isLast = index === total - 1;

    // Bubble-up: aggregate ALL influences from this category + all descendants
    const aggregatedInfluences = getAllInfluencesForCategory(category, influences);
    const hasChildren = hasSubcategories;
    // For leaf categories, use direct influences for editing
    const directInfluences = influences[category.id] || [];
    // Determine if we show aggregated (parent) or direct (leaf)
    const isLeaf = !hasSubcategories;
    const displayInfluences = isLeaf ? directInfluences : aggregatedInfluences;

    return (
      <div key={category.id}>
        {/* Category row */}
        <button
          onClick={() => toggleCategory(category.id)}
          className="w-full flex items-center min-h-[48px] active:bg-zinc-800/60 transition-colors"
          style={{ paddingLeft: depth > 0 ? 16 : 0 }}
        >
          <div
            className="flex items-center gap-3 py-3 flex-1 pr-4"
            style={!isLast ? { borderBottom: '0.5px solid rgba(255,255,255,0.08)' } : {}}
          >
            <span className="text-[20px] w-8 text-center flex-shrink-0">{getCategoryIcon(category.type)}</span>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[17px] font-semibold text-white truncate">{category.name}</p>
              <p className="text-[13px] text-zinc-500">
                {influenceCount} influence{influenceCount !== 1 ? 's' : ''}
                {hasChildren && !isLeaf && (
                  <span className="text-zinc-600"> (aggregated)</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!isExpanded && renderInfluencePreviewDots(aggregatedInfluences)}
              <svg
                className={`w-[14px] h-[14px] text-zinc-500 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </div>
        </button>

        {/* Expanded content */}
        <div
          className="overflow-hidden transition-all duration-300 ease-out"
          style={{
            maxHeight: isExpanded ? '10000px' : '0px',
            opacity: isExpanded ? 1 : 0,
          }}
        >
          <div className="pl-4 pr-0">
            {/* Influences — for parent categories, show aggregated read-only style; for leaf, show editable */}
            {isLeaf ? (
              <InfluenceEditor
                influences={directInfluences}
                onUpdate={(updated) => onUpdateInfluences(category.id, updated)}
                categoryType={category.type}
                categoryId={category.id}
                categoryName={category.name}
                onSendToAddFlow={onSendToAddFlow}
                allCategories={allCategoriesFlat}
                onMoveInfluence={(influenceId, fromCatId, toCatIds, name) => {
                  // Copy influence to additional categories
                  for (const toCatId of toCatIds) {
                    const existing = influences[toCatId] || [];
                    const newInf: Influence = {
                      id: crypto.randomUUID(),
                      name,
                      alignment: 75,
                      position: existing.length,
                      mood_tags: [],
                    };
                    onUpdateInfluences(toCatId, [...existing, newInf]);
                  }
                }}
              />
            ) : (
              <InfluenceEditor
                influences={aggregatedInfluences}
                onUpdate={(updated) => {
                  // For aggregated view: group updates by category_id and save each
                  const byCat: Record<string, Influence[]> = {};
                  updated.forEach(inf => {
                    const catId = inf.category_id || category.id;
                    if (!byCat[catId]) byCat[catId] = [];
                    byCat[catId].push(inf);
                  });
                  // Re-index positions per category
                  Object.entries(byCat).forEach(([catId, infs]) => {
                    const reindexed = infs.map((inf, i) => ({ ...inf, position: i }));
                    onUpdateInfluences(catId, reindexed);
                  });
                }}
                categoryType={category.type}
                categoryId={category.id}
                categoryName={category.name}
                allInfluences={influences}
                isAggregated={true}
                onSendToAddFlow={onSendToAddFlow}
                allCategories={allCategoriesFlat}
                onMoveInfluence={(influenceId, fromCatId, toCatIds, name) => {
                  for (const toCatId of toCatIds) {
                    const existing = influences[toCatId] || [];
                    const newInf: Influence = {
                      id: crypto.randomUUID(),
                      name,
                      alignment: 75,
                      position: existing.length,
                      mood_tags: [],
                    };
                    onUpdateInfluences(toCatId, [...existing, newInf]);
                  }
                }}
              />
            )}

            {/* Subcategories */}
            {hasSubcategories && (
              <div className="mt-3 mb-2">
                <p className="text-[13px] text-zinc-500 font-medium uppercase tracking-wider mb-1 pl-1">
                  Subcategories
                </p>
                <div className="bg-zinc-900/60 rounded-xl overflow-hidden ml-0">
                  {category.subcategories!.map((sub, i) =>
                    renderCategory(sub, i, category.subcategories!.length, depth + 1)
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 py-3 pl-1">
              <button
                onClick={(e) => { e.stopPropagation(); onAddCategory(category.id, category.type); }}
                className="text-[13px] text-[#007AFF] active:opacity-60 transition-opacity"
              >
                + Subcategory
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); suggestCategories(category.id, category.name); }}
                disabled={loadingSuggestions === category.id}
                className="text-[13px] text-[#007AFF] active:opacity-60 transition-opacity disabled:opacity-40"
              >
                {loadingSuggestions === category.id ? '⏳' : '✨ Suggest'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete "${category.name}" and all its influences?`)) onDeleteCategory(category.id);
                }}
                className="text-[13px] text-red-400 active:opacity-60 transition-opacity"
              >
                Delete
              </button>
            </div>
          </div>

            {/* AI Suggestions for this category */}
            {suggestions && suggestions.parentId === category.id && suggestions.items.length > 0 && (
              <div className="mt-2 mb-1 space-y-2 pl-1">
                <p className="text-[12px] text-zinc-500 uppercase tracking-wider font-medium">✨ Suggested subcategories</p>
                {suggestions.items.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-zinc-800/60 rounded-xl border border-zinc-700/40">
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="text-[14px] font-medium text-white">{s.name}</p>
                      <p className="text-[12px] text-zinc-500">{s.reason}</p>
                    </div>
                    <button
                      onClick={() => acceptSuggestion(s, category.id)}
                      className="px-3 py-1.5 bg-[#007AFF] rounded-lg text-[13px] font-medium text-white active:opacity-80 flex-shrink-0"
                    >
                      + Add
                    </button>
                  </div>
                ))}
                <button onClick={() => setSuggestions(null)} className="text-[12px] text-zinc-600 active:opacity-60">Dismiss</button>
              </div>
            )}
          </div>

          {/* Separator after expanded */}
          <div className="h-px bg-zinc-800/60 mx-4" />
        </div>
      </div>
    );
  }

  return (
    <div>
      {categories.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-zinc-500 text-[17px]">No categories yet</p>
        </div>
      ) : (
        <div className="bg-zinc-900/80 rounded-xl overflow-hidden">
          {categories.map((category, i) => renderCategory(category, i, categories.length, 0))}
        </div>
      )}

      {/* Add Root Category */}
      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          onClick={() => onAddCategory(null, 'custom')}
          className="text-[15px] text-[#007AFF] active:opacity-60 transition-opacity inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Category
        </button>
        <button
          onClick={() => suggestCategories(null)}
          disabled={loadingSuggestions === 'root'}
          className="text-[15px] text-[#007AFF] active:opacity-60 transition-opacity disabled:opacity-40 inline-flex items-center gap-1"
        >
          {loadingSuggestions === 'root' ? '⏳ Thinking...' : '✨ Suggest'}
        </button>
      </div>

      {/* Root-level AI Suggestions */}
      {suggestions && suggestions.parentId === null && suggestions.items.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-[13px] text-zinc-500 uppercase tracking-wider font-medium text-center">✨ Suggested categories</p>
          {suggestions.items.map((s, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-zinc-900/80 rounded-xl border border-zinc-700/40">
              <div className="flex-1 min-w-0 mr-3">
                <p className="text-[15px] font-medium text-white">{s.name}</p>
                <p className="text-[13px] text-zinc-500">{s.reason}</p>
              </div>
              <button
                onClick={() => acceptSuggestion(s, null)}
                className="px-4 py-2 bg-[#007AFF] rounded-lg text-[14px] font-medium text-white active:opacity-80 flex-shrink-0"
              >
                + Add
              </button>
            </div>
          ))}
          <div className="text-center">
            <button onClick={() => setSuggestions(null)} className="text-[13px] text-zinc-600 active:opacity-60">Dismiss</button>
          </div>
        </div>
      )}
    </div>
  );
}
