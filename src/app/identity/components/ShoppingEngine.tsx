'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ThumbsDownFlow } from './ThumbsDownFlow';

interface ShoppingEngineProps {
  identityId: string;
  categories?: { id: string; name: string; parent_id: string | null; subcategories?: any[] }[];
  influences?: Record<string, any[]>;
  onAddInfluence?: (categoryId: string, influence: { name: string; alignment: number; position: number }) => void;
  onClose: () => void;
}

interface Product {
  name: string;
  price: string;
  reason: string;
  store: string;
  url: string;
  imageHint?: string;
}

type Category = 
  | 'books' 
  | 'fashion' 
  | 'music' 
  | 'gaming' 
  | 'home' 
  | 'kitchen' 
  | 'fitness' 
  | 'art' 
  | 'kids' 
  | 'automotive' 
  | 'gifts' 
  | 'surprise';

interface CategoryOption {
  id: Category;
  name: string;
  icon: string;
  description: string;
}

const CATEGORIES: CategoryOption[] = [
  { id: 'books', name: 'Books', icon: '📚', description: 'Based on interests' },
  { id: 'fashion', name: 'Fashion', icon: '👔', description: 'Sized for you' },
  { id: 'music', name: 'Music', icon: '🎵', description: 'Vinyl, merch, gear' },
  { id: 'gaming', name: 'Gaming & Electronics', icon: '🎮', description: 'Tech & games' },
  { id: 'home', name: 'Home & Living', icon: '🏠', description: 'Decor & furniture' },
  { id: 'kitchen', name: 'Kitchen & Cooking', icon: '🍳', description: 'Based on food prefs' },
  { id: 'fitness', name: 'Fitness & Health', icon: '🏋️', description: 'Wellness items' },
  { id: 'art', name: 'Art & Hobbies', icon: '🎨', description: 'Creative supplies' },
  { id: 'kids', name: 'Kids & Toys', icon: '🧸', description: 'For children' },
  { id: 'automotive', name: 'Automotive', icon: '🚗', description: 'Car accessories' },
  { id: 'gifts', name: 'Gift Ideas', icon: '🎁', description: 'Perfect gifts' },
  { id: 'surprise', name: 'Surprise Me', icon: '✨', description: 'Random discovery' },
];

const BUDGET_PRESETS = [
  { label: 'Under $25', min: 0, max: 25 },
  { label: '$25-50', min: 25, max: 50 },
  { label: '$50-100', min: 50, max: 100 },
  { label: '$100-250', min: 100, max: 250 },
  { label: '$250-500', min: 250, max: 500 },
  { label: '$500+', min: 500, max: 10000 },
];

export function ShoppingEngine({ identityId, categories: identityCategories, influences, onAddInfluence, onClose }: ShoppingEngineProps) {
  const [step, setStep] = useState<'budget' | 'category' | 'results'>('budget');
  const [budgetMin, setBudgetMin] = useState(25);
  const [budgetMax, setBudgetMax] = useState(100);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [thumbsDownItem, setThumbsDownItem] = useState<string | null>(null);
  const [thumbsUpItem, setThumbsUpItem] = useState<Product | null>(null);
  const [savedItems, setSavedItems] = useState<Record<string, Product[]>>(() => {
    try { return JSON.parse(localStorage.getItem('shopping-saved') || '{}'); } catch { return {}; }
  });
  const [showSaved, setShowSaved] = useState(false);
  const [blockedItems, setBlockedItems] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('shopping-blocked') || '[]'); } catch { return []; }
  });

  function saveForLater(product: Product) {
    const cat = selectedCategory || 'general';
    const updated = { ...savedItems };
    if (!updated[cat]) updated[cat] = [];
    if (!updated[cat].find(p => p.name === product.name)) {
      updated[cat].push(product);
      setSavedItems(updated);
      localStorage.setItem('shopping-saved', JSON.stringify(updated));
    }
    setThumbsUpItem(null);
  }

  const totalSaved = Object.values(savedItems).reduce((sum, items) => sum + items.length, 0);

  function blockItem(name: string) {
    const updated = [...blockedItems, name];
    setBlockedItems(updated);
    localStorage.setItem('shopping-blocked', JSON.stringify(updated));
    setProducts(prev => prev.filter(p => p.name !== name));
    setThumbsDownItem(null);
  }

  function flattenCategories(cats: any[], depth = 0): { id: string; name: string; depth: number }[] {
    const result: { id: string; name: string; depth: number }[] = [];
    for (const cat of (cats || [])) {
      result.push({ id: cat.id, name: cat.name, depth });
      if (cat.subcategories) result.push(...flattenCategories(cat.subcategories, depth + 1));
    }
    return result;
  }

  const flatCats = flattenCategories(identityCategories || []);

  // Infinite scroll handler
  useEffect(() => {
    if (step !== 'results' || !hasMore || loading) return;

    const container = resultsRef.current;
    if (!container) return;

    function handleScroll() {
      if (!container) return;
      const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      if (scrollBottom < 200 && hasMore && !loading) {
        loadMoreProducts();
      }
    }

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [step, hasMore, loading, offset]);

  async function loadProducts(newOffset: number = 0) {
    if (!selectedCategory) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/identity/shopping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({
          identityId,
          category: selectedCategory,
          budgetMin,
          budgetMax,
          offset: newOffset,
          limit: 10,
          blocked: blockedItems,
        }),
      });

      if (!response.ok) throw new Error('Failed to load products');

      const data = await response.json();
      
      if (newOffset === 0) {
        setProducts(data.products || []);
      } else {
        setProducts(prev => [...prev, ...(data.products || [])]);
      }

      if (!data.products || data.products.length < 10) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      alert('Failed to load recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function loadMoreProducts() {
    const newOffset = offset + 10;
    setOffset(newOffset);
    loadProducts(newOffset);
  }

  function handleCategorySelect(category: Category) {
    setSelectedCategory(category);
    setStep('results');
    setOffset(0);
    setHasMore(true);
    loadProducts(0);
  }

  function handleBack() {
    if (step === 'results') {
      setStep('category');
      setProducts([]);
      setOffset(0);
      setHasMore(true);
    } else if (step === 'category') {
      setStep('budget');
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-zinc-800/60">
        <div className="max-w-md landscape:max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={step === 'budget' ? onClose : handleBack}
            className="text-[17px] text-[#007AFF] active:opacity-60 transition-opacity flex items-center gap-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            {step === 'budget' ? 'Close' : 'Back'}
          </button>
          <h2 className="text-[17px] font-semibold">Shopping</h2>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md landscape:max-w-2xl mx-auto px-4 py-6 h-full overflow-y-auto" ref={resultsRef}>
        {/* Step 1: Budget */}
        {step === 'budget' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-[22px] font-semibold mb-2">Set your budget</h3>
              <p className="text-[15px] text-zinc-500">We'll find items in this price range</p>
            </div>

            {/* Budget Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] text-zinc-500 mb-2">Min ($)</label>
                <input
                  type="number"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-[17px] text-white focus:outline-none focus:border-[#007AFF] transition-colors"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-[13px] text-zinc-500 mb-2">Max ($)</label>
                <input
                  type="number"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-[17px] text-white focus:outline-none focus:border-[#007AFF] transition-colors"
                  min={0}
                />
              </div>
            </div>

            {/* Budget Presets */}
            <div>
              <p className="text-[13px] text-zinc-500 mb-3">Quick select:</p>
              <div className="grid grid-cols-2 gap-3">
                {BUDGET_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      setBudgetMin(preset.min);
                      setBudgetMax(preset.max);
                    }}
                    className={`px-4 py-3 rounded-xl text-[15px] font-medium transition-all border ${
                      budgetMin === preset.min && budgetMax === preset.max
                        ? 'bg-[#007AFF] border-[#007AFF] text-white'
                        : 'bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 border-zinc-800'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Next Button */}
            <button
              onClick={() => setStep('category')}
              className="w-full py-4 bg-[#007AFF] hover:bg-[#0071E3] active:bg-[#0064CC] rounded-xl text-[17px] font-semibold transition-all"
            >
              Next
            </button>
          </div>
        )}

        {/* Step 2: Category Selection */}
        {step === 'category' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-[22px] font-semibold mb-2">What are you looking for?</h3>
              <p className="text-[15px] text-zinc-500">
                ${budgetMin} - ${budgetMax}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className="p-4 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 border border-zinc-800 rounded-xl transition-all text-left min-h-[100px] flex flex-col justify-between"
                >
                  <div className="text-[32px] mb-2">{category.icon}</div>
                  <div>
                    <p className="text-[15px] font-semibold mb-0.5">{category.name}</p>
                    <p className="text-[12px] text-zinc-500">{category.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 'results' && (
          <div className="space-y-4 pb-8">
            <div className="mb-6">
              <h3 className="text-[22px] font-semibold mb-1">
                {CATEGORIES.find(c => c.id === selectedCategory)?.name}
              </h3>
              <div className="flex items-center justify-between">
                <p className="text-[15px] text-zinc-500">
                  ${budgetMin} - ${budgetMax}
                </p>
                {totalSaved > 0 && (
                  <button
                    onClick={() => setShowSaved(!showSaved)}
                    className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                      showSaved ? 'bg-[#007AFF] text-white' : 'bg-zinc-800 border border-zinc-700 text-zinc-400'
                    }`}
                  >
                    ❤️ Saved ({totalSaved})
                  </button>
                )}
              </div>
            </div>

            {/* Saved Items View */}
            {showSaved && (
              <div className="space-y-3 mb-4">
                {Object.entries(savedItems).map(([cat, items]) => (
                  items.length > 0 && (
                    <div key={cat}>
                      <p className="text-[13px] text-zinc-500 font-medium uppercase tracking-wider mb-2">
                        {CATEGORIES.find(c => c.id === cat)?.name || cat}
                      </p>
                      {items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-xl mb-2">
                          <div className="flex-1 min-w-0 mr-3">
                            <p className="text-[15px] font-medium text-white truncate">{item.name}</p>
                            <p className="text-[13px] text-[#34C759]">{item.price}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[13px] text-[#007AFF] active:opacity-60">View</a>
                            <button
                              onClick={() => {
                                const updated = { ...savedItems };
                                updated[cat] = updated[cat].filter(p => p.name !== item.name);
                                if (updated[cat].length === 0) delete updated[cat];
                                setSavedItems(updated);
                                localStorage.setItem('shopping-saved', JSON.stringify(updated));
                              }}
                              className="text-[13px] text-red-400 active:opacity-60"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ))}
              </div>
            )}

            {/* Product Cards */}
            {products.map((product, index) => (
              <div
                key={`${product.name}-${index}`}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3"
              >
                <div>
                  <h4 className="text-[17px] font-semibold text-white mb-1">{product.name}</h4>
                  <p className="text-[20px] font-bold text-[#34C759]">{product.price}</p>
                </div>

                <p className="text-[15px] text-zinc-400 italic">
                  {product.reason}
                </p>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] text-zinc-500">{product.store}</p>
                    <button
                      onClick={() => setThumbsUpItem(product)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all text-[14px] ${
                        savedItems[selectedCategory || '']?.find(p => p.name === product.name)
                          ? 'bg-green-900/30 border-green-700/50 text-green-400'
                          : 'bg-zinc-800 border-green-900/30 text-green-400 hover:bg-green-900/20 active:opacity-60'
                      }`}
                      title="Save for later"
                    >
                      👍
                    </button>
                    <button
                      onClick={() => setThumbsDownItem(product.name)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800 border border-red-900/30 text-red-400 hover:bg-red-900/20 active:opacity-60 transition-all text-[14px]"
                      title="Never show again"
                    >
                      👎
                    </button>
                  </div>
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-[#007AFF] hover:bg-[#0071E3] active:bg-[#0064CC] rounded-lg text-[15px] font-semibold transition-all inline-flex items-center gap-1"
                  >
                    View
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}

            {/* Loading State */}
            {loading && (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3 animate-pulse"
                  >
                    <div className="h-5 bg-zinc-800 rounded w-3/4" />
                    <div className="h-6 bg-zinc-800 rounded w-1/4" />
                    <div className="h-4 bg-zinc-800 rounded w-full" />
                    <div className="h-10 bg-zinc-800 rounded" />
                  </div>
                ))}
              </div>
            )}

            {/* No More Results */}
            {!hasMore && products.length > 0 && (
              <p className="text-center text-zinc-500 text-[15px] py-4">
                That's all we found!
              </p>
            )}

            {/* Empty State */}
            {!loading && products.length === 0 && (
              <div className="text-center py-16">
                <p className="text-zinc-500 text-[17px]">No recommendations found</p>
                <button
                  onClick={handleBack}
                  className="mt-4 text-[#007AFF] text-[15px] active:opacity-60 transition-opacity"
                >
                  Try another category
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Thumbs Up - Save for Later */}
      {thumbsUpItem && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-end sm:items-center justify-center" onClick={() => setThumbsUpItem(null)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-t-2xl sm:rounded-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-zinc-800/60">
              <h3 className="text-[17px] font-semibold text-white">👍 Save for later?</h3>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-[15px] text-zinc-400">
                Save <span className="text-white font-medium">{thumbsUpItem.name}</span> ({thumbsUpItem.price}) to your wishlist?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setThumbsUpItem(null)}
                  className="flex-1 py-3 rounded-xl text-[15px] font-semibold bg-zinc-800 border border-zinc-700 text-zinc-300 active:opacity-80 transition-all"
                >
                  No thanks
                </button>
                <button
                  onClick={() => saveForLater(thumbsUpItem)}
                  className="flex-1 py-3 rounded-xl text-[15px] font-semibold bg-[#34C759] text-white active:opacity-80 transition-all"
                >
                  ❤️ Save it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Thumbs Down Flow */}
      {thumbsDownItem && (
        <ThumbsDownFlow
          itemName={thumbsDownItem}
          engineType="shopping"
          categories={flatCats}
          onDismiss={() => {
            blockItem(thumbsDownItem);
          }}
          onAddToIdentity={(reason, categoryId) => {
            blockItem(thumbsDownItem);
            if (categoryId && onAddInfluence) {
              const existingCount = influences?.[categoryId]?.length || 0;
              onAddInfluence(categoryId, {
                name: reason,
                alignment: 0,
                position: existingCount,
              });
            }
          }}
        />
      )}
    </div>
  );
}
