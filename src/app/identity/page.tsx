'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CategoryTree } from './components/CategoryTree';

interface Identity {
  id: string;
  name: string;
  is_base: boolean;
  parent_id: string | null;
  created_at: string;
}

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

export default function IdentityPage() {
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [selectedIdentity, setSelectedIdentity] = useState<Identity | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [influences, setInfluences] = useState<Record<string, Influence[]>>({});
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    loadIdentities();
  }, []);

  useEffect(() => {
    if (selectedIdentity) {
      loadCategories(selectedIdentity.id);
    }
  }, [selectedIdentity]);

  async function loadIdentities() {
    try {
      const { data, error } = await supabase
        .from('identities')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setIdentities(data || []);
      
      // Auto-select base identity
      const baseIdentity = data?.find(i => i.is_base);
      if (baseIdentity) {
        setSelectedIdentity(baseIdentity);
      }
    } catch (error) {
      console.error('Error loading identities:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories(identityId: string) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('identity_id', identityId)
        .order('level', { ascending: true });

      if (error) throw error;
      
      // Build tree structure
      const categoryMap = new Map<string, Category>();
      const rootCategories: Category[] = [];

      (data || []).forEach(cat => {
        categoryMap.set(cat.id, { ...cat, subcategories: [] });
      });

      categoryMap.forEach(cat => {
        if (cat.parent_id) {
          const parent = categoryMap.get(cat.parent_id);
          if (parent) {
            parent.subcategories!.push(cat);
          }
        } else {
          rootCategories.push(cat);
        }
      });

      setCategories(rootCategories);

      // Load influences for all categories
      const allCategoryIds = Array.from(categoryMap.keys());
      if (allCategoryIds.length > 0) {
        const { data: influenceData } = await supabase
          .from('influences')
          .select('*')
          .in('category_id', allCategoryIds)
          .order('position');

        const influencesByCategory: Record<string, Influence[]> = {};
        (influenceData || []).forEach(inf => {
          if (!influencesByCategory[inf.category_id]) {
            influencesByCategory[inf.category_id] = [];
          }
          influencesByCategory[inf.category_id].push(inf);
        });

        setInfluences(influencesByCategory);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  async function addCategory(parentId: string | null, type: string) {
    if (!selectedIdentity) return;

    const name = prompt(`${type.charAt(0).toUpperCase() + type.slice(1)} category name:`);
    if (!name) return;

    try {
      const level = parentId ? 
        (categories.find(c => c.id === parentId)?.level || 0) + 1 : 1;

      const { error } = await supabase
        .from('categories')
        .insert({
          identity_id: selectedIdentity.id,
          parent_id: parentId,
          name,
          type,
          level
        });

      if (error) throw error;
      await loadCategories(selectedIdentity.id);
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Failed to add category');
    }
  }

  async function deleteCategory(categoryId: string) {
    if (!selectedIdentity) return;

    try {
      const { error} = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
      await loadCategories(selectedIdentity.id);
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    }
  }

  async function addInfluence(categoryId: string, name: string) {
    // Handled by InfluenceEditor component
  }

  async function updateInfluences(categoryId: string, updatedInfluences: Influence[]) {
    try {
      // Delete existing
      await supabase
        .from('influences')
        .delete()
        .eq('category_id', categoryId);

      // Insert updated
      if (updatedInfluences.length > 0) {
        const { error } = await supabase
          .from('influences')
          .insert(
            updatedInfluences.map(inf => ({
              category_id: categoryId,
              name: inf.name,
              alignment: inf.alignment,
              position: inf.position,
              mood_tags: inf.mood_tags || []
            }))
          );

        if (error) throw error;
      }

      // Update local state
      setInfluences(prev => ({
        ...prev,
        [categoryId]: updatedInfluences
      }));
    } catch (error) {
      console.error('Error updating influences:', error);
      alert('Failed to update influences');
    }
  }

  async function createIdentity(name: string, isBase: boolean = false) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('identities')
        .insert({
          user_id: user.id,
          name,
          is_base: isBase
        })
        .select()
        .single();

      if (error) throw error;
      
      await loadIdentities();
      return data;
    } catch (error) {
      console.error('Error creating identity:', error);
      throw error;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Master Identity System</h1>
            <button
              onClick={() => {
                const name = prompt('Identity name:');
                if (name) createIdentity(name);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
            >
              + New Identity
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {identities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-400 mb-4">No identities yet</p>
            <button
              onClick={() => createIdentity('Base Identity', true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              Create Base Identity
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Identity Selector */}
            <div className="lg:col-span-1">
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
                <h2 className="text-lg font-semibold mb-4">Identities</h2>
                <div className="space-y-2">
                  {identities.map(identity => (
                    <button
                      key={identity.id}
                      onClick={() => setSelectedIdentity(identity)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                        selectedIdentity?.id === identity.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{identity.name}</span>
                        {identity.is_base && (
                          <span className="text-xs px-2 py-1 bg-zinc-700 rounded">
                            Base
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Categories & Influences */}
            <div className="lg:col-span-2">
              {selectedIdentity ? (
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">{selectedIdentity.name}</h2>
                  </div>

                  <CategoryTree
                    categories={categories}
                    influences={influences}
                    onAddCategory={addCategory}
                    onAddInfluence={addInfluence}
                    onUpdateInfluences={updateInfluences}
                    onDeleteCategory={deleteCategory}
                  />
                </div>
              ) : (
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-12 text-center">
                  <p className="text-zinc-400">Select an identity to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
