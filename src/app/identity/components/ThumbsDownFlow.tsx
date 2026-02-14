'use client';

import { useState } from 'react';
import { titleCase } from '@/lib/titleCase';

interface ThumbsDownFlowProps {
  itemName: string;
  engineType: 'shopping' | 'food';
  onDismiss: () => void; // just close the flow
  onAddToIdentity: (reason: string, categoryId: string | null) => void; // save as 0% interest
  categories: { id: string; name: string; depth: number }[];
}

type Step = 'reason' | 'askIdentity' | 'pickCategory' | 'done';

export function ThumbsDownFlow({ itemName, engineType, onDismiss, onAddToIdentity, categories }: ThumbsDownFlowProps) {
  const [step, setStep] = useState<Step>('reason');
  const [reason, setReason] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = searchQuery
    ? categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : categories;

  return (
    <div className="fixed inset-0 bg-black/80 z-[9999] flex items-end sm:items-center justify-center" onClick={onDismiss}>
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[70vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800/60 flex items-center justify-between">
          <h3 className="text-[17px] font-semibold text-white">
            {step === 'reason' && '👎 Not for me'}
            {step === 'askIdentity' && 'Add to Identity?'}
            {step === 'pickCategory' && 'Select Category'}
            {step === 'done' && '✓ Done'}
          </h3>
          <button onClick={onDismiss} className="text-zinc-500 hover:text-zinc-300 text-[15px] p-1">✕</button>
        </div>

        <div className="px-5 py-4">
          {/* Step 1: Reason (optional) */}
          {step === 'reason' && (
            <div className="space-y-4">
              <p className="text-[15px] text-zinc-400">
                <span className="text-white font-medium">{itemName}</span> won't be recommended again.
              </p>
              <div>
                <label className="text-[13px] text-zinc-500 uppercase tracking-wider font-medium block mb-2">
                  Why? (optional)
                </label>
                <textarea
                  value={reason}
                  onChange={e => setReason(titleCase(e.target.value))}
                  placeholder="e.g. Don't like this brand, too expensive, not my style..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-[15px] text-white placeholder-zinc-600 focus:outline-none focus:border-[#007AFF] resize-none"
                  rows={3}
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (reason.trim()) {
                      setStep('askIdentity');
                    } else {
                      // No reason given, just block and close
                      onDismiss();
                    }
                  }}
                  className="flex-1 py-3 rounded-xl text-[15px] font-semibold bg-[#007AFF] text-white active:opacity-80 transition-all"
                >
                  {reason.trim() ? 'Next' : 'Skip & Block'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Ask about identity */}
          {step === 'askIdentity' && (
            <div className="space-y-4">
              <p className="text-[15px] text-zinc-400">
                Do you want to add <span className="text-white font-medium">"{reason}"</span> as a distaste to your identity?
              </p>
              <p className="text-[13px] text-zinc-600">
                This helps personalize all future recommendations across the app.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    // Don't add to identity, just block item
                    onDismiss();
                  }}
                  className="flex-1 py-3 rounded-xl text-[15px] font-semibold bg-zinc-800 border border-zinc-700 text-zinc-300 active:opacity-80 transition-all"
                >
                  No, skip
                </button>
                <button
                  onClick={() => setStep('pickCategory')}
                  className="flex-1 py-3 rounded-xl text-[15px] font-semibold bg-[#007AFF] text-white active:opacity-80 transition-all"
                >
                  Yes, add it
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Pick category */}
          {step === 'pickCategory' && (
            <div className="space-y-3">
              <p className="text-[13px] text-zinc-500">
                Which category does this belong to?
              </p>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search categories..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-[13px] text-white placeholder-zinc-600 focus:outline-none focus:border-[#007AFF]"
                autoFocus
              />
              <div className="max-h-[30vh] overflow-y-auto space-y-1">
                {filteredCategories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-[15px] transition-all ${
                      selectedCategoryId === cat.id
                        ? 'bg-[#007AFF] text-white'
                        : 'text-zinc-300 hover:bg-zinc-800 active:bg-zinc-700'
                    }`}
                    style={{ paddingLeft: `${12 + cat.depth * 16}px` }}
                  >
                    {cat.depth > 0 && <span className="text-zinc-600 mr-1">└</span>}
                    {cat.name}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  onAddToIdentity(reason, selectedCategoryId);
                  setStep('done');
                }}
                disabled={!selectedCategoryId}
                className="w-full py-3 rounded-xl text-[15px] font-semibold bg-[#007AFF] text-white active:opacity-80 transition-all disabled:opacity-30"
              >
                Add as Distaste (0%)
              </button>
            </div>
          )}

          {/* Done */}
          {step === 'done' && (
            <div className="text-center py-4 space-y-3">
              <p className="text-[20px]">✓</p>
              <p className="text-[15px] text-zinc-400">
                Added <span className="text-white font-medium">"{reason}"</span> to your identity at 0% alignment.
              </p>
              <button
                onClick={onDismiss}
                className="px-6 py-2.5 rounded-xl text-[15px] font-semibold bg-zinc-800 text-zinc-300 active:opacity-80"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
