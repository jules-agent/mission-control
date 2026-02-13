'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { User } from '@supabase/supabase-js';

export default function IdentityManagementPage() {
  const [user, setUser] = useState<User | null>(null);
  const [identities, setIdentities] = useState<any[]>([]);
  const [activeIdentityId, setActiveIdentityId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    loadUser();
    loadIdentities();
  }, []);

  async function loadUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  }

  async function loadIdentities() {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('identities')
      .select('*')
      .eq('user_id', user.id)
      .order('is_base', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading identities:', error);
    } else {
      setIdentities(data || []);
      // Set active to first base identity
      const baseIdentity = data?.find(i => i.is_base);
      if (baseIdentity) setActiveIdentityId(baseIdentity.id);
    }
    
    setLoading(false);
  }

  async function createNewIdentity(name: string, cloneFromId?: string) {
    if (!user) return;

    const newIdentity = {
      user_id: user.id,
      name,
      parent_id: cloneFromId || null,
      is_base: identities.length === 0 // First identity is always base
    };

    const { data, error } = await supabase
      .from('identities')
      .insert(newIdentity)
      .select()
      .single();

    if (error) {
      console.error('Error creating identity:', error);
    } else {
      setIdentities([...identities, data]);
      setActiveIdentityId(data.id);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading identities...</div>
      </div>
    );
  }

  const baseIdentity = identities.find(i => i.is_base);
  const derivedIdentities = identities.filter(i => !i.is_base);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Identities</h1>
        <button
          onClick={() => createNewIdentity('New Identity')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          + New Identity
        </button>
      </div>

      {/* Active Identity Selector */}
      <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <label className="block text-sm font-medium mb-2">Active Identity</label>
        <select
          value={activeIdentityId || ''}
          onChange={(e) => setActiveIdentityId(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg"
        >
          {identities.map(identity => (
            <option key={identity.id} value={identity.id}>
              {identity.name} {identity.is_base ? '(Base)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Base Identity */}
      {baseIdentity && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Base Identity</h2>
          <div className="p-6 border-2 border-green-500 rounded-lg bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">🟢 {baseIdentity.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Created {new Date(baseIdentity.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => window.location.href = `/identity/${baseIdentity.id}`}
                className="px-4 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Derived Identities */}
      {derivedIdentities.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Derived Identities</h2>
          <div className="space-y-4">
            {derivedIdentities.map(identity => (
              <div
                key={identity.id}
                className="p-6 border rounded-lg bg-white dark:bg-gray-900 hover:shadow-lg transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">{identity.name}</h3>
                    {identity.parent_id && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Inherits from {identities.find(i => i.id === identity.parent_id)?.name || 'Base'}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {activeIdentityId === identity.id && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 rounded-full text-sm font-medium">
                        Active
                      </span>
                    )}
                    <button
                      onClick={() => window.location.href = `/identity/${identity.id}`}
                      className="px-4 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {identities.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No identities yet. Create your first identity to get started.
          </p>
          <button
            onClick={() => createNewIdentity('Main Identity', undefined)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Create Base Identity
          </button>
        </div>
      )}
    </div>
  );
}
