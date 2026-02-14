'use client';

import { useState } from 'react';

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
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');

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
    <div className="mb-2">
      {/* Horizontal scrollable pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {identities.map((identity) => (
          <button
            key={identity.id}
            onClick={() => onSelectIdentity(identity)}
            className={`
              flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full transition-all touch-manipulation
              ${selectedIdentity?.id === identity.id
                ? 'bg-[#007AFF] text-white shadow-lg shadow-blue-500/30'
                : 'bg-zinc-800/60 text-zinc-300 active:bg-zinc-700/80'
              }
            `}
          >
            <span className="text-[15px] font-medium whitespace-nowrap">
              {identity.name}
            </span>
            {identity.is_base && (
              <span className="text-[11px] px-1.5 py-0.5 bg-black/20 rounded">
                Primary
              </span>
            )}
          </button>
        ))}

        {/* New Identity Button */}
        <button
          onClick={onStartOnboarding}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full bg-zinc-800/40 border-2 border-dashed border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300 active:bg-zinc-700/60 transition-all touch-manipulation"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="text-[15px] font-medium whitespace-nowrap">New Identity</span>
        </button>
      </div>

      {/* Action buttons below pills for selected identity */}
      {selectedIdentity && (
        <div className="flex items-center gap-4 mt-2 pl-1">
          {renaming ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setRenaming(false); }}
                className="flex-1 py-1.5 px-3 bg-zinc-800 rounded-lg text-[15px] text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
                autoFocus
              />
              <button onClick={handleRename} className="text-[13px] text-[#007AFF] active:opacity-60 font-medium">Save</button>
              <button onClick={() => setRenaming(false)} className="text-[13px] text-zinc-500 active:opacity-60">Cancel</button>
            </div>
          ) : (
            <>
              <button
                onClick={() => { setRenameValue(selectedIdentity.name); setRenaming(true); }}
                className="text-[13px] text-zinc-400 active:opacity-60 transition-opacity flex items-center gap-1"
              >
                ✏️ Rename
              </button>
              <button
                onClick={handleDuplicate}
                className="text-[13px] text-zinc-400 active:opacity-60 transition-opacity flex items-center gap-1"
              >
                📋 Duplicate
              </button>
              {identities.length > 1 && (
                <button
                  onClick={handleDelete}
                  className="text-[13px] text-red-400/70 active:opacity-60 transition-opacity flex items-center gap-1"
                >
                  🗑️ Delete
                </button>
              )}
            </>
          )}
        </div>
      )}

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
