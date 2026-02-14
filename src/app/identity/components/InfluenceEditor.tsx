'use client';

import { useState, useEffect, useRef } from 'react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
}

function getAlignmentColor(alignment: number): string {
  if (alignment >= 75) return '#34C759';
  if (alignment >= 60) return '#6FDA75';
  if (alignment >= 50) return '#A4E897';
  if (alignment >= 45) return '#FFD60A';
  if (alignment >= 25) return '#FF9500';
  return '#FF3B30';
}

export function InfluenceEditor({ influences, onUpdate, categoryType }: InfluenceEditorProps) {
  const [items, setItems] = useState(influences);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const addInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => { setItems(influences); }, [influences]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const reordered = arrayMove(items, oldIndex, newIndex).map((item, index) => ({ ...item, position: index }));
        onUpdate(reordered);
        return reordered;
      });
    }
  }

  function updateAlignment(id: string, newAlignment: number) {
    const updated = items.map(item => item.id === id ? { ...item, alignment: Math.max(0, Math.min(100, newAlignment)) } : item);
    setItems(updated);
    onUpdate(updated);
  }

  function updateName(id: string, name: string) {
    const updated = items.map(item => item.id === id ? { ...item, name } : item);
    setItems(updated);
    onUpdate(updated);
  }

  function addInfluence(name: string) {
    if (!name.trim()) return;
    const newInfluence: Influence = { id: crypto.randomUUID(), name: name.trim(), alignment: 50, position: items.length, mood_tags: [] };
    const updated = [...items, newInfluence];
    setItems(updated);
    onUpdate(updated);
  }

  function removeInfluence(id: string) {
    const updated = items.filter(item => item.id !== id).map((item, index) => ({ ...item, position: index }));
    setItems(updated);
    onUpdate(updated);
  }

  // Count serving (above 60% threshold)
  const serving = items.filter(i => i.alignment >= 60).length;

  return (
    <div>
      {/* Serving indicator */}
      {items.length > 0 && (
        <p className="text-[13px] text-zinc-500 mb-2 pl-1">
          Serving {serving} of {items.length} · threshold: 60%
        </p>
      )}

      {items.length === 0 ? (
        <p className="text-[13px] text-zinc-600 py-3 pl-1">No influences yet</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div>
              {items.map((influence, i) => (
                <InfluenceRow
                  key={influence.id}
                  influence={influence}
                  isEditing={editingId === influence.id}
                  isLast={i === items.length - 1}
                  onStartEdit={() => setEditingId(influence.id)}
                  onEndEdit={() => setEditingId(null)}
                  onUpdateAlignment={(v) => updateAlignment(influence.id, v)}
                  onUpdateName={(n) => updateName(influence.id, n)}
                  onRemove={() => removeInfluence(influence.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add influence — clean underline input */}
      <div className="pl-1 mt-1">
        <input
          ref={addInputRef}
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && newName.trim()) { addInfluence(newName); setNewName(''); }
          }}
          placeholder="Add influence..."
          className="w-full py-2 bg-transparent text-[15px] text-white placeholder-zinc-600 border-b border-zinc-800/60 focus:border-[#007AFF] focus:outline-none transition-colors"
        />
      </div>
    </div>
  );
}

function InfluenceRow({
  influence, isEditing, isLast, onStartEdit, onEndEdit, onUpdateAlignment, onUpdateName, onRemove
}: {
  influence: Influence;
  isEditing: boolean;
  isLast: boolean;
  onStartEdit: () => void;
  onEndEdit: () => void;
  onUpdateAlignment: (v: number) => void;
  onUpdateName: (n: string) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: influence.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const [localName, setLocalName] = useState(influence.name);
  const color = getAlignmentColor(influence.alignment);

  useEffect(() => { setLocalName(influence.name); }, [influence.name]);

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style} className="py-3 px-1 space-y-4">
        {/* Name — iOS underline style */}
        <input
          type="text"
          value={localName}
          onChange={e => setLocalName(e.target.value)}
          onBlur={() => { if (localName.trim()) onUpdateName(localName.trim()); }}
          onKeyDown={e => { if (e.key === 'Enter') { if (localName.trim()) onUpdateName(localName.trim()); onEndEdit(); } if (e.key === 'Escape') onEndEdit(); }}
          className="w-full pb-2 bg-transparent text-[17px] text-white font-medium border-b border-zinc-700 focus:border-[#007AFF] focus:outline-none transition-colors"
          autoFocus
        />

        {/* Alignment slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-zinc-500">Alignment</span>
            <span className="text-[22px] font-semibold tabular-nums" style={{ color }}>
              {Math.round(influence.alignment)}%
            </span>
          </div>
          <input
            type="range"
            min="0" max="100" step="1"
            value={influence.alignment}
            onChange={e => onUpdateAlignment(parseFloat(e.target.value))}
            className="w-full h-[6px] rounded-full appearance-none cursor-pointer"
            style={{
              background: 'linear-gradient(to right, #FF3B30 0%, #FF6B4A 20%, #FF9500 35%, #FFD60A 50%, #A4E897 65%, #6FDA75 80%, #34C759 100%)',
              WebkitAppearance: 'none',
            }}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <button onClick={onRemove} className="text-[15px] text-red-400 active:opacity-60 transition-opacity">
            Delete Influence
          </button>
          <button onClick={onEndEdit} className="text-[15px] text-[#007AFF] active:opacity-60 transition-opacity">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center min-h-[44px] active:bg-zinc-800/40 transition-colors cursor-pointer"
      onClick={onStartEdit}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        onClick={e => e.stopPropagation()}
        className="cursor-grab active:cursor-grabbing text-zinc-600 pr-2 py-3 touch-manipulation"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
          <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
          <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
        </svg>
      </button>

      <div
        className="flex items-center gap-3 py-3 flex-1 pr-1"
        style={!isLast ? { borderBottom: '0.5px solid rgba(255,255,255,0.06)' } : {}}
      >
        {/* Color dot */}
        <span className="w-[10px] h-[10px] rounded-full flex-shrink-0" style={{ backgroundColor: color }} />

        {/* Name */}
        <span className="flex-1 text-[17px] text-white truncate">{influence.name}</span>

        {/* Alignment % */}
        <span className="text-[15px] font-medium tabular-nums flex-shrink-0" style={{ color }}>
          {Math.round(influence.alignment)}%
        </span>
      </div>
    </div>
  );
}
