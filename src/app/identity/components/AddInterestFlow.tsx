'use client';

import { useState, useRef, useEffect } from 'react';
import { titleCase } from '@/lib/titleCase';

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

interface AddInterestFlowProps {
  identityId: string;
  categories: Category[];
  influences: Record<string, Influence[]>;
  onSave: (categoryId: string, influence: { name: string; alignment: number; position: number }) => Promise<void>;
  onCreateCategory: (name: string, type: string, parentId: string | null) => Promise<string | null>;
  onClose: () => void;
  initialInterest?: string;
  initialAlignment?: number;
  sourceCategory?: string;
}

type Step = 'input' | 'categorizing' | 'confirm-category' | 'pick-category' | 'alignment' | 'position' | 'saving' | 'done';

export function AddInterestFlow({ identityId, categories, influences, onSave, onCreateCategory, onClose, initialInterest, initialAlignment, sourceCategory }: AddInterestFlowProps) {
  const [step, setStep] = useState<Step>(initialInterest ? 'categorizing' : 'input');
  const [interest, setInterest] = useState(initialInterest || '');
  const [suggestedCategory, setSuggestedCategory] = useState('');
  const [suggestedCategoryId, setSuggestedCategoryId] = useState<string | null>(null);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [suggestedType, setSuggestedType] = useState('custom');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [alignment, setAlignment] = useState(initialAlignment || 85);
  const [position, setPosition] = useState(0);
  const [categoryInfluences, setCategoryInfluences] = useState<Influence[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (initialInterest) {
      // Auto-categorize the pre-populated interest
      handleSubmitInterestAuto(initialInterest);
    } else {
      inputRef.current?.focus();
    }
    // Cleanup: stop mic on unmount
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Flatten categories for picker
  function flattenCategories(cats: Category[], depth = 0): { id: string; name: string; depth: number; fullPath: string }[] {
    const result: { id: string; name: string; depth: number; fullPath: string }[] = [];
    for (const cat of cats) {
      result.push({ id: cat.id, name: cat.name, depth, fullPath: cat.name });
      if (cat.subcategories?.length) {
        for (const sub of cat.subcategories) {
          result.push({ id: sub.id, name: sub.name, depth: depth + 1, fullPath: `${cat.name} › ${sub.name}` });
          if (sub.subcategories?.length) {
            for (const subsub of sub.subcategories) {
              result.push({ id: subsub.id, name: subsub.name, depth: depth + 2, fullPath: `${cat.name} › ${sub.name} › ${subsub.name}` });
            }
          }
        }
      }
    }
    return result;
  }

  const flatCats = flattenCategories(categories);

  // Speech recognition
  function toggleMic() {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setInterest(titleCase(text));
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }

  async function handleSubmitInterestAuto(text: string) {
    setStep('categorizing');
    setError('');
    try {
      const res = await fetch('/api/identity/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interest: text.trim(), identityId, sourceCategory }),
      });
      const data = await res.json();
      setSuggestedCategory(data.category);
      setSuggestedCategoryId(data.categoryId);
      setIsNewCategory(data.isNew);
      setSuggestedType(data.suggestedType || 'custom');
      setStep('confirm-category');
    } catch {
      setError('Failed to categorize. Try again.');
      setStep('input');
    }
  }

  async function handleSubmitInterest() {
    if (!interest.trim()) return;
    setStep('categorizing');
    setError('');
    try {
      const res = await fetch('/api/identity/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interest: interest.trim(), identityId }),
      });
      const data = await res.json();
      setSuggestedCategory(data.category);
      setSuggestedCategoryId(data.categoryId);
      setIsNewCategory(data.isNew);
      setSuggestedType(data.suggestedType || 'custom');
      setStep('confirm-category');
    } catch {
      setError('Failed to categorize. Try again.');
      setStep('input');
    }
  }

  function acceptCategory() {
    if (suggestedCategoryId) {
      setSelectedCategoryId(suggestedCategoryId);
      setSelectedCategoryName(suggestedCategory);
      loadCategoryInfluences(suggestedCategoryId);
      setStep('alignment');
    } else {
      // New category — will create on save
      setSelectedCategoryId(null);
      setSelectedCategoryName(suggestedCategory);
      setCategoryInfluences([]);
      setStep('alignment');
    }
  }

  function rejectCategory() {
    setStep('pick-category');
  }

  function pickCategory(catId: string, catName: string) {
    setSelectedCategoryId(catId);
    setSelectedCategoryName(catName);
    setIsNewCategory(false);
    loadCategoryInfluences(catId);
    setStep('alignment');
  }

  function loadCategoryInfluences(catId: string) {
    const existing = influences[catId] || [];
    setCategoryInfluences(existing.sort((a, b) => a.position - b.position));
    setPosition(0); // Top by default
  }

  function moveUp() {
    if (position > 0) setPosition(position - 1);
  }

  function moveDown() {
    if (position < categoryInfluences.length) setPosition(position + 1);
  }

  async function handleSave() {
    setStep('saving');
    try {
      let catId = selectedCategoryId;
      if (!catId && isNewCategory) {
        catId = await onCreateCategory(selectedCategoryName, suggestedType, null);
      }
      if (!catId) {
        setError('Failed to create category');
        setStep('alignment');
        return;
      }
      await onSave(catId, { name: interest.trim(), alignment, position });
      setStep('done');
    } catch {
      setError('Failed to save');
      setStep('alignment');
    }
  }

  function addAnother() {
    setInterest('');
    setSuggestedCategory('');
    setSuggestedCategoryId(null);
    setSelectedCategoryId(null);
    setSelectedCategoryName('');
    setAlignment(85);
    setPosition(0);
    setCategoryInfluences([]);
    setIsNewCategory(false);
    setError('');
    setStep('input');
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="w-full max-w-lg bg-zinc-900 rounded-t-2xl sm:rounded-2xl border border-zinc-800 overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/60">
          <h2 className="text-[17px] font-semibold">Add Interest</h2>
          <button onClick={() => { try { recognitionRef.current?.stop(); } catch {} onClose(); }} className="text-zinc-500 hover:text-zinc-300 text-[15px]">Done</button>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex-1">
          {error && (
            <div className="mb-3 text-[13px] text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</div>
          )}

          {/* Step 1: Input */}
          {step === 'input' && (
            <div className="space-y-4">
              <p className="text-[13px] text-zinc-500">What are you into?</p>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={interest}
                  onChange={(e) => setInterest(titleCase(e.target.value))}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitInterest()}
                  placeholder="e.g. Radiohead, sushi, stoicism..."
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-[15px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                />
                <button
                  onClick={toggleMic}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    isListening ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                  } border`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                </button>
              </div>
              <button
                onClick={handleSubmitInterest}
                disabled={!interest.trim()}
                className="w-full py-3 rounded-xl text-[15px] font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-[#007AFF] hover:bg-[#0071E3] active:bg-[#0064CC] text-white"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Categorizing */}
          {step === 'categorizing' && (
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="w-8 h-8 border-2 border-zinc-600 border-t-[#007AFF] rounded-full animate-spin" />
              <p className="text-[14px] text-zinc-500">Categorizing "{interest}"...</p>
            </div>
          )}

          {/* Step 3: Confirm Category */}
          {step === 'confirm-category' && (
            <div className="space-y-4">
              <div className="text-center py-2">
                <p className="text-[13px] text-zinc-500 mb-1">"{interest}" fits in:</p>
                <p className="text-[19px] font-semibold">
                  {isNewCategory && <span className="text-[11px] font-normal text-[#007AFF] bg-[#007AFF]/10 rounded-full px-2 py-0.5 mr-2">NEW</span>}
                  {suggestedCategory}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={rejectCategory}
                  className="flex-1 py-3 rounded-xl text-[15px] font-medium bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-750 active:bg-zinc-700 transition-all"
                >
                  ✕ Pick Different
                </button>
                <button
                  onClick={acceptCategory}
                  className="flex-1 py-3 rounded-xl text-[15px] font-semibold bg-[#34C759] hover:bg-[#2DB84E] active:bg-[#28A745] text-white transition-all"
                >
                  ✓ Looks Good
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Pick Category */}
          {step === 'pick-category' && (
            <div className="space-y-3">
              <p className="text-[13px] text-zinc-500">Choose a category for "{interest}":</p>
              <div className="max-h-[50vh] overflow-y-auto space-y-1">
                {flatCats.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => pickCategory(cat.id, cat.fullPath)}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-zinc-800 active:bg-zinc-750 transition-colors flex items-center"
                    style={{ paddingLeft: `${12 + cat.depth * 20}px` }}
                  >
                    <span className="text-[14px] text-zinc-300">{cat.depth > 0 ? '└ ' : ''}{cat.name}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setIsNewCategory(true); setStep('confirm-category'); }}
                className="w-full py-2.5 rounded-lg text-[13px] text-[#007AFF] hover:bg-[#007AFF]/10 transition-colors"
              >
                + Create "{suggestedCategory}" as new category
              </button>
            </div>
          )}

          {/* Step 5: Alignment */}
          {step === 'alignment' && (
            <div className="space-y-5">
              <div>
                <p className="text-[13px] text-zinc-500 mb-1">Adding to: <span className="text-zinc-300">{selectedCategoryName}</span></p>
                <p className="text-[17px] font-semibold">{interest}</p>
              </div>
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <label className="text-[13px] text-zinc-500">Alignment</label>
                  <span className="text-[15px] font-medium" style={{ color: alignment >= 60 ? '#34C759' : alignment >= 40 ? '#FFD60A' : '#FF9500' }}>{alignment}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={alignment}
                  onChange={(e) => setAlignment(Number(e.target.value))}
                  className="w-full accent-[#007AFF]"
                />
              </div>

              {/* Position / Ranking */}
              {categoryInfluences.length > 0 && (
                <div>
                  <label className="text-[13px] text-zinc-500 mb-2 block">Rank within category</label>
                  <div className="bg-zinc-800 rounded-xl border border-zinc-700 overflow-hidden">
                    {categoryInfluences.map((inf, i) => (
                      <div key={inf.id || i}>
                        {position === i && (
                          <div className="px-3 py-2 bg-[#007AFF]/15 border-y border-[#007AFF]/30 flex items-center gap-2">
                            <span className="text-[13px] text-[#007AFF] font-medium">→ {interest}</span>
                            <div className="ml-auto flex gap-1">
                              <button onClick={moveUp} disabled={position === 0} className="text-zinc-500 hover:text-white disabled:opacity-20 p-1">▲</button>
                              <button onClick={moveDown} disabled={position >= categoryInfluences.length} className="text-zinc-500 hover:text-white disabled:opacity-20 p-1">▼</button>
                            </div>
                          </div>
                        )}
                        <div className="px-3 py-2 text-[13px] text-zinc-400 border-b border-zinc-800 last:border-0">{inf.name}</div>
                      </div>
                    ))}
                    {position >= categoryInfluences.length && (
                      <div className="px-3 py-2 bg-[#007AFF]/15 border-t border-[#007AFF]/30 flex items-center gap-2">
                        <span className="text-[13px] text-[#007AFF] font-medium">→ {interest}</span>
                        <div className="ml-auto flex gap-1">
                          <button onClick={moveUp} disabled={position === 0} className="text-zinc-500 hover:text-white disabled:opacity-20 p-1">▲</button>
                          <button onClick={moveDown} disabled={position >= categoryInfluences.length} className="text-zinc-500 hover:text-white disabled:opacity-20 p-1">▼</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={handleSave}
                className="w-full py-3 rounded-xl text-[15px] font-semibold bg-[#007AFF] hover:bg-[#0071E3] active:bg-[#0064CC] text-white transition-all"
              >
                Save Interest
              </button>
            </div>
          )}

          {/* Step 6: Saving */}
          {step === 'saving' && (
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="w-8 h-8 border-2 border-zinc-600 border-t-[#34C759] rounded-full animate-spin" />
              <p className="text-[14px] text-zinc-500">Saving...</p>
            </div>
          )}

          {/* Step 7: Done */}
          {step === 'done' && (
            <div className="space-y-4 text-center py-4">
              <div className="text-[40px]">✓</div>
              <div>
                <p className="text-[17px] font-semibold text-white">{interest}</p>
                <p className="text-[13px] text-zinc-500 mt-1">Added to {selectedCategoryName} at {alignment}%</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl text-[15px] font-medium bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-750 transition-all"
                >
                  Done
                </button>
                <button
                  onClick={addAnother}
                  className="flex-1 py-3 rounded-xl text-[15px] font-semibold bg-[#007AFF] hover:bg-[#0071E3] active:bg-[#0064CC] text-white transition-all"
                >
                  + Add Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
