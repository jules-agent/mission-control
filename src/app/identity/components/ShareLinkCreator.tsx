'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Category {
  id: string;
  name: string;
  type: string;
  is_shareable: boolean;
  parent_id: string | null;
}

interface ShareLinkCreatorProps {
  profileId: string;
  categories: Category[];
  onClose: () => void;
}

export function ShareLinkCreator({ profileId, categories, onClose }: ShareLinkCreatorProps) {
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [format, setFormat] = useState<'web' | 'pdf' | 'text'>('web');
  const [expiresIn, setExpiresIn] = useState<number | null>(null); // days
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  
  const supabase = createClient();
  
  const shareableCategories = categories.filter(c => c.is_shareable);
  
  function toggleCategory(categoryId: string) {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }
  
  async function createShareLink() {
    if (selectedCategories.size === 0) {
      alert('Please select at least one category to share');
      return;
    }
    
    setLoading(true);
    
    try {
      // Generate slug from title
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        || `share-${Date.now()}`;
      
      // Calculate expiration
      const expiresAt = expiresIn 
        ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000).toISOString()
        : null;
      
      // Create share link
      const { data: link, error: linkError } = await supabase
        .from('share_links')
        .insert({
          profile_id: profileId,
          slug,
          title: title || 'Shared Preferences',
          description,
          format,
          expires_at: expiresAt,
        })
        .select()
        .single();
      
      if (linkError) throw linkError;
      
      // Add categories to share link
      const categoryInserts = Array.from(selectedCategories).map(catId => ({
        share_link_id: link.id,
        category_id: catId,
        include_subcategories: true,
      }));
      
      const { error: catsError } = await supabase
        .from('share_link_categories')
        .insert(categoryInserts);
      
      if (catsError) throw catsError;
      
      // Generate full URL
      const fullUrl = `${window.location.origin}/share/${link.slug}`;
      setShareLink(fullUrl);
      
    } catch (err: any) {
      console.error('Failed to create share link:', err);
      alert('Failed to create share link: ' + err.message);
    } finally {
      setLoading(false);
    }
  }
  
  if (shareLink) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl max-w-lg w-full p-6 space-y-4">
          <h2 className="text-xl font-bold">Share Link Created! 🎉</h2>
          
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Copy this link to share:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareLink);
                  alert('Link copied to clipboard!');
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              Done
            </button>
            <button
              onClick={() => window.open(shareLink, '_blank')}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Preview
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-2xl w-full p-6 space-y-6 my-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Create Share Link</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Auggie's Christmas Wishlist 2026"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add context for recipients..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Select Categories to Share</label>
            <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
              {shareableCategories.length === 0 ? (
                <p className="text-sm text-gray-500">No shareable categories available</p>
              ) : (
                shareableCategories.map(cat => (
                  <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategories.has(cat.id)}
                      onChange={() => toggleCategory(cat.id)}
                      className="rounded"
                    />
                    <span className="text-sm">{cat.name}</span>
                    <span className="text-xs text-gray-500">({cat.type})</span>
                  </label>
                ))
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {selectedCategories.size} categories selected
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              >
                <option value="web">Web Page</option>
                <option value="pdf">PDF</option>
                <option value="text">Plain Text</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Expires In</label>
              <select
                value={expiresIn ?? ''}
                onChange={(e) => setExpiresIn(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              >
                <option value="">Never</option>
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="365">1 year</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={createShareLink}
            disabled={loading || selectedCategories.size === 0}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating...' : 'Create Share Link'}
          </button>
        </div>
      </div>
    </div>
  );
}
