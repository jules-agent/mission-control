'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Identity {
  id: string;
  name: string;
  is_base: boolean;
  parent_id: string | null;
  created_at: string;
}

interface IdentitySwitcherProps {
  identities: Identity[];
  selectedIdentity: Identity | null;
  onSelectIdentity: (identity: Identity) => void;
  onCreateIdentity: (name: string) => Promise<void>;
  onRenameIdentity: (identity: Identity, newName: string) => Promise<void>;
  onDeleteIdentity: (identity: Identity) => Promise<void>;
  onDuplicateIdentity: (identity: Identity) => Promise<void>;
  onStartOnboarding: () => void;
}

export function IdentitySwitcher({
  identities,
  selectedIdentity,
  onSelectIdentity,
  onCreateIdentity,
  onRenameIdentity,
  onDeleteIdentity,
  onDuplicateIdentity,
  onStartOnboarding,
}: IdentitySwitcherProps) {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [influenceCounts, setInfluenceCounts] = useState<Record<string, number>>({});
  const supabase = createClient();
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [showEditMenu, setShowEditMenu] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search when modal opens
  useEffect(() => {
    if (showModal && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [showModal]);

  // Filter identities based on search
  const filteredIdentities = identities.filter((identity) =>
    identity.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fetch influence counts when modal opens
  useEffect(() => {
    if (!showModal || identities.length === 0) return;
    async function fetchCounts() {
      const counts: Record<string, number> = {};
      for (const identity of identities) {
        const { data: cats } = await supabase.from('categories').select('id').eq('identity_id', identity.id);
        if (cats && cats.length > 0) {
          const catIds = cats.map(c => c.id);
          const { count } = await supabase.from('influences').select('*', { count: 'exact', head: true }).in('category_id', catIds);
          counts[identity.id] = count || 0;
        } else {
          counts[identity.id] = 0;
        }
      }
      setInfluenceCounts(counts);
    }
    fetchCounts();
  }, [showModal, identities]);

  const getInfluenceCount = (identity: Identity): number => {
    return influenceCounts[identity.id] ?? 0;
  };

  const handleSelectFromModal = (identity: Identity) => {
    onSelectIdentity(identity);
    setShowModal(false);
    setSearchQuery('');
  };

  const handleRename = async () => {
    if (!selectedIdentity || !renameValue.trim() || renameValue === selectedIdentity.name) {
      setRenaming(false);
      return;
    }
    await onRenameIdentity(selectedIdentity, renameValue.trim());
    setRenaming(false);
  };

  const handleDelete = async () => {
    if (!selectedIdentity) return;
    if (identities.length === 1) {
      alert('Cannot delete the only identity');
      return;
    }
    if (!confirm(`Delete "${selectedIdentity.name}"? This will remove all categories and influences.`)) return;
    await onDeleteIdentity(selectedIdentity);
  };

  const handleDuplicate = async () => {
    if (!selectedIdentity) return;
    await onDuplicateIdentity(selectedIdentity);
  };

  return (
    <>
      {/* Current Identity Display - Click to open selector */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="flex-1 flex items-center justify-between p-4 bg-zinc-900/60 hover:bg-zinc-900/80 active:bg-zinc-900 rounded-2xl transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-semibold">
                {selectedIdentity?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="text-left">
                <div className="text-[17px] font-semibold text-white flex items-center gap-2">
                  {selectedIdentity?.name || 'Select Identity'}
                  {selectedIdentity?.is_base && (
                    <span className="text-[11px] px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">
                      Primary
                    </span>
                  )}
                </div>
                <div className="text-[13px] text-zinc-500">
                  Tap to switch • {identities.length} {identities.length === 1 ? 'identity' : 'identities'}
                </div>
              </div>
            </div>
            <svg
              className="w-5 h-5 text-zinc-600 group-hover:text-zinc-500 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Edit menu moved to Profile Edit sheet (✏️ icon) */}
        </div>

          {/* Inline rename moved to Profile Edit sheet */}
      </div>

      {/* Identity Selector Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
          onClick={() => {
            setShowModal(false);
            setSearchQuery('');
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal Content */}
          <div
            className="relative w-full sm:max-w-md sm:mx-4 bg-zinc-900 sm:rounded-2xl rounded-t-3xl max-h-[85vh] sm:max-h-[600px] flex flex-col shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Search */}
            <div className="p-4 border-b border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[20px] font-semibold text-white">Switch Identity</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSearchQuery('');
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800 active:bg-zinc-700 transition-colors"
                >
                  <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search identities..."
                  className="w-full pl-10 pr-4 py-3 bg-zinc-800/80 rounded-xl text-[15px] text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all"
                />
              </div>
            </div>

            {/* Identity List - Scrollable */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {filteredIdentities.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-[15px]">
                  No identities found
                </div>
              ) : (
                <div className="p-2">
                  {filteredIdentities.map((identity) => (
                    <button
                      key={identity.id}
                      onClick={() => handleSelectFromModal(identity)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800/60 active:bg-zinc-800 transition-all min-h-[56px] group"
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-semibold flex-shrink-0">
                        {identity.name[0]?.toUpperCase() || '?'}
                      </div>

                      {/* Identity Info */}
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[16px] font-medium text-white truncate">
                            {identity.name}
                          </span>
                          {identity.is_base && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded flex-shrink-0">
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="text-[13px] text-zinc-500">
                          {getInfluenceCount(identity)} influences
                        </div>
                      </div>

                      {/* Checkmark for selected */}
                      {selectedIdentity?.id === identity.id && (
                        <svg
                          className="w-6 h-6 text-[#007AFF] flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with New Identity Button */}
            <div className="p-4 border-t border-zinc-800">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSearchQuery('');
                  onStartOnboarding();
                }}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#007AFF] hover:bg-[#0071E3] active:bg-[#0064CC] rounded-xl text-white text-[16px] font-semibold transition-all min-h-[52px]"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                New Identity
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @media (min-width: 640px) {
          .animate-slide-up {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}
