'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import InfluenceItem from './InfluenceItem';

interface CategoryEditorProps {
  categoryId: string;
  categoryName: string;
  identityId: string;
}

export default function CategoryEditor({ categoryId, categoryName, identityId }: CategoryEditorProps) {
  const [influences, setInfluences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadInfluences();
  }, [categoryId]);

  async function loadInfluences() {
    const { data, error } = await supabase
      .from('influences')
      .select('*')
      .eq('category_id', categoryId)
      .order('position');

    if (error) {
      console.error('Error loading influences:', error);
    } else {
      setInfluences(data || []);
    }
    
    setLoading(false);
  }

  async function addInfluence() {
    const name = prompt('Influence name:');
    if (!name) return;

    const alignment = parseFloat(prompt('Alignment % (0-100):') || '75');
    if (isNaN(alignment) || alignment < 0 || alignment > 100) {
      alert('Invalid alignment percentage');
      return;
    }

    const newPosition = influences.length + 1;

    const { data, error } = await supabase
      .from('influences')
      .insert({
        category_id: categoryId,
        name,
        alignment,
        position: newPosition,
        mood_tags: []
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding influence:', error);
    } else {
      setInfluences([...influences, data]);
    }
  }

  async function updateAlignment(id: string, newAlignment: number) {
    // Update locally immediately for smooth UI
    setInfluences(influences.map(inf => 
      inf.id === id ? { ...inf, alignment: newAlignment } : inf
    ));

    // Save to database
    const { error } = await supabase
      .from('influences')
      .update({ alignment: newAlignment })
      .eq('id', id);

    if (error) {
      console.error('Error updating alignment:', error);
      // Revert on error
      loadInfluences();
    }
  }

  async function reorderInfluences(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;

    // Create new array with item moved
    const newInfluences = [...influences];
    const [movedItem] = newInfluences.splice(fromIndex, 1);
    newInfluences.splice(toIndex, 0, movedItem);

    // Update positions
    const updatedInfluences = newInfluences.map((inf, index) => ({
      ...inf,
      position: index + 1
    }));

    setInfluences(updatedInfluences);

    // Save all position updates
    const updates = updatedInfluences.map(inf => 
      supabase
        .from('influences')
        .update({ position: inf.position })
        .eq('id', inf.id)
    );

    await Promise.all(updates);
  }

  function getAlignmentColor(alignment: number): string {
    if (alignment >= 75) return 'bg-green-500';
    if (alignment >= 60) return 'bg-green-400';
    if (alignment >= 50) return 'bg-yellow-400';
    if (alignment >= 40) return 'bg-orange-400';
    if (alignment >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  }

  const aboveThreshold = influences.filter(inf => inf.alignment >= 60);
  const belowThreshold = influences.filter(inf => inf.alignment < 60);

  if (loading) {
    return <div className="text-center py-12">Loading influences...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">{categoryName}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Serving {aboveThreshold.length} of {influences.length} items (threshold: 60%)
          </p>
        </div>
        <button
          onClick={addInfluence}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          + Add Influence
        </button>
      </div>

      {/* Influences List */}
      <div className="space-y-2">
        {influences.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No influences yet. Click "+ Add Influence" to get started.
          </div>
        ) : (
          <>
            {/* Above Threshold */}
            {aboveThreshold.map((influence, index) => (
              <InfluenceItem
                key={influence.id}
                influence={influence}
                index={index}
                onUpdateAlignment={updateAlignment}
                onDragStart={(idx) => setDraggedIndex(idx)}
                onDragEnd={() => setDraggedIndex(null)}
                onDrop={(toIndex) => {
                  if (draggedIndex !== null) {
                    reorderInfluences(draggedIndex, toIndex);
                  }
                }}
                isDragging={draggedIndex === index}
              />
            ))}

            {/* Threshold Divider */}
            {belowThreshold.length > 0 && (
              <div className="py-4">
                <div className="border-t-2 border-dashed border-gray-300 dark:border-gray-600 relative">
                  <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 px-4 py-1 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Below Threshold (Not Served)
                  </span>
                </div>
              </div>
            )}

            {/* Below Threshold */}
            {belowThreshold.map((influence, index) => (
              <InfluenceItem
                key={influence.id}
                influence={influence}
                index={aboveThreshold.length + index}
                onUpdateAlignment={updateAlignment}
                onDragStart={(idx) => setDraggedIndex(aboveThreshold.length + idx)}
                onDragEnd={() => setDraggedIndex(null)}
                onDrop={(toIndex) => {
                  if (draggedIndex !== null) {
                    reorderInfluences(draggedIndex, aboveThreshold.length + toIndex);
                  }
                }}
                isDragging={draggedIndex === (aboveThreshold.length + index)}
                dimmed
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
