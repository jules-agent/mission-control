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

export function CategoryTree({
  categories,
  influences,
  onAddCategory,
  onAddInfluence,
  onUpdateInfluences,
  onDeleteCategory
}: CategoryTreeProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  function toggleCategory(id: string) {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function countAllInfluences(category: Category): number {
    let count = (influences[category.id] || []).length;
    if (category.subcategories) {
      for (const sub of category.subcategories) {
        count += countAllInfluences(sub);
      }
    }
    return count;
  }

  function renderCategory(category: Category, depth: number = 0) {
    const isExpanded = expandedCategories.has(category.id);
    const categoryInfluences = influences[category.id] || [];
    const hasInfluences = categoryInfluences.length > 0;
    const hasSubcategories = category.subcategories && category.subcategories.length > 0;
    const totalInfluences = countAllInfluences(category);
    const hasTotalInfluences = totalInfluences > 0;

    return (
      <div key={category.id} className="space-y-2">
        <div
          className={`rounded-lg border border-zinc-800 overflow-hidden ${
            depth > 0 ? 'ml-6' : ''
          }`}
          style={{ marginLeft: depth > 0 ? `${depth * 24}px` : 0 }}
        >
          {/* Category Header */}
          <button
            onClick={() => toggleCategory(category.id)}
            className="w-full px-4 py-3 bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getCategoryIcon(category.type)}</span>
              <div className="text-left">
                <h3 className="font-semibold">{category.name}</h3>
                {hasTotalInfluences && (
                  <p className="text-xs text-zinc-400">
                    {totalInfluences} influence{totalInfluences !== 1 ? 's' : ''}
                    {hasSubcategories && categoryInfluences.length !== totalInfluences
                      ? ` (${categoryInfluences.length} direct, ${totalInfluences - categoryInfluences.length} in subcategories)`
                      : ''}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const type = prompt('Category type (music/philosophy/news/food/custom):');
                  if (type) onAddCategory(category.id, type);
                }}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
              >
                + Sub
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete "${category.name}"?`)) {
                    onDeleteCategory(category.id);
                  }
                }}
                className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
              >
                Delete
              </button>
              <svg
                className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {/* Category Content */}
          {isExpanded && (
            <div className="p-4 bg-zinc-900/30">
              <InfluenceEditor
                influences={categoryInfluences}
                onUpdate={(updated) => onUpdateInfluences(category.id, updated)}
                categoryType={category.type}
              />

              {/* Subcategories */}
              {hasSubcategories && (
                <div className="mt-6 space-y-2">
                  <h4 className="text-sm font-semibold text-zinc-400">Subcategories</h4>
                  {category.subcategories!.map(sub => renderCategory(sub, depth + 1))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {categories.length === 0 ? (
        <div className="text-center py-8 text-zinc-400">
          <p className="mb-4">No categories yet</p>
          <button
            onClick={() => {
              const type = prompt('Category type (music/philosophy/news/food/custom):');
              if (type) onAddCategory(null, type);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors"
          >
            + Add Category
          </button>
        </div>
      ) : (
        <>
          {categories.map(category => renderCategory(category, 0))}
          <button
            onClick={() => {
              const type = prompt('Category type (music/philosophy/news/food/custom):');
              if (type) onAddCategory(null, type);
            }}
            className="w-full px-4 py-3 border-2 border-dashed border-zinc-700 hover:border-zinc-600 rounded-lg text-zinc-400 hover:text-zinc-300 transition-colors"
          >
            + Add Root Category
          </button>
        </>
      )}
    </div>
  );
}

function getCategoryIcon(type: string): string {
  const icons: Record<string, string> = {
    music: '🎵',
    philosophy: '🧠',
    news: '📰',
    food: '🍽️',
    custom: '⚙️',
    artists: '🎤',
    genres: '🎸',
    moods: '🌈',
    eras: '📅',
    producers: '🎚️',
    thinkers: '💭',
    schools: '🏛️',
    themes: '💡'
  };
  return icons[type] || '📁';
}
