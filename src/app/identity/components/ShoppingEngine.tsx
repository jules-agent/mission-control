'use client';

import { useState, useEffect, useRef } from 'react';

interface ShoppingEngineProps {
  identityId: string;
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

export function ShoppingEngine({ identityId, onClose }: ShoppingEngineProps) {
  const [step, setStep] = useState<'budget' | 'category' | 'results'>('budget');
  const [budgetMin, setBudgetMin] = useState(25);
  const [budgetMax, setBudgetMax] = useState(100);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const resultsRef = useRef<HTMLDivElement>(null);

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
      const response = await fetch('/api/identity/shopping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identityId,
          category: selectedCategory,
          budgetMin,
          budgetMax,
          offset: newOffset,
          limit: 10,
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
                    className="px-4 py-3 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 border border-zinc-800 rounded-xl text-[15px] font-medium transition-all"
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
              <p className="text-[15px] text-zinc-500">
                ${budgetMin} - ${budgetMax}
              </p>
            </div>

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
                  <p className="text-[13px] text-zinc-500">{product.store}</p>
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
    </div>
  );
}
