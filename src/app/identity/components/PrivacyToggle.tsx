'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface PrivacyToggleProps {
  categoryId: string;
  isShareable: boolean;
  sharingMode?: 'unrestricted' | 'family' | 'private';
  onUpdate?: (isShareable: boolean, sharingMode: string) => void;
}

export function PrivacyToggle({ 
  categoryId, 
  isShareable: initialShareable, 
  sharingMode: initialMode = 'unrestricted',
  onUpdate 
}: PrivacyToggleProps) {
  const [isShareable, setIsShareable] = useState(initialShareable);
  const [sharingMode, setSharingMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  
  const supabase = createClient();
  
  async function togglePrivacy() {
    setLoading(true);
    const newShareable = !isShareable;
    const newMode = newShareable ? sharingMode : 'private';
    
    const { error } = await supabase
      .from('categories')
      .update({ 
        is_shareable: newShareable,
        sharing_mode: newMode
      })
      .eq('id', categoryId);
    
    if (error) {
      console.error('Failed to update privacy:', error);
      setLoading(false);
      return;
    }
    
    setIsShareable(newShareable);
    setSharingMode(newMode);
    setLoading(false);
    onUpdate?.(newShareable, newMode);
  }
  
  async function updateSharingMode(mode: 'unrestricted' | 'family' | 'private') {
    setLoading(true);
    const newShareable = mode !== 'private';
    
    const { error } = await supabase
      .from('categories')
      .update({ 
        is_shareable: newShareable,
        sharing_mode: mode
      })
      .eq('id', categoryId);
    
    if (error) {
      console.error('Failed to update sharing mode:', error);
      setLoading(false);
      return;
    }
    
    setIsShareable(newShareable);
    setSharingMode(mode);
    setShowModeSelector(false);
    setLoading(false);
    onUpdate?.(newShareable, mode);
  }
  
  const icon = isShareable ? '🔓' : '🔒';
  const label = isShareable 
    ? (sharingMode === 'family' ? 'Family Only' : 'Shareable')
    : 'Private';
  
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowModeSelector(!showModeSelector)}
        disabled={loading}
        className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        title={`Privacy: ${label}`}
      >
        <span className="text-sm">{icon}</span>
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
      </button>
      
      {showModeSelector && (
        <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-2 space-y-1">
            <button
              onClick={() => updateSharingMode('unrestricted')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                sharingMode === 'unrestricted' && isShareable
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>🔓</span>
                <div>
                  <div className="font-medium">Shareable</div>
                  <div className="text-xs text-gray-500">Anyone with link</div>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => updateSharingMode('family')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                sharingMode === 'family' && isShareable
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>👨‍👩‍👦</span>
                <div>
                  <div className="font-medium">Family Only</div>
                  <div className="text-xs text-gray-500">Connected accounts</div>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => updateSharingMode('private')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                sharingMode === 'private' || !isShareable
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>🔒</span>
                <div>
                  <div className="font-medium">Private</div>
                  <div className="text-xs text-gray-500">Only me</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
