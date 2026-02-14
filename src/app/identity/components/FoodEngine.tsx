'use client';

import { useState, useEffect, useRef } from 'react';

interface FoodEngineProps {
  identityId: string;
  categories: Category[];
  influences: Record<string, Influence[]>;
  location: {
    city?: string;
    state?: string;
    country?: string;
  };
  onAddInfluence?: (categoryId: string, influence: { name: string; alignment: number; position: number }) => void;
  onClose: () => void;
}

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

interface Restaurant {
  name: string;
  cuisine: string;
  priceRange: string;
  time: number; // minutes (drive time or delivery time)
  rating?: number;
  reason: string;
  address?: string;
  directionsUrl?: string;
  menuUrl?: string;
  deliveryPlatforms?: {
    name: string;
    url: string;
  }[];
}

type FoodCategory =
  | 'japanese'
  | 'bbq'
  | 'mexican'
  | 'italian'
  | 'korean'
  | 'indian'
  | 'mediterranean'
  | 'thai'
  | 'chinese'
  | 'american'
  | 'seafood'
  | 'healthy'
  | 'breakfast'
  | 'surprise';

interface FoodCategoryOption {
  id: FoodCategory;
  name: string;
  icon: string;
}

const FOOD_CATEGORIES: FoodCategoryOption[] = [
  { id: 'japanese', name: 'Japanese/Sushi', icon: '🍣' },
  { id: 'bbq', name: 'BBQ/Steakhouse', icon: '🥩' },
  { id: 'mexican', name: 'Mexican', icon: '🌮' },
  { id: 'italian', name: 'Italian/Pizza', icon: '🍕' },
  { id: 'korean', name: 'Korean', icon: '🥘' },
  { id: 'indian', name: 'Indian', icon: '🍛' },
  { id: 'mediterranean', name: 'Middle Eastern/Mediterranean', icon: '🧆' },
  { id: 'thai', name: 'Thai/Vietnamese', icon: '🍜' },
  { id: 'chinese', name: 'Chinese', icon: '🥡' },
  { id: 'american', name: 'American/Burgers', icon: '🍔' },
  { id: 'seafood', name: 'Seafood', icon: '🐟' },
  { id: 'healthy', name: 'Healthy/Salads', icon: '🥗' },
  { id: 'breakfast', name: 'Breakfast/Brunch', icon: '🍳' },
  { id: 'surprise', name: 'Surprise Me', icon: '🔥' },
];

const BUDGET_PRESETS = [
  { label: 'Under $15', min: 0, max: 15 },
  { label: '$15-30', min: 15, max: 30 },
  { label: '$30-50', min: 30, max: 50 },
  { label: '$50-100', min: 50, max: 100 },
  { label: '$100+ (Fine Dining)', min: 100, max: 500 },
];

const TIME_PRESETS = [5, 10, 15, 20, 30, 45, 60];

type DiningMode = 'dine-in' | 'delivery';

export function FoodEngine({ identityId, categories, influences, location, onClose }: FoodEngineProps) {
  const [step, setStep] = useState<'budget' | 'category' | 'location' | 'mode' | 'time' | 'results'>('budget');
  const [budgetMin, setBudgetMin] = useState(15);
  const [budgetMax, setBudgetMax] = useState(30);
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | null>(null);
  const [locationInput, setLocationInput] = useState({
    city: location.city || '',
    state: location.state || '',
    country: location.country || 'USA',
  });
  const [diningMode, setDiningMode] = useState<DiningMode | null>(null);
  const [maxTime, setMaxTime] = useState(15);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
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
        loadMoreRestaurants();
      }
    }

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [step, hasMore, loading, offset]);

  async function loadRestaurants(newOffset: number = 0) {
    if (!selectedCategory || !diningMode) return;

    setLoading(true);
    try {
      const response = await fetch('/api/identity/food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identityId,
          category: selectedCategory,
          budgetMin,
          budgetMax,
          location: locationInput,
          mode: diningMode,
          maxDriveMinutes: maxTime,
          offset: newOffset,
          limit: 10,
        }),
      });

      if (!response.ok) throw new Error('Failed to load restaurants');

      const data = await response.json();

      if (newOffset === 0) {
        setRestaurants(data.restaurants || []);
      } else {
        setRestaurants((prev) => [...prev, ...(data.restaurants || [])]);
      }

      if (!data.restaurants || data.restaurants.length < 10) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading restaurants:', error);
      alert('Failed to load recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function loadMoreRestaurants() {
    const newOffset = offset + 10;
    setOffset(newOffset);
    loadRestaurants(newOffset);
  }

  function handleCategorySelect(category: FoodCategory) {
    setSelectedCategory(category);
    setStep('location');
  }

  function handleLocationNext() {
    if (!locationInput.city || !locationInput.state) {
      alert('Please enter a city and state');
      return;
    }
    setStep('mode');
  }

  function handleModeSelect(mode: DiningMode) {
    setDiningMode(mode);
    setStep('time');
  }

  function handleTimeSelect(time: number) {
    setMaxTime(time);
    setStep('results');
    setOffset(0);
    setHasMore(true);
    loadRestaurants(0);
  }

  function handleBack() {
    if (step === 'results') {
      setStep('time');
      setRestaurants([]);
      setOffset(0);
      setHasMore(true);
    } else if (step === 'time') {
      setStep('mode');
    } else if (step === 'mode') {
      setStep('location');
    } else if (step === 'location') {
      setStep('category');
    } else if (step === 'category') {
      setStep('budget');
    }
  }

  const stepNumber =
    step === 'budget' ? 1 : step === 'category' ? 2 : step === 'location' ? 3 : step === 'mode' ? 4 : step === 'time' ? 5 : 6;

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
          <div className="flex items-center gap-2">
            <h2 className="text-[17px] font-semibold">Food</h2>
            <span className="text-[13px] text-zinc-500">Step {stepNumber}/6</span>
          </div>
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
              <p className="text-[15px] text-zinc-500">Per person</p>
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
              <h3 className="text-[22px] font-semibold mb-2">What are you craving?</h3>
              <p className="text-[15px] text-zinc-500">
                ${budgetMin} - ${budgetMax} per person
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {FOOD_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className="p-4 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 border border-zinc-800 rounded-xl transition-all text-left min-h-[100px] flex flex-col justify-between"
                >
                  <div className="text-[32px] mb-2">{category.icon}</div>
                  <div>
                    <p className="text-[15px] font-semibold">{category.name}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Location */}
        {step === 'location' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-[22px] font-semibold mb-2">Where are you?</h3>
              <p className="text-[15px] text-zinc-500">We'll find places nearby</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[13px] text-zinc-500 mb-2">City</label>
                <input
                  type="text"
                  value={locationInput.city}
                  onChange={(e) => setLocationInput({ ...locationInput, city: e.target.value })}
                  placeholder="e.g. Los Angeles"
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-[17px] text-white placeholder-zinc-600 focus:outline-none focus:border-[#007AFF] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[13px] text-zinc-500 mb-2">State</label>
                <input
                  type="text"
                  value={locationInput.state}
                  onChange={(e) => setLocationInput({ ...locationInput, state: e.target.value })}
                  placeholder="e.g. CA"
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-[17px] text-white placeholder-zinc-600 focus:outline-none focus:border-[#007AFF] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[13px] text-zinc-500 mb-2">Country</label>
                <input
                  type="text"
                  value={locationInput.country}
                  onChange={(e) => setLocationInput({ ...locationInput, country: e.target.value })}
                  placeholder="e.g. USA"
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-[17px] text-white placeholder-zinc-600 focus:outline-none focus:border-[#007AFF] transition-colors"
                />
              </div>
            </div>

            <button
              onClick={handleLocationNext}
              className="w-full py-4 bg-[#007AFF] hover:bg-[#0071E3] active:bg-[#0064CC] rounded-xl text-[17px] font-semibold transition-all"
            >
              Next
            </button>
          </div>
        )}

        {/* Step 4: Dining Mode */}
        {step === 'mode' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-[22px] font-semibold mb-2">How do you want to eat?</h3>
              <p className="text-[15px] text-zinc-500">
                {locationInput.city}, {locationInput.state}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => handleModeSelect('dine-in')}
                className="p-6 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 border border-zinc-800 rounded-xl transition-all min-h-[120px] flex flex-col items-center justify-center gap-3"
              >
                <div className="text-[48px]">🍽️</div>
                <p className="text-[20px] font-semibold">Dine In</p>
                <p className="text-[13px] text-zinc-500">Find restaurants to visit</p>
              </button>

              <button
                onClick={() => handleModeSelect('delivery')}
                className="p-6 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 border border-zinc-800 rounded-xl transition-all min-h-[120px] flex flex-col items-center justify-center gap-3"
              >
                <div className="text-[48px]">🚗</div>
                <p className="text-[20px] font-semibold">Delivery</p>
                <p className="text-[13px] text-zinc-500">Get food delivered</p>
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Time */}
        {step === 'time' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-[22px] font-semibold mb-2">
                {diningMode === 'dine-in' ? 'Max drive time?' : 'Max delivery time?'}
              </h3>
              <p className="text-[15px] text-zinc-500">We'll show places within this time</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {TIME_PRESETS.map((time) => (
                <button
                  key={time}
                  onClick={() => handleTimeSelect(time)}
                  className="px-4 py-6 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 border border-zinc-800 rounded-xl text-[17px] font-semibold transition-all"
                >
                  {time} min
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Results */}
        {step === 'results' && (
          <div className="space-y-4 pb-8">
            <div className="mb-6">
              <h3 className="text-[22px] font-semibold mb-1">
                {FOOD_CATEGORIES.find((c) => c.id === selectedCategory)?.name}
              </h3>
              <p className="text-[15px] text-zinc-500">
                ${budgetMin} - ${budgetMax} • {diningMode === 'dine-in' ? `${maxTime} min drive` : `${maxTime} min delivery`}
              </p>
            </div>

            {/* Restaurant Cards */}
            {restaurants.map((restaurant, index) => (
              <div key={`${restaurant.name}-${index}`} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="text-[17px] font-semibold text-white mb-1">{restaurant.name}</h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[12px] text-zinc-400">
                        {restaurant.cuisine}
                      </span>
                      <span className="text-[15px] font-bold text-[#34C759]">{restaurant.priceRange}</span>
                    </div>
                  </div>
                  {restaurant.rating && (
                    <div className="flex items-center gap-1">
                      <span className="text-[15px]">⭐</span>
                      <span className="text-[15px] font-semibold">{restaurant.rating}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold text-[#FF9500]">
                    {restaurant.time} min {diningMode === 'dine-in' ? 'drive' : 'delivery'}
                  </span>
                </div>

                <p className="text-[15px] text-zinc-400 italic">{restaurant.reason}</p>

                {diningMode === 'dine-in' && restaurant.address && (
                  <p className="text-[13px] text-zinc-500">{restaurant.address}</p>
                )}

                {/* Action Buttons */}
                {diningMode === 'dine-in' ? (
                  <div className="flex items-center gap-2 pt-2">
                    {restaurant.directionsUrl && (
                      <a
                        href={restaurant.directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-4 py-2 bg-[#007AFF] hover:bg-[#0071E3] active:bg-[#0064CC] rounded-lg text-[15px] font-semibold transition-all text-center inline-flex items-center justify-center gap-1"
                      >
                        Directions
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </a>
                    )}
                    {restaurant.menuUrl && (
                      <a
                        href={restaurant.menuUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 border border-zinc-700 rounded-lg text-[15px] font-semibold transition-all text-center inline-flex items-center justify-center gap-1"
                      >
                        Menu
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {restaurant.deliveryPlatforms?.map((platform) => (
                      <a
                        key={platform.name}
                        href={platform.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 border border-zinc-700 rounded-lg text-[13px] font-semibold transition-all"
                      >
                        {platform.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Loading State */}
            {loading && (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3 animate-pulse">
                    <div className="h-5 bg-zinc-800 rounded w-3/4" />
                    <div className="h-4 bg-zinc-800 rounded w-1/2" />
                    <div className="h-4 bg-zinc-800 rounded w-1/4" />
                    <div className="h-4 bg-zinc-800 rounded w-full" />
                    <div className="h-10 bg-zinc-800 rounded" />
                  </div>
                ))}
              </div>
            )}

            {/* No More Results */}
            {!hasMore && restaurants.length > 0 && (
              <p className="text-center text-zinc-500 text-[15px] py-4">That's all we found!</p>
            )}

            {/* Empty State */}
            {!loading && restaurants.length === 0 && (
              <div className="text-center py-16">
                <p className="text-zinc-500 text-[17px]">No recommendations found</p>
                <button
                  onClick={handleBack}
                  className="mt-4 text-[#007AFF] text-[15px] active:opacity-60 transition-opacity"
                >
                  Try different settings
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
