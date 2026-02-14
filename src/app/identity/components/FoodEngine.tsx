'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@/lib/supabase/client';

interface FoodEngineProps {
  identityId: string;
  onClose: () => void;
}

interface Identity {
  city?: string;
  state?: string;
  country?: string;
  physical_attributes?: Record<string, any>;
}

interface SearchParams {
  identityId: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  location: string;
  mode: 'dine-in' | 'delivery';
  maxDriveMinutes: number;
  offset: number;
  limit: number;
}

interface DineInResult {
  name: string;
  cuisine: string;
  priceRange: string;
  driveMinutes: number;
  rating?: string;
  reason: string;
  address: string;
  mapsUrl: string;
  menuUrl: string;
}

interface DeliveryResult {
  name: string;
  cuisine: string;
  priceRange: string;
  deliveryMinutes: number;
  reason: string;
  platforms: string[];
  doordashUrl?: string;
  ubereatsUrl?: string;
  grubhubUrl?: string;
}

type SearchResult = DineInResult | DeliveryResult;

const BUDGET_PRESETS = [
  { label: 'Under $15', min: 0, max: 15 },
  { label: '$15-30', min: 15, max: 30 },
  { label: '$30-50', min: 30, max: 50 },
  { label: '$50-100', min: 50, max: 100 },
  { label: '$100+ (Fine Dining)', min: 100, max: 500 },
];

const CATEGORIES = [
  { id: 'japanese', label: 'Japanese / Sushi', icon: '🍣' },
  { id: 'bbq', label: 'BBQ & Steakhouse', icon: '🥩' },
  { id: 'mexican', label: 'Mexican', icon: '🌮' },
  { id: 'italian', label: 'Italian / Pizza', icon: '🍕' },
  { id: 'korean', label: 'Korean', icon: '🥘' },
  { id: 'indian', label: 'Indian', icon: '🍛' },
  { id: 'mediterranean', label: 'Middle Eastern / Mediterranean', icon: '🧆' },
  { id: 'thai', label: 'Thai / Vietnamese', icon: '🍜' },
  { id: 'chinese', label: 'Chinese', icon: '🥡' },
  { id: 'american', label: 'American / Burgers', icon: '🍔' },
  { id: 'seafood', label: 'Seafood', icon: '🐟' },
  { id: 'healthy', label: 'Healthy / Salads', icon: '🥗' },
  { id: 'breakfast', label: 'Breakfast / Brunch', icon: '🍳' },
  { id: 'surprise', label: 'Surprise Me', icon: '🔥' },
];

const DRIVE_TIME_PRESETS = [5, 10, 15, 20, 30, 45, 60];

export function FoodEngine({ identityId, onClose }: FoodEngineProps) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [budgetMin, setBudgetMin] = useState(15);
  const [budgetMax, setBudgetMax] = useState(30);
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [showCustomLocation, setShowCustomLocation] = useState(false);
  const [mode, setMode] = useState<'dine-in' | 'delivery' | null>(null);
  const [maxDriveMinutes, setMaxDriveMinutes] = useState(20);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [identity, setIdentity] = useState<Identity | null>(null);

  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    loadIdentity();
  }, []);

  async function loadIdentity() {
    const { data, error } = await supabase
      .from('identities')
      .select('city, state, country, physical_attributes')
      .eq('id', identityId)
      .single();
    
    if (!error && data) {
      setIdentity(data);
      if (data.city && data.state) {
        setLocation(`${data.city}, ${data.state}`);
      }
    }
  }

  async function handleSearch() {
    setLoading(true);
    try {
      const params: SearchParams = {
        identityId,
        category,
        budgetMin,
        budgetMax,
        location: showCustomLocation && customLocation ? customLocation : location,
        mode: mode!,
        maxDriveMinutes,
        offset: 0,
        limit: 10,
      };

      const response = await fetch('/api/identity/food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Failed to search');
      }

      const data = await response.json();
      setResults(data.results || []);
      setStep(6);
    } catch (error) {
      console.error('Search error:', error);
      alert('Failed to search for restaurants. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleBudgetSelect(min: number, max: number) {
    setBudgetMin(min);
    setBudgetMax(max);
    setStep(2);
  }

  function handleCategorySelect(categoryId: string) {
    setCategory(categoryId);
    setStep(3);
  }

  function handleLocationNext() {
    const finalLocation = showCustomLocation && customLocation ? customLocation : location;
    if (!finalLocation) {
      alert('Please enter a location');
      return;
    }
    setStep(4);
  }

  function handleModeSelect(selectedMode: 'dine-in' | 'delivery') {
    setMode(selectedMode);
    setStep(5);
  }

  function handleBack() {
    if (step > 1) {
      setStep(step - 1);
    }
  }

  function isDineInResult(result: SearchResult): result is DineInResult {
    return mode === 'dine-in';
  }

  if (!mounted) return null;

  const modal = (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col" style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div className="pt-[env(safe-area-inset-top)] sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-zinc-800/60">
        <div className="px-4 py-4 flex items-center justify-between">
          <button
            onClick={step === 6 ? handleBack : onClose}
            className="text-[17px] text-[#007AFF] active:opacity-60 transition-opacity"
          >
            {step === 6 ? '← Back' : 'Close'}
          </button>
          <h2 className="text-[17px] font-semibold">🍣 Food Finder</h2>
          <div className="w-16"></div>
        </div>
        {/* Step Indicator */}
        {step < 6 && (
          <div className="px-4 pb-3">
            <div className="flex items-center justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all ${
                    s === step ? 'w-8 bg-[#007AFF]' : s < step ? 'w-6 bg-[#007AFF]/50' : 'w-6 bg-zinc-700'
                  }`}
                />
              ))}
            </div>
            <p className="text-center text-[13px] text-zinc-500 mt-2">Step {step} of 5</p>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-[calc(24px+env(safe-area-inset-bottom))]">
        {/* Step 1: Budget */}
        {step === 1 && (
          <div className="p-4 space-y-4">
            <div className="text-center py-8">
              <h3 className="text-[22px] font-semibold mb-2">What's your budget?</h3>
              <p className="text-[15px] text-zinc-500">Per person</p>
            </div>
            <div className="space-y-3">
              {BUDGET_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handleBudgetSelect(preset.min, preset.max)}
                  className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-left active:bg-zinc-800 transition-colors"
                >
                  <div className="text-[17px] font-medium">{preset.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Category */}
        {step === 2 && (
          <div className="p-4 space-y-4">
            <div className="text-center py-8">
              <h3 className="text-[22px] font-semibold mb-2">What sounds good?</h3>
              <p className="text-[15px] text-zinc-500">Choose a cuisine</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-left active:bg-zinc-800 transition-colors min-h-[80px]"
                >
                  <div className="text-[28px] mb-1">{cat.icon}</div>
                  <div className="text-[15px] font-medium leading-tight">{cat.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <div className="p-4 space-y-6">
            <div className="text-center py-8">
              <h3 className="text-[22px] font-semibold mb-2">Where are you?</h3>
              <p className="text-[15px] text-zinc-500">We'll find nearby options</p>
            </div>

            {location && !showCustomLocation && (
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                <p className="text-[15px] text-zinc-500 mb-2">Current location</p>
                <p className="text-[17px] font-medium">📍 {location}</p>
              </div>
            )}

            {(!location || showCustomLocation) && (
              <div>
                <label className="block text-[15px] text-zinc-500 mb-2">Enter location</label>
                <input
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder="e.g. Venice, California"
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-[17px] focus:outline-none focus:border-[#007AFF] transition-colors"
                />
              </div>
            )}

            {location && !showCustomLocation && (
              <button
                onClick={() => setShowCustomLocation(true)}
                className="w-full text-[15px] text-[#007AFF] active:opacity-60 transition-opacity"
              >
                Use different location
              </button>
            )}

            <button
              onClick={handleLocationNext}
              className="w-full py-4 bg-[#007AFF] rounded-xl text-[17px] font-semibold active:bg-[#0064CC] transition-colors"
            >
              Next
            </button>
          </div>
        )}

        {/* Step 4: Mode */}
        {step === 4 && (
          <div className="p-4 space-y-4">
            <div className="text-center py-8">
              <h3 className="text-[22px] font-semibold mb-2">Dine in or delivery?</h3>
              <p className="text-[15px] text-zinc-500">How do you want to eat?</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => handleModeSelect('dine-in')}
                className="w-full p-6 bg-zinc-900 border border-zinc-800 rounded-xl text-left active:bg-zinc-800 transition-colors"
              >
                <div className="text-[32px] mb-2">🍽️</div>
                <div className="text-[20px] font-semibold mb-1">Dine In</div>
                <div className="text-[15px] text-zinc-500">Find restaurants nearby</div>
              </button>
              <button
                onClick={() => handleModeSelect('delivery')}
                className="w-full p-6 bg-zinc-900 border border-zinc-800 rounded-xl text-left active:bg-zinc-800 transition-colors"
              >
                <div className="text-[32px] mb-2">🚗</div>
                <div className="text-[20px] font-semibold mb-1">Delivery</div>
                <div className="text-[15px] text-zinc-500">Order to your door</div>
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Drive Time */}
        {step === 5 && (
          <div className="p-4 space-y-6">
            <div className="text-center py-8">
              <h3 className="text-[22px] font-semibold mb-2">How far will you go?</h3>
              <p className="text-[15px] text-zinc-500">
                Max {mode === 'dine-in' ? 'drive' : 'delivery'} time
              </p>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {DRIVE_TIME_PRESETS.map((time) => (
                <button
                  key={time}
                  onClick={() => setMaxDriveMinutes(time)}
                  className={`p-4 rounded-xl text-[17px] font-medium transition-all ${
                    maxDriveMinutes === time
                      ? 'bg-[#007AFF] text-white'
                      : 'bg-zinc-900 border border-zinc-800 active:bg-zinc-800'
                  }`}
                >
                  {time}m
                </button>
              ))}
            </div>

            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full py-4 bg-[#007AFF] rounded-xl text-[17px] font-semibold active:bg-[#0064CC] transition-colors disabled:opacity-50 disabled:active:bg-[#007AFF]"
            >
              {loading ? 'Finding Food...' : 'Find Food →'}
            </button>
          </div>
        )}

        {/* Step 6: Results */}
        {step === 6 && (
          <div className="space-y-4">
            <div className="px-4 pt-4 pb-2 sticky top-0 bg-black/80 backdrop-blur-xl">
              <h3 className="text-[20px] font-semibold">
                {CATEGORIES.find(c => c.id === category)?.icon} {CATEGORIES.find(c => c.id === category)?.label}
              </h3>
              <p className="text-[13px] text-zinc-500 mt-1">
                ${budgetMin}-${budgetMax} · {mode === 'dine-in' ? 'Dine In' : 'Delivery'} · {maxDriveMinutes} min
              </p>
            </div>

            {loading && (
              <div className="px-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse">
                    <div className="h-5 bg-zinc-800 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-zinc-800 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-zinc-800 rounded w-full"></div>
                  </div>
                ))}
              </div>
            )}

            {!loading && results.length === 0 && (
              <div className="px-4 py-12 text-center">
                <p className="text-[17px] text-zinc-500">No results found. Try adjusting your search.</p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="px-4 space-y-3 pb-4">
                {results.map((result, i) => (
                  <div key={i} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
                    <div>
                      <h4 className="text-[17px] font-semibold mb-1">{result.name}</h4>
                      <div className="flex items-center gap-2 text-[13px]">
                        <span className="text-zinc-400">{result.cuisine}</span>
                        <span className="text-[#34C759]">{result.priceRange}</span>
                        {isDineInResult(result) && result.rating && (
                          <span className="text-zinc-400">⭐ {result.rating}</span>
                        )}
                      </div>
                    </div>

                    <p className="text-[15px] text-zinc-400">{result.reason}</p>

                    {isDineInResult(result) ? (
                      <>
                        <div className="flex items-center gap-2 text-[13px]">
                          <span className="text-[#FF9500]">🚗 {result.driveMinutes} min away</span>
                        </div>
                        <p className="text-[13px] text-zinc-500">{result.address}</p>
                        <div className="flex gap-2 pt-2">
                          <a
                            href={result.mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2.5 bg-[#007AFF] rounded-lg text-center text-[15px] font-medium active:bg-[#0064CC] transition-colors"
                          >
                            Directions →
                          </a>
                          <a
                            href={result.menuUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2.5 bg-zinc-800 rounded-lg text-center text-[15px] font-medium active:bg-zinc-700 transition-colors"
                          >
                            Menu →
                          </a>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-[13px]">
                          <span className="text-[#FF9500]">🚗 {result.deliveryMinutes} min delivery</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {result.platforms.map((platform) => (
                            <span key={platform} className="px-2 py-1 bg-zinc-800 rounded-full text-[11px] text-zinc-400">
                              {platform}
                            </span>
                          ))}
                        </div>
                        <div className="grid grid-cols-3 gap-2 pt-2">
                          {result.doordashUrl && (
                            <a
                              href={result.doordashUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-2 px-2 bg-[#FF3008] rounded-lg text-center text-[13px] font-medium active:opacity-80 transition-opacity"
                            >
                              DoorDash
                            </a>
                          )}
                          {result.ubereatsUrl && (
                            <a
                              href={result.ubereatsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-2 px-2 bg-[#06C167] rounded-lg text-center text-[13px] font-medium active:opacity-80 transition-opacity"
                            >
                              UberEats
                            </a>
                          )}
                          {result.grubhubUrl && (
                            <a
                              href={result.grubhubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-2 px-2 bg-[#F63440] rounded-lg text-center text-[13px] font-medium active:opacity-80 transition-opacity"
                            >
                              Grubhub
                            </a>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
