'use client';

import { useState, useRef } from 'react';

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
}

export function IdentitySwitcher({
  identities,
  selectedIdentity,
  onSelectIdentity,
  onCreateIdentity,
  onRenameIdentity,
  onDeleteIdentity,
  onDuplicateIdentity,
}: IdentitySwitcherProps) {
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleCreateNew = async () => {
    const name = prompt('New identity name:');
    if (!name?.trim()) return;
    await onCreateIdentity(name.trim());
  };

  const handleRename = async (identity: Identity) => {
    const newName = prompt('Rename identity:', identity.name);
    if (!newName?.trim() || newName === identity.name) return;
    await onRenameIdentity(identity, newName.trim());
    setMenuOpen(null);
  };

  const handleDelete = async (identity: Identity) => {
    if (identities.length === 1) {
      alert('Cannot delete the only identity');
      return;
    }
    if (!confirm(`Delete "${identity.name}"? This will remove all categories and influences.`)) return;
    await onDeleteIdentity(identity);
    setMenuOpen(null);
  };

  const handleDuplicate = async (identity: Identity) => {
    const name = prompt('Name for duplicate identity:', `${identity.name} (Copy)`);
    if (!name?.trim()) return;
    await onDuplicateIdentity(identity);
    setMenuOpen(null);
  };

  return (
    <div className="mb-6">
      {/* Horizontal scrollable pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {identities.map((identity) => (
          <div key={identity.id} className="relative flex-shrink-0">
            <button
              onClick={() => onSelectIdentity(identity)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-full transition-all touch-manipulation
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
                  Base
                </span>
              )}
            </button>
            
            {/* Three-dot menu */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(menuOpen === identity.id ? null : identity.id);
              }}
              className={`
                absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center
                ${selectedIdentity?.id === identity.id ? 'bg-blue-600' : 'bg-zinc-700'}
                active:scale-95 transition-transform touch-manipulation
              `}
            >
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 16 16">
                <circle cx="8" cy="2" r="1.5" />
                <circle cx="8" cy="8" r="1.5" />
                <circle cx="8" cy="14" r="1.5" />
              </svg>
            </button>

            {/* Menu dropdown */}
            {menuOpen === identity.id && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(null)}
                />
                <div
                  ref={menuRef}
                  className="absolute top-full right-0 mt-2 w-48 bg-zinc-900 rounded-xl shadow-2xl border border-zinc-800 overflow-hidden z-50"
                >
                  <button
                    onClick={() => handleRename(identity)}
                    className="w-full px-4 py-3 text-left text-[15px] text-white hover:bg-zinc-800 active:bg-zinc-700 transition-colors flex items-center gap-3"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                    Rename
                  </button>
                  <button
                    onClick={() => handleDuplicate(identity)}
                    className="w-full px-4 py-3 text-left text-[15px] text-white hover:bg-zinc-800 active:bg-zinc-700 transition-colors flex items-center gap-3 border-t border-zinc-800/60"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                    </svg>
                    Duplicate
                  </button>
                  <button
                    onClick={() => handleDelete(identity)}
                    className="w-full px-4 py-3 text-left text-[15px] text-red-400 hover:bg-zinc-800 active:bg-zinc-700 transition-colors flex items-center gap-3 border-t border-zinc-800/60"
                    disabled={identities.length === 1}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    {identities.length === 1 ? 'Cannot Delete' : 'Delete'}
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {/* New Identity Button */}
        <button
          onClick={handleCreateNew}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full bg-zinc-800/40 border-2 border-dashed border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300 active:bg-zinc-700/60 transition-all touch-manipulation"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="text-[15px] font-medium whitespace-nowrap">New Identity</span>
        </button>
      </div>

      {/* Hide scrollbar globally */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
