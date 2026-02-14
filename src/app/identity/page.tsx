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
  const [user, setUser] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => { checkAuth(); }, []);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/identity/login'; return; }
    setUser(user);
    loadIdentities();
  }

  useEffect(() => { if (user) loadIdentities(); }, [user]);
  useEffect(() => { if (selectedIdentity) loadCategories(selectedIdentity.id); }, [selectedIdentity]);

  async function loadIdentities() {
    try {
      const { data, error } = await supabase.from('identities').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      setIdentities(data || []);
      const baseIdentity = data?.find(i => i.is_base);
      if (baseIdentity) setSelectedIdentity(baseIdentity);
    } catch (error) {
      console.error('Error loading identities:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories(identityId: string) {
    try {
      const { data, error } = await supabase.from('categories').select('*').eq('identity_id', identityId).order('level', { ascending: true });
      if (error) throw error;
      const categoryMap = new Map<string, Category>();
      const rootCategories: Category[] = [];
      (data || []).forEach(cat => { categoryMap.set(cat.id, { ...cat, subcategories: [] }); });
      categoryMap.forEach(cat => {
        if (cat.parent_id) {
          const parent = categoryMap.get(cat.parent_id);
          if (parent) parent.subcategories!.push(cat);
        } else {
          rootCategories.push(cat);
        }
      });
      setCategories(rootCategories);
      const allCategoryIds = Array.from(categoryMap.keys());
      if (allCategoryIds.length > 0) {
        const { data: influenceData } = await supabase.from('influences').select('*').in('category_id', allCategoryIds).order('position');
        const influencesByCategory: Record<string, Influence[]> = {};
        (influenceData || []).forEach(inf => {
          if (!influencesByCategory[inf.category_id]) influencesByCategory[inf.category_id] = [];
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
      const level = parentId ? (categories.find(c => c.id === parentId)?.level || 0) + 1 : 1;
      const { error } = await supabase.from('categories').insert({ identity_id: selectedIdentity.id, parent_id: parentId, name, type, level });
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
      const { error } = await supabase.from('categories').delete().eq('id', categoryId);
      if (error) throw error;
      await loadCategories(selectedIdentity.id);
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    }
  }

  async function addInfluence(categoryId: string, name: string) { }

  async function updateInfluences(categoryId: string, updatedInfluences: Influence[]) {
    try {
      await supabase.from('influences').delete().eq('category_id', categoryId);
      if (updatedInfluences.length > 0) {
        const { error } = await supabase.from('influences').insert(
          updatedInfluences.map(inf => ({
            category_id: categoryId, name: inf.name, alignment: inf.alignment,
            position: inf.position, mood_tags: inf.mood_tags || []
          }))
        );
        if (error) throw error;
      }
      setInfluences(prev => ({ ...prev, [categoryId]: updatedInfluences }));
    } catch (error) {
      console.error('Error updating influences:', error);
      alert('Failed to update influences');
    }
  }

  async function createIdentity(name: string, isBase: boolean = false) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase.from('identities').insert({ user_id: user.id, name, is_base: isBase }).select().single();
      if (error) throw error;
      await loadIdentities();
      return data;
    } catch (error) {
      console.error('Error creating identity:', error);
      throw error;
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/identity/login';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center" style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div className="text-zinc-500 text-[17px]">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div
      className="min-h-screen bg-black text-white"
      style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      {/* Header — clean, spacious */}
      <header className="pt-[env(safe-area-inset-top)] sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-zinc-800/60">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight">Identity</h1>
            <p className="text-[13px] text-zinc-500 mt-0.5">{user?.email}</p>
          </div>
          <div className="flex items-center gap-5">
            <button
              onClick={() => { const name = prompt('Identity name:'); if (name) createIdentity(name); }}
              className="text-[15px] text-[#007AFF] active:opacity-60 transition-opacity"
            >
              New
            </button>
            <button
              onClick={handleLogout}
              className="text-[15px] text-zinc-500 active:opacity-60 transition-opacity"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 pb-[calc(32px+env(safe-area-inset-bottom))]">
        {identities.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-500 text-[17px] mb-6">No identities yet</p>
            <button
              onClick={() => createIdentity('Base Identity', true)}
              className="px-6 py-3 bg-[#007AFF] hover:bg-[#0071E3] active:bg-[#0064CC] rounded-xl text-[17px] font-semibold transition-all"
            >
              Create Base Identity
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Identity selector — iOS grouped style */}
            {identities.length > 1 && (
              <div className="bg-zinc-900/80 rounded-xl overflow-hidden">
                {identities.map((identity, i) => (
                  <button
                    key={identity.id}
                    onClick={() => setSelectedIdentity(identity)}
                    className={`w-full text-left px-4 min-h-[48px] flex items-center justify-between transition-colors active:bg-zinc-800 ${
                      i < identities.length - 1 ? '' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 py-3 flex-1" style={i < identities.length - 1 ? { borderBottom: '0.5px solid rgba(255,255,255,0.08)' } : {}}>
                      <div className="flex-1 min-w-0">
                        <span className={`text-[17px] ${selectedIdentity?.id === identity.id ? 'text-white font-semibold' : 'text-zinc-300'}`}>
                          {identity.name}
                        </span>
                        {identity.is_base && (
                          <p className="text-[13px] text-zinc-500">Base Identity</p>
                        )}
                      </div>
                      {selectedIdentity?.id === identity.id && (
                        <svg className="w-5 h-5 text-[#007AFF] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Single identity display */}
            {identities.length === 1 && selectedIdentity && (
              <div className="bg-zinc-900/80 rounded-xl px-4 py-4">
                <p className="text-[22px] font-semibold tracking-tight">{selectedIdentity.name}</p>
                {selectedIdentity.is_base && (
                  <p className="text-[13px] text-zinc-500 mt-1">Base Identity</p>
                )}
              </div>
            )}

            {/* Categories */}
            {selectedIdentity && (
              <CategoryTree
                categories={categories}
                influences={influences}
                onAddCategory={addCategory}
                onAddInfluence={addInfluence}
                onUpdateInfluences={updateInfluences}
                onDeleteCategory={deleteCategory}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
