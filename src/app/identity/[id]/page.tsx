'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useParams } from 'next/navigation';
import CategoryEditor from '@/components/identity/CategoryEditor';

export default function IdentityDetailPage() {
  const params = useParams();
  const identityId = params.id as string;
  
  const [identity, setIdentity] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    loadIdentity();
    loadCategories();
  }, [identityId]);

  async function loadIdentity() {
    const { data, error } = await supabase
      .from('identities')
      .select('*')
      .eq('id', identityId)
      .single();

    if (error) {
      console.error('Error loading identity:', error);
    } else {
      setIdentity(data);
    }
  }

  async function loadCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('identity_id', identityId)
      .is('parent_id', null) // Top-level categories only
      .order('created_at');

    if (error) {
      console.error('Error loading categories:', error);
    } else {
      setCategories(data || []);
      if (data && data.length > 0 && !selectedCategory) {
        setSelectedCategory(data[0].id);
      }
    }
    
    setLoading(false);
  }

  async function createCategory(name: string, type: string) {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        identity_id: identityId,
        name,
        type,
        level: 1
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
    } else {
      setCategories([...categories, data]);
      setSelectedCategory(data.id);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const activeCategoryData = categories.find(c => c.id === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <a
            href="/identity"
            className="text-blue-600 hover:text-blue-700 mb-4 inline-block"
          >
            ← Back to Identities
          </a>
          <h1 className="text-3xl font-bold">{identity?.name}</h1>
          {identity?.parent_id && (
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Inherits from base identity
            </p>
          )}
        </div>

        {/* Categories Tabs */}
        <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {category.name}
            </button>
          ))}
          <button
            onClick={() => {
              const name = prompt('Category name:');
              if (name) createCategory(name, 'custom');
            }}
            className="px-6 py-3 rounded-lg font-medium whitespace-nowrap bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            + Add Category
          </button>
        </div>

        {/* Category Editor */}
        {activeCategoryData && (
          <CategoryEditor
            categoryId={activeCategoryData.id}
            categoryName={activeCategoryData.name}
            identityId={identityId}
          />
        )}

        {/* Empty State */}
        {categories.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No categories yet. Start by adding your first category.
            </p>
            <button
              onClick={() => createCategory('Music Influences', 'music')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition mr-2"
            >
              Add Music
            </button>
            <button
              onClick={() => createCategory('Philosophy', 'philosophy')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Add Philosophy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
