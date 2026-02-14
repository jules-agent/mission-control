'use client';

import { useState, useEffect, useRef } from 'react';
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
  if (alignment >= 60) return '#8BD86B';
  if (alignment >= 50) return '#C0D94E';
  if (alignment >= 40) return '#FFD60A';
  if (alignment >= 25) return '#FF9500';
  return '#FF3B30';
}

export function InfluenceEditor({ influences, onUpdate, categoryType }: InfluenceEditorProps) {
  const [items, setItems] = useState(influences);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const addInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => { setItems(influences); }, [influences]);
  useEffect(() => { if (addingNew && addInputRef.current) addInputRef.current.focus(); }, [addingNew]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const reordered = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
          ...item, position: index
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

  function updateName(id: string, newName: string) {
    const updated = items.map(item =>
      item.id === id ? { ...item, name: newName } : item
    );
    setItems(updated);
    onUpdate(updated);
  }

  function addInfluence(name: string) {
    if (!name.trim()) return;
    const newInfluence: Influence = {
      id: crypto.randomUUID(),
      name: name.trim(),
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
      ...item, position: index
    }));
    setItems(updated);
    onUpdate(updated);
  }

  return (
    <div className="space-y-1">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          {items.length} influence{items.length !== 1 ? 's' : ''}
        </span>
        {!addingNew && (
          <button
            onClick={() => setAddingNew(true)}
            className="px-2 py-1 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 rounded transition-colors"
          >
            + Add
          </button>
        )}
      </div>

      {/* Inline add */}
      {addingNew && (
        <div className="flex items-center gap-2 p-2 rounded-lg border border-blue-800/50 bg-blue-900/10 mb-2">
          <input
            ref={addInputRef}
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && newName.trim()) {
                addInfluence(newName);
                setNewName('');
                // Keep open for rapid adds
              }
              if (e.key === 'Escape') {
                setAddingNew(false);
                setNewName('');
              }
            }}
            placeholder={`Add ${categoryType} influence... (Enter to add, Esc to close)`}
            className="flex-1 px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-sm text-white placeholder-zinc-500"
          />
          <button
            onClick={() => {
              if (newName.trim()) {
                addInfluence(newName);
                setNewName('');
              }
            }}
            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white"
          >
            Add
          </button>
          <button
            onClick={() => { setAddingNew(false); setNewName(''); }}
            className="px-2 py-1 text-zinc-400 hover:text-white text-xs"
          >
            Done
          </button>
        </div>
      )}

      {items.length === 0 && !addingNew ? (
        <button
          onClick={() => setAddingNew(true)}
          className="w-full py-4 text-center text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
        >
          No influences yet — click to add
        </button>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {items.map((influence) => (
                <InfluenceRow
                  key={influence.id}
                  influence={influence}
                  isEditing={editingId === influence.id}
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
    </div>
  );
}

function InfluenceRow({
  influence,
  isEditing,
  onStartEdit,
  onEndEdit,
  onUpdateAlignment,
  onUpdateName,
  onRemove
}: {
  influence: Influence;
  isEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: () => void;
  onUpdateAlignment: (v: number) => void;
  onUpdateName: (n: string) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: influence.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const [localAlignment, setLocalAlignment] = useState(influence.alignment.toString());
  const [localName, setLocalName] = useState(influence.name);
  const color = getAlignmentColor(influence.alignment);

  useEffect(() => { setLocalAlignment(influence.alignment.toString()); }, [influence.alignment]);
  useEffect(() => { setLocalName(influence.name); }, [influence.name]);

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style} className="rounded-lg border border-zinc-700 bg-zinc-800/80 p-3 space-y-3">
        {/* Name edit */}
        <input
          type="text"
          value={localName}
          onChange={e => setLocalName(e.target.value)}
          onBlur={() => { if (localName.trim()) onUpdateName(localName.trim()); }}
          onKeyDown={e => { if (e.key === 'Enter') { if (localName.trim()) onUpdateName(localName.trim()); onEndEdit(); } if (e.key === 'Escape') onEndEdit(); }}
          className="w-full px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-white font-medium"
          autoFocus
        />
        {/* Alignment slider */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Alignment</span>
            <span style={{ color }} className="font-mono font-bold">{influence.alignment.toFixed(1)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="0.5"
            value={influence.alignment}
            onChange={e => onUpdateAlignment(parseFloat(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #FF3B30 0%, #FF9500 25%, #FFD60A 45%, #C0D94E 55%, #8BD86B 70%, #34C759 100%)`
            }}
          />
          <div className="flex justify-between text-[10px] text-zinc-600">
            <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
          </div>
        </div>
        {/* Actions */}
        <div className="flex items-center justify-between">
          <button onClick={onRemove} className="text-xs text-red-400 hover:text-red-300">Delete</button>
          <button onClick={onEndEdit} className="text-xs px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-white">Done</button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-800/60 transition-colors group cursor-pointer"
      onClick={onStartEdit}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        onClick={e => e.stopPropagation()}
        className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <span className="text-sm">≡</span>
      </button>

      {/* Color dot */}
      <span
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />

      {/* Name */}
      <span className="flex-1 text-sm text-white font-medium truncate">{influence.name}</span>

      {/* Alignment % */}
      <span className="text-sm font-mono flex-shrink-0" style={{ color }}>
        {influence.alignment.toFixed(1)}%
      </span>

      {/* Delete (on hover) */}
      <button
        onClick={e => { e.stopPropagation(); onRemove(); }}
        className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
