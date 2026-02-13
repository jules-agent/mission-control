'use client';

import { useState } from 'react';

interface InfluenceItemProps {
  influence: any;
  index: number;
  onUpdateAlignment: (id: string, alignment: number) => void;
  onDragStart: (index: number) => void;
  onDragEnd: () => void;
  onDrop: (index: number) => void;
  isDragging: boolean;
  dimmed?: boolean;
}

export default function InfluenceItem({
  influence,
  index,
  onUpdateAlignment,
  onDragStart,
  onDragEnd,
  onDrop,
  isDragging,
  dimmed = false
}: InfluenceItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(influence.alignment.toString());

  function getAlignmentColor(alignment: number): string {
    if (alignment >= 75) return 'text-green-600 dark:text-green-400';
    if (alignment >= 60) return 'text-green-500 dark:text-green-300';
    if (alignment >= 50) return 'text-yellow-500 dark:text-yellow-400';
    if (alignment >= 40) return 'text-orange-500 dark:text-orange-400';
    if (alignment >= 25) return 'text-orange-600 dark:text-orange-500';
    return 'text-red-600 dark:text-red-500';
  }

  function getAlignmentBg(alignment: number): string {
    if (alignment >= 75) return 'bg-green-100 dark:bg-green-900';
    if (alignment >= 60) return 'bg-green-50 dark:bg-green-900/50';
    if (alignment >= 50) return 'bg-yellow-50 dark:bg-yellow-900/50';
    if (alignment >= 40) return 'bg-orange-50 dark:bg-orange-900/50';
    if (alignment >= 25) return 'bg-orange-100 dark:bg-orange-900';
    return 'bg-red-100 dark:bg-red-900';
  }

  function handleAlignmentChange(delta: number) {
    const newAlignment = Math.max(0, Math.min(100, influence.alignment + delta));
    onUpdateAlignment(influence.id, parseFloat(newAlignment.toFixed(1)));
  }

  function handleEditSubmit() {
    const value = parseFloat(editValue);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      onUpdateAlignment(influence.id, parseFloat(value.toFixed(1)));
    }
    setIsEditing(false);
  }

  const colorClass = getAlignmentColor(influence.alignment);
  const bgClass = getAlignmentBg(influence.alignment);

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => onDrop(index)}
      className={`
        group relative p-4 rounded-lg border-2 transition-all cursor-move
        ${isDragging ? 'opacity-50 scale-95' : 'opacity-100'}
        ${dimmed ? 'opacity-60' : ''}
        ${bgClass}
        hover:shadow-md
      `}
    >
      <div className="flex items-center gap-4">
        {/* Drag Handle */}
        <div className="flex-shrink-0 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>

        {/* Influence Name */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white truncate">
            {influence.name}
          </h3>
          {influence.mood_tags && influence.mood_tags.length > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {influence.mood_tags.join(', ')}
            </p>
          )}
        </div>

        {/* Alignment Controls */}
        <div className="flex items-center gap-2">
          {/* Decrease Button */}
          <button
            onClick={() => handleAlignmentChange(-1)}
            className="w-8 h-8 flex items-center justify-center rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            title="Decrease 1%"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Percentage Display/Edit */}
          {isEditing ? (
            <input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleEditSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleEditSubmit()}
              className="w-20 px-2 py-1 text-center text-xl font-bold border-2 border-blue-500 rounded"
              min="0"
              max="100"
              step="0.1"
              autoFocus
            />
          ) : (
            <button
              onClick={() => {
                setIsEditing(true);
                setEditValue(influence.alignment.toString());
              }}
              className={`
                w-20 px-2 py-1 text-center text-xl font-bold rounded
                ${colorClass}
                hover:bg-white/50 dark:hover:bg-black/20 transition
              `}
            >
              {influence.alignment.toFixed(1)}%
            </button>
          )}

          {/* Increase Button */}
          <button
            onClick={() => handleAlignmentChange(1)}
            className="w-8 h-8 flex items-center justify-center rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            title="Increase 1%"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>

        {/* Menu Button */}
        <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>

      {/* Position Indicator */}
      <div className="absolute top-2 right-2 text-xs text-gray-400 font-mono">
        #{index + 1}
      </div>
    </div>
  );
}
