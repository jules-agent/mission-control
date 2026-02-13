'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Influence {
  id: string;
  category_id?: string;
  name: string;
  alignment: number; // 0-100
  position: number;
  mood_tags?: string[];
}

interface InfluenceEditorProps {
  influences: Influence[];
  onUpdate: (influences: Influence[]) => void;
  categoryType: string;
}

export function InfluenceEditor({ influences, onUpdate, categoryType }: InfluenceEditorProps) {
  const [items, setItems] = useState(influences);
  const [editingId, setEditingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setItems(influences);
  }, [influences]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);

        const reordered = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
          ...item,
          position: index
        }));

        onUpdate(reordered);
        return reordered;
      });
    }
  }

  function updateAlignment(id: string, newAlignment: number) {
    const updated = items.map(item =>
      item.id === id ? { ...item, alignment: Math.max(0, Math.min(100, newAlignment)) } : item
    );
    setItems(updated);
    onUpdate(updated);
  }

  function addInfluence() {
    const name = prompt(`Add ${categoryType} influence:`);
    if (!name) return;

    const newInfluence: Influence = {
      id: crypto.randomUUID(),
      name,
      alignment: 50,
      position: items.length,
      mood_tags: []
    };

    const updated = [...items, newInfluence];
    setItems(updated);
    onUpdate(updated);
  }

  function removeInfluence(id: string) {
    const updated = items.filter(item => item.id !== id).map((item, index) => ({
      ...item,
      position: index
    }));
    setItems(updated);
    onUpdate(updated);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Influences</h3>
        <button
          onClick={addInfluence}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
        >
          + Add
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-zinc-400">
          <p>No influences yet. Add your first one!</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map(i => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {items.map((influence) => (
                <InfluenceItem
                  key={influence.id}
                  influence={influence}
                  onUpdateAlignment={(newAlignment) => updateAlignment(influence.id, newAlignment)}
                  onRemove={() => removeInfluence(influence.id)}
                  isEditing={editingId === influence.id}
                  onStartEdit={() => setEditingId(influence.id)}
                  onEndEdit={() => setEditingId(null)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {items.length > 0 && (
        <div className="mt-6 p-4 bg-zinc-800/50 rounded-lg">
          <h4 className="text-sm font-semibold mb-2">Weighting</h4>
          <p className="text-xs text-zinc-400">
            Drag to reorder. Items at the top have more influence.
            Alignment shows how much you resonate (0-100%).
          </p>
        </div>
      )}
    </div>
  );
}

function InfluenceItem({
  influence,
  onUpdateAlignment,
  onRemove,
  isEditing,
  onStartEdit,
  onEndEdit
}: {
  influence: Influence;
  onUpdateAlignment: (newAlignment: number) => void;
  onRemove: () => void;
  isEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: influence.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [localValue, setLocalValue] = useState(influence.alignment.toString());

  useEffect(() => {
    setLocalValue(influence.alignment.toString());
  }, [influence.alignment]);

  function getAlignmentColor(alignment: number): string {
    if (alignment >= 60) return 'text-green-400';
    if (alignment === 50) return 'text-yellow-400';
    return 'text-red-400';
  }

  function getBackgroundGradient(alignment: number): string {
    if (alignment >= 60) {
      return 'bg-gradient-to-r from-green-900/20 to-transparent';
    }
    if (alignment >= 40) {
      return 'bg-gradient-to-r from-yellow-900/20 to-transparent';
    }
    return 'bg-gradient-to-r from-red-900/20 to-transparent';
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-lg border border-zinc-800 ${getBackgroundGradient(influence.alignment)}`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-zinc-500 hover:text-zinc-300"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
        </svg>
      </button>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <span className="font-medium truncate block">{influence.name}</span>
      </div>

      {/* Alignment */}
      <div className="flex items-center gap-2 min-w-[120px]">
        {isEditing ? (
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={() => {
              const val = parseFloat(localValue);
              if (!isNaN(val)) {
                onUpdateAlignment(val);
              }
              onEndEdit();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = parseFloat(localValue);
                if (!isNaN(val)) {
                  onUpdateAlignment(val);
                }
                onEndEdit();
              }
            }}
            className="w-16 px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-sm text-right"
            autoFocus
          />
        ) : (
          <button
            onClick={onStartEdit}
            className={`text-sm font-mono ${getAlignmentColor(influence.alignment)} hover:underline`}
          >
            {influence.alignment.toFixed(1)}%
          </button>
        )}
      </div>

      {/* Delete */}
      <button
        onClick={onRemove}
        className="text-zinc-500 hover:text-red-400 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
