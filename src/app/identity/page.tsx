'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CategoryTree } from './components/CategoryTree';
import { IdentitySwitcher } from './components/IdentitySwitcher';
import { OnboardingModal } from './components/OnboardingModal';
import { IdentitySummary } from './components/IdentitySummary';
import { AddInterestFlow } from './components/AddInterestFlow';
import { LocationInput } from './components/LocationInput';
import { PhysicalAttributes } from './components/PhysicalAttributes';
import { BugReportButton } from '../components/BugReportButton';
import { ZoomControl } from '../components/ZoomControl';
import { ShoppingEngine } from './components/ShoppingEngine';
import { FoodEngine } from './components/FoodEngine';

interface Identity {
  id: string;
  name: string;
  is_base: boolean;
  parent_id: string | null;
  created_at: string;
  city?: string;
  state?: string;
  country?: string;
  physical_attributes?: Record<string, any>;
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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAddInterest, setShowAddInterest] = useState(false);
  const [prefillInterest, setPrefillInterest] = useState<string | undefined>();
  const [prefillAlignment, setPrefillAlignment] = useState<number | undefined>();
  const [viewingAsUser, setViewingAsUser] = useState<{ email: string; id: string } | null>(null);
  const [showShopping, setShowShopping] = useState(false);
  const [showFoodEngine, setShowFoodEngine] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const selectedIdRef = useRef<string | null>(null);

  const supabase = createClient();

  // Track selected identity ID in ref so loadIdentities doesn't reset it
  useEffect(() => {
    selectedIdRef.current = selectedIdentity?.id || null;
  }, [selectedIdentity]);

  useEffect(() => { 
    checkAuth(); 
    checkViewingAsMode();
  }, []);

  function checkViewingAsMode() {
    const viewingAs = localStorage.getItem('viewingAsUser');
    if (viewingAs) {
      try {
        setViewingAsUser(JSON.parse(viewingAs));
      } catch {
        localStorage.removeItem('viewingAsUser');
      }
    }
  }

  async function returnToAdmin() {
    const adminToken = localStorage.getItem('adminReturnToken');
    if (!adminToken) {
      alert('No admin session found');
      return;
    }

    try {
      const { access_token, refresh_token } = JSON.parse(adminToken);
      
      // Restore admin session
      await supabase.auth.setSession({
        access_token,
        refresh_token
      });

      // Clear viewing-as state
      localStorage.removeItem('viewingAsUser');
      localStorage.removeItem('adminReturnToken');

      // Redirect to admin page
      window.location.href = '/identity/admin';
    } catch (error) {
      console.error('Failed to return to admin:', error);
      alert('Failed to restore admin session');
    }
  }

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/identity/login'; return; }
    setUser(user);
  }

  useEffect(() => { if (user) loadIdentities(); }, [user]);

  const loadCategories = useCallback(async (identityId: string) => {
    try {
      const { data, error } = await supabase.from('categories').select('*').eq('identity_id', identityId).order('level', { ascending: true });
      if (error) throw error;
      
      // Check if Fashion & Style category exists
      const fashionExists = (data || []).some(c => c.name === 'Fashion & Style' && !c.parent_id);
      if (!fashionExists) {
        // Create Fashion & Style category with subcategories
        const { data: fashionCat } = await supabase.from('categories')
          .insert({ identity_id: identityId, name: 'Fashion & Style', type: 'fashion', level: 1 })
          .select().single();
        if (fashionCat) {
          // Add subcategories
          await supabase.from('categories').insert([
            { identity_id: identityId, name: 'Brands', type: 'brands', level: 2, parent_id: fashionCat.id },
            { identity_id: identityId, name: 'Aesthetic', type: 'aesthetic', level: 2, parent_id: fashionCat.id },
            { identity_id: identityId, name: 'Accessories', type: 'accessories', level: 2, parent_id: fashionCat.id },
          ]);
          // Reload categories after creating Fashion & Style
          const { data: reloadedData } = await supabase.from('categories').select('*').eq('identity_id', identityId).order('level', { ascending: true });
          if (reloadedData) {
            data.push(...reloadedData.filter(c => !data.some(existing => existing.id === c.id)));
          }
        }
      }
      
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
      } else {
        setInfluences({});
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }, [supabase]);

  // Load categories whenever selected identity changes
  useEffect(() => {
    if (selectedIdentity) {
      loadCategories(selectedIdentity.id);
    } else {
      setCategories([]);
      setInfluences({});
    }
  }, [selectedIdentity?.id]);

  async function loadIdentities() {
    try {
      const { data, error } = await supabase.from('identities').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      
      // If new user has no identities, create Primary + clone templates
      if (!data || data.length === 0) {
        if (!user) return;
        // Create Primary identity
        const { data: primary } = await supabase.from('identities')
          .insert({ user_id: user.id, name: user.user_metadata?.full_name || 'My Identity', is_base: true })
          .select().single();
        
        // Clone template identities (Obama, Musk, etc.)
        await supabase.rpc('clone_templates_for_user', { target_user_id: user.id });
        
        // Reload after cloning
        const { data: refreshed } = await supabase.from('identities').select('*').order('created_at', { ascending: true });
        setIdentities(refreshed || []);
        if (primary) setSelectedIdentity(primary);
        else if (refreshed?.[0]) setSelectedIdentity(refreshed[0]);
      } else {
        setIdentities(data);
        // Only auto-select if nothing is selected yet
        if (!selectedIdRef.current) {
          const baseIdentity = data.find(i => i.is_base) || data[0];
          if (baseIdentity) setSelectedIdentity(baseIdentity);
        } else {
          const current = data.find(i => i.id === selectedIdRef.current);
          if (current) setSelectedIdentity(current);
        }
      }
    } catch (error) {
      console.error('Error loading identities:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectIdentity(identity: Identity) {
    if (identity.id !== selectedIdentity?.id) {
      setSelectedIdentity(identity);
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

  async function addInterestToCategory(categoryId: string, influence: { name: string; alignment: number; position: number }) {
    const existing = influences[categoryId] || [];
    // Insert at position, shift others
    const updated = [...existing];
    const newInf = {
      id: crypto.randomUUID(),
      category_id: categoryId,
      name: influence.name,
      alignment: influence.alignment,
      position: influence.position,
      mood_tags: [],
    };
    updated.splice(influence.position, 0, newInf);
    // Reindex positions
    updated.forEach((inf, i) => inf.position = i);
    await updateInfluences(categoryId, updated);
  }

  async function createCategoryAndReturn(name: string, type: string, parentId: string | null): Promise<string | null> {
    if (!selectedIdentity) return null;
    try {
      const level = parentId ? 2 : 1;
      const { data, error } = await supabase
        .from('categories')
        .insert({ identity_id: selectedIdentity.id, parent_id: parentId, name, type, level })
        .select()
        .single();
      if (error) throw error;
      await loadCategories(selectedIdentity.id);
      return data?.id || null;
    } catch (error) {
      console.error('Error creating category:', error);
      return null;
    }
  }

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
      if (data) setSelectedIdentity(data);
      return data;
    } catch (error) {
      console.error('Error creating identity:', error);
      throw error;
    }
  }

  async function handleOnboardingComplete(onboardingData: {
    name: string;
    gender: string;
    ageRange: string;
    music: string;
    values: string[];
    entertainment: string;
    food: string[];
    intellectualInterests: string;
  }) {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) throw new Error('Not authenticated');

    // Create the identity
    const { data: newIdentity, error: identityError } = await supabase
      .from('identities')
      .insert({ user_id: currentUser.id, name: onboardingData.name, is_base: false })
      .select()
      .single();
    if (identityError) throw identityError;

    const identityId = newIdentity.id;

    // Helper to create a category with influences
    async function seedCategory(name: string, type: string, icon: string, items: string[], alignment: number) {
      if (items.length === 0) return;
      const { data: cat, error: catError } = await supabase
        .from('categories')
        .insert({ identity_id: identityId, parent_id: null, name, type, level: 1 })
        .select()
        .single();
      if (catError || !cat) return;

      const influences = items.map((item, i) => ({
        category_id: cat.id,
        name: item.trim(),
        alignment,
        position: i,
        mood_tags: [],
      }));
      await supabase.from('influences').insert(influences);
    }

    // Seed Demographics category for gender/age
    if (onboardingData.gender || onboardingData.ageRange) {
      const demoItems: string[] = [];
      if (onboardingData.gender) demoItems.push(onboardingData.gender);
      if (onboardingData.ageRange) demoItems.push(`Age: ${onboardingData.ageRange}`);
      await seedCategory('Demographics', 'custom', '👤', demoItems, 95);
    }

    // Seed Music
    const musicItems = onboardingData.music.split(',').map(s => s.trim()).filter(Boolean);
    await seedCategory('Music', 'music', '🎵', musicItems, 92);

    // Seed Values
    await seedCategory('Values', 'philosophy', '💡', onboardingData.values, 87);

    // Seed Entertainment
    const entertainmentItems = onboardingData.entertainment.split(',').map(s => s.trim()).filter(Boolean);
    await seedCategory('Entertainment', 'custom', '🎬', entertainmentItems, 90);

    // Seed Food Preferences
    await seedCategory('Food Preferences', 'food', '🍽️', onboardingData.food, 85);

    // Seed Intellectual Interests
    const intellectualItems = onboardingData.intellectualInterests.split(',').map(s => s.trim()).filter(Boolean);
    await seedCategory('Intellectual Interests', 'philosophy', '🧠', intellectualItems, 88);

    // Switch to new identity
    setSelectedIdentity(newIdentity);
    await loadIdentities();
    setShowOnboarding(false);
  }

  async function renameIdentity(identity: Identity, newName: string) {
    try {
      const response = await fetch('/api/identity', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: identity.id, name: newName })
      });
      if (!response.ok) throw new Error('Failed to rename identity');
      await loadIdentities();
    } catch (error) {
      console.error('Error renaming identity:', error);
      alert('Failed to rename identity');
    }
  }

  async function deleteIdentity(identity: Identity) {
    try {
      const response = await fetch(`/api/identity?id=${identity.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete identity');
      }
      const remaining = identities.filter(i => i.id !== identity.id);
      if (remaining.length > 0) {
        setSelectedIdentity(remaining[0]);
      }
      await loadIdentities();
    } catch (error: any) {
      console.error('Error deleting identity:', error);
      alert(error.message || 'Failed to delete identity');
    }
  }

  async function duplicateIdentity(identity: Identity) {
    try {
      const name = prompt('Name for duplicate identity:', `${identity.name} (Copy)`);
      if (!name?.trim()) return;
      const response = await fetch('/api/identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), duplicate_from: identity.id })
      });
      if (!response.ok) throw new Error('Failed to duplicate identity');
      const newIdentity = await response.json();
      await loadIdentities();
      setSelectedIdentity(newIdentity);
    } catch (error) {
      console.error('Error duplicating identity:', error);
      alert('Failed to duplicate identity');
    }
  }

  async function updateLocation(identityId: string, city: string, state: string, country: string) {
    const { error } = await supabase
      .from('identities')
      .update({ city, state, country })
      .eq('id', identityId);
    if (!error && selectedIdentity) {
      setIdentities(prev => prev.map(i => i.id === identityId ? { ...i, city, state, country } : i));
      setSelectedIdentity({ ...selectedIdentity, city, state, country });
    }
  }

  async function updatePhysicalAttributes(identityId: string, physicalAttributes: Record<string, any>) {
    const { error } = await supabase
      .from('identities')
      .update({ physical_attributes: physicalAttributes })
      .eq('id', identityId);
    if (!error && selectedIdentity) {
      setIdentities(prev => prev.map(i => i.id === identityId ? { ...i, physical_attributes: physicalAttributes } : i));
      setSelectedIdentity({ ...selectedIdentity, physical_attributes: physicalAttributes });
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
      {/* Hide global floating zoom — we have inline zoom in header */}
      <style>{`#global-zoom-control { display: none !important; }`}</style>
      {/* Onboarding Modal */}
      {showOnboarding && (
        <OnboardingModal
          onComplete={handleOnboardingComplete}
          onCancel={() => setShowOnboarding(false)}
        />
      )}

      {/* Viewing As Banner */}
      {viewingAsUser && (
        <div className="pt-[env(safe-area-inset-top)] bg-amber-500 text-black">
          <div className="max-w-md landscape:max-w-2xl mx-auto px-4 py-2 flex items-center justify-between">
            <div className="text-[13px] font-medium">
              👁️ Viewing as <span className="font-semibold">{viewingAsUser.email}</span>
            </div>
            <button
              onClick={returnToAdmin}
              className="text-[13px] font-semibold underline active:opacity-60 transition-opacity"
            >
              Return to Admin
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="pt-[env(safe-area-inset-top)] sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-zinc-800/60">
        <div className="max-w-md landscape:max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight">Identity</h1>
            <p className="text-[13px] text-zinc-500 mt-0.5">{user?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <ZoomControl inline />
            {selectedIdentity && (
              <>
                <button
                  onClick={() => setShowShopping(true)}
                  className="text-[22px] active:opacity-60 transition-opacity"
                  title="Shopping"
                >
                  🛒
                </button>
                <button
                  onClick={() => setShowFoodEngine(true)}
                  className="text-[22px] active:opacity-60 transition-opacity"
                  title="Food Finder"
                >
                  🍣
                </button>
              </>
            )}
            <BugReportButton appName="identity" inline />
            {user?.email === 'ben@unpluggedperformance.com' && !viewingAsUser && (
              <a
                href="/identity/admin"
                className="text-[15px] text-[#007AFF] active:opacity-60 transition-opacity"
              >
                Admin
              </a>
            )}
            <button
              onClick={handleLogout}
              className="text-[15px] text-zinc-500 active:opacity-60 transition-opacity"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-md landscape:max-w-2xl mx-auto px-4 py-6 pb-[calc(32px+env(safe-area-inset-bottom))]">
        {identities.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-500 text-[17px] mb-6">No identities yet</p>
            <button
              onClick={() => createIdentity('Primary Identity', true)}
              className="px-6 py-3 bg-[#007AFF] hover:bg-[#0071E3] active:bg-[#0064CC] rounded-xl text-[17px] font-semibold transition-all"
            >
              Create Primary Identity
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <IdentitySwitcher
                  identities={identities}
                  selectedIdentity={selectedIdentity}
                  onSelectIdentity={handleSelectIdentity}
                  onCreateIdentity={(name) => createIdentity(name)}
                  onRenameIdentity={renameIdentity}
                  onDeleteIdentity={deleteIdentity}
                  onDuplicateIdentity={duplicateIdentity}
                  onStartOnboarding={() => setShowOnboarding(true)}
                />
              </div>
              {selectedIdentity && (
                <button
                  onClick={() => setShowProfileEdit(true)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-900/60 hover:bg-zinc-800 active:bg-zinc-700 transition-all text-zinc-400 hover:text-white"
                  title="Edit Profile"
                >
                  ✏️
                </button>
              )}
            </div>

            {selectedIdentity && (
              <IdentitySummary
                identityId={selectedIdentity.id}
                identityName={selectedIdentity.name}
                influenceCount={Object.values(influences).flat().length}
              />
            )}

            {/* Location + Physical Attributes moved into profile edit sheet (✏️ icon) */}

            {/* Physical Attributes moved into profile edit sheet */}

            {selectedIdentity && (
              <CategoryTree
                categories={categories}
                influences={influences}
                onAddCategory={addCategory}
                onAddInfluence={addInfluence}
                onUpdateInfluences={updateInfluences}
                onDeleteCategory={deleteCategory}
                onSendToAddFlow={(interest, alignment) => {
                  setPrefillInterest(interest);
                  setPrefillAlignment(alignment);
                  setShowAddInterest(true);
                }}
              />
            )}
          </div>
        )}
      </div>
      {/* Floating Add Interest Button */}
      {selectedIdentity && !showAddInterest && !showOnboarding && (
        <button
          onClick={() => setShowAddInterest(true)}
          className="fixed right-5 w-14 h-14 bg-[#007AFF] hover:bg-[#0071E3] active:bg-[#0064CC] rounded-full shadow-lg shadow-[#007AFF]/30 flex items-center justify-center transition-all z-40"
          style={{ bottom: 'calc(24px + env(safe-area-inset-bottom))' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}

      {/* Add Interest Flow */}
      {showAddInterest && selectedIdentity && (
        <AddInterestFlow
          identityId={selectedIdentity.id}
          categories={categories}
          influences={influences}
          onSave={addInterestToCategory}
          onCreateCategory={createCategoryAndReturn}
          onClose={() => {
            setShowAddInterest(false);
            setPrefillInterest(undefined);
            setPrefillAlignment(undefined);
            if (selectedIdentity) loadCategories(selectedIdentity.id);
          }}
          initialInterest={prefillInterest}
          initialAlignment={prefillAlignment}
        />
      )}

      {/* Shopping Engine */}
      {showShopping && selectedIdentity && (
        <ShoppingEngine
          identityId={selectedIdentity.id}
          categories={categories}
          influences={influences}
          onAddInfluence={(categoryId, influence) => addInterestToCategory(categoryId, influence)}
          onClose={() => setShowShopping(false)}
        />
      )}

      {/* Food Engine */}
      {showFoodEngine && selectedIdentity && (
        <FoodEngine
          identityId={selectedIdentity.id}
          categories={categories}
          influences={influences}
          location={{
            city: selectedIdentity.city,
            state: selectedIdentity.state,
            country: selectedIdentity.country,
          }}
          onAddInfluence={(categoryId, influence) => addInterestToCategory(categoryId, influence)}
          onClose={() => setShowFoodEngine(false)}
        />
      )}

      {/* Profile Edit Sheet */}
      {showProfileEdit && selectedIdentity && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-end sm:items-center justify-center" onClick={() => setShowProfileEdit(false)}>
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-zinc-800/60 flex items-center justify-between sticky top-0 bg-zinc-900 z-10">
              <h2 className="text-[17px] font-semibold text-white">Edit Profile</h2>
              <button onClick={() => setShowProfileEdit(false)} className="text-zinc-500 hover:text-zinc-300 text-[15px] p-1">Done</button>
            </div>
            <div className="p-5 space-y-6">
              {/* Rename */}
              <div>
                <label className="text-[13px] text-zinc-500 uppercase tracking-wider font-medium block mb-2">✏️ Name</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    defaultValue={selectedIdentity.name}
                    onBlur={(e) => {
                      const val = e.target.value.trim();
                      if (val && val !== selectedIdentity.name) renameIdentity(selectedIdentity, val);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                    }}
                    className="flex-1 py-2.5 px-3 bg-zinc-800 rounded-xl text-[15px] text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>
              </div>
              {/* Location */}
              <div>
                <label className="text-[13px] text-zinc-500 uppercase tracking-wider font-medium block mb-2">📍 Location</label>
                <LocationInput
                  city={selectedIdentity.city}
                  state={selectedIdentity.state}
                  country={selectedIdentity.country}
                  onSave={(city, state, country) => updateLocation(selectedIdentity.id, city, state, country)}
                />
              </div>
              {/* Physical Attributes */}
              <PhysicalAttributes
                identityId={selectedIdentity.id}
                physicalAttributes={selectedIdentity.physical_attributes}
                onSave={updatePhysicalAttributes}
              />
              {/* Actions */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={() => { duplicateIdentity(selectedIdentity); setShowProfileEdit(false); }}
                  className="w-full py-3 rounded-xl text-[15px] font-semibold bg-zinc-800 border border-zinc-700 text-zinc-300 active:opacity-80 transition-all flex items-center justify-center gap-2"
                >
                  📋 Duplicate Identity
                </button>
                {identities.length > 1 && (
                  <button
                    onClick={() => {
                      if (!confirm(`Delete "${selectedIdentity.name}"? This will remove all categories and influences.`)) return;
                      deleteIdentity(selectedIdentity);
                      setShowProfileEdit(false);
                    }}
                    className="w-full py-3 rounded-xl text-[15px] font-semibold bg-red-500/10 border border-red-500/30 text-red-400 active:opacity-80 transition-all flex items-center justify-center gap-2"
                  >
                    🗑️ Delete Identity
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
