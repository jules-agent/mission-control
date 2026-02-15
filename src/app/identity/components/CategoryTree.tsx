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

export function CategoryTree({
  categories, influences, onAddCategory, onAddInfluence, onUpdateInfluences, onDeleteCategory, onSendToAddFlow
}: CategoryTreeProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

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
      <div className="mt-6 text-center">
        <button
          onClick={() => onAddCategory(null, 'custom')}
          className="text-[15px] text-[#007AFF] active:opacity-60 transition-opacity inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Category
        </button>
      </div>
    </div>
  );
}
