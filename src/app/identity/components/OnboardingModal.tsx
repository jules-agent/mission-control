'use client';

import { useState } from 'react';

interface OnboardingData {
  name: string;
  gender: string;
  ageRange: string;
  music: string;
  values: string[];
  entertainment: string;
  food: string[];
  intellectualInterests: string;
}

interface OnboardingModalProps {
  onComplete: (data: OnboardingData) => Promise<void>;
  onCancel: () => void;
}

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const AGE_OPTIONS = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
const VALUE_OPTIONS = ['Family', 'Career', 'Creativity', 'Adventure', 'Knowledge', 'Health', 'Community', 'Freedom', 'Spirituality', 'Wealth'];
const FOOD_OPTIONS = ['Italian', 'Japanese', 'Mexican', 'Indian', 'Korean', 'BBQ', 'Seafood', 'Vegan', 'Mediterranean', 'American', 'Thai', 'Chinese', 'French'];

export function OnboardingModal({ onComplete, onCancel }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    gender: '',
    ageRange: '',
    music: '',
    values: [],
    entertainment: '',
    food: [],
    intellectualInterests: '',
  });

  const totalSteps = 3;

  const toggleArrayItem = (field: 'values' | 'food', item: string) => {
    setData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(v => v !== item)
        : [...prev[field], item]
    }));
  };

  const canProceed = () => {
    if (step === 1) return data.name.trim().length > 0;
    if (step === 2) return true; // All optional
    return true;
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await onComplete(data);
    } catch (e) {
      console.error(e);
      alert('Failed to create identity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-end sm:items-center justify-center">
      <div className="w-full max-w-lg bg-zinc-900 rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900/95 backdrop-blur-sm z-10 px-5 pt-5 pb-3 border-b border-zinc-800/60">
          <div className="flex items-center justify-between mb-3">
            <button onClick={onCancel} className="text-[15px] text-zinc-500 active:opacity-60">Cancel</button>
            <span className="text-[13px] text-zinc-500">Step {step} of {totalSteps}</span>
            {step < totalSteps ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
                className="text-[15px] text-[#007AFF] font-semibold active:opacity-60 disabled:opacity-30"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={loading || !canProceed()}
                className="text-[15px] text-[#007AFF] font-semibold active:opacity-60 disabled:opacity-30"
              >
                {loading ? 'Creating...' : 'Done'}
              </button>
            )}
          </div>
          {/* Progress bar */}
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#007AFF] rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <div className="px-5 py-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-[22px] font-bold text-white mb-1">Create New Identity</h2>
                <p className="text-[15px] text-zinc-500">Tell us about this persona</p>
              </div>

              <div>
                <label className="text-[13px] text-zinc-500 uppercase tracking-wider font-medium block mb-2">Name</label>
                <input
                  type="text"
                  value={data.name}
                  onChange={e => setData(d => ({ ...d, name: e.target.value }))}
                  placeholder="e.g. Weekend Me, Work Mode, etc."
                  className="w-full py-3 px-4 bg-zinc-800 rounded-xl text-[17px] text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[13px] text-zinc-500 uppercase tracking-wider font-medium block mb-2">Gender</label>
                <div className="grid grid-cols-2 gap-2">
                  {GENDER_OPTIONS.map(g => (
                    <button
                      key={g}
                      onClick={() => setData(d => ({ ...d, gender: d.gender === g ? '' : g }))}
                      className={`py-3 px-4 rounded-xl text-[15px] font-medium transition-all touch-manipulation ${
                        data.gender === g
                          ? 'bg-[#007AFF] text-white'
                          : 'bg-zinc-800 text-zinc-300 active:bg-zinc-700'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[13px] text-zinc-500 uppercase tracking-wider font-medium block mb-2">Age Range</label>
                <div className="grid grid-cols-3 gap-2">
                  {AGE_OPTIONS.map(a => (
                    <button
                      key={a}
                      onClick={() => setData(d => ({ ...d, ageRange: d.ageRange === a ? '' : a }))}
                      className={`py-3 px-4 rounded-xl text-[15px] font-medium transition-all touch-manipulation ${
                        data.ageRange === a
                          ? 'bg-[#007AFF] text-white'
                          : 'bg-zinc-800 text-zinc-300 active:bg-zinc-700'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Seeding Questions */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-[22px] font-bold text-white mb-1">Seed Your Identity</h2>
                <p className="text-[15px] text-zinc-500">Answer a few questions to pre-fill your profile</p>
              </div>

              {/* Music */}
              <div>
                <label className="text-[13px] text-zinc-500 uppercase tracking-wider font-medium block mb-1">🎵 Music</label>
                <p className="text-[13px] text-zinc-600 mb-2">Your 3 favorite artists or bands</p>
                <input
                  type="text"
                  value={data.music}
                  onChange={e => setData(d => ({ ...d, music: e.target.value }))}
                  placeholder="e.g. Radiohead, Kendrick Lamar, Miles Davis"
                  className="w-full py-3 px-4 bg-zinc-800 rounded-xl text-[15px] text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                />
              </div>

              {/* Values */}
              <div>
                <label className="text-[13px] text-zinc-500 uppercase tracking-wider font-medium block mb-1">💡 Values</label>
                <p className="text-[13px] text-zinc-600 mb-2">What matters most to you?</p>
                <div className="flex flex-wrap gap-2">
                  {VALUE_OPTIONS.map(v => (
                    <button
                      key={v}
                      onClick={() => toggleArrayItem('values', v)}
                      className={`py-2 px-3.5 rounded-full text-[14px] font-medium transition-all touch-manipulation ${
                        data.values.includes(v)
                          ? 'bg-[#007AFF] text-white'
                          : 'bg-zinc-800 text-zinc-300 active:bg-zinc-700'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Entertainment */}
              <div>
                <label className="text-[13px] text-zinc-500 uppercase tracking-wider font-medium block mb-1">🎬 Entertainment</label>
                <p className="text-[13px] text-zinc-600 mb-2">Your 3 favorite movies or TV shows</p>
                <input
                  type="text"
                  value={data.entertainment}
                  onChange={e => setData(d => ({ ...d, entertainment: e.target.value }))}
                  placeholder="e.g. The Matrix, Breaking Bad, Inception"
                  className="w-full py-3 px-4 bg-zinc-800 rounded-xl text-[15px] text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                />
              </div>

              {/* Food */}
              <div>
                <label className="text-[13px] text-zinc-500 uppercase tracking-wider font-medium block mb-1">🍽️ Food</label>
                <p className="text-[13px] text-zinc-600 mb-2">What type of food do you love?</p>
                <div className="flex flex-wrap gap-2">
                  {FOOD_OPTIONS.map(f => (
                    <button
                      key={f}
                      onClick={() => toggleArrayItem('food', f)}
                      className={`py-2 px-3.5 rounded-full text-[14px] font-medium transition-all touch-manipulation ${
                        data.food.includes(f)
                          ? 'bg-[#007AFF] text-white'
                          : 'bg-zinc-800 text-zinc-300 active:bg-zinc-700'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Intellectual Interests */}
              <div>
                <label className="text-[13px] text-zinc-500 uppercase tracking-wider font-medium block mb-1">🧠 Intellectual Interests</label>
                <p className="text-[13px] text-zinc-600 mb-2">Who inspires you? (authors, thinkers, leaders)</p>
                <input
                  type="text"
                  value={data.intellectualInterests}
                  onChange={e => setData(d => ({ ...d, intellectualInterests: e.target.value }))}
                  placeholder="e.g. Carl Sagan, Naval Ravikant, bell hooks"
                  className="w-full py-3 px-4 bg-zinc-800 rounded-xl text-[15px] text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                />
              </div>
            </div>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <div className="text-center py-8 space-y-4">
              <div className="text-[48px]">🎉</div>
              <h2 className="text-[22px] font-bold text-white">Ready to Go!</h2>
              <p className="text-[15px] text-zinc-400 max-w-xs mx-auto">
                Your profile will be seeded with your answers. Explore and refine your identity below.
              </p>
              {data.name && (
                <div className="inline-block px-5 py-2.5 bg-zinc-800 rounded-full mt-2">
                  <span className="text-[17px] font-semibold text-white">{data.name}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom navigation for mobile */}
        <div className="px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-2 border-t border-zinc-800/60">
          <div className="flex gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex-1 py-3.5 rounded-xl text-[17px] font-semibold bg-zinc-800 text-zinc-300 active:bg-zinc-700 transition-all"
              >
                Back
              </button>
            )}
            {step < totalSteps ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
                className="flex-1 py-3.5 rounded-xl text-[17px] font-semibold bg-[#007AFF] text-white active:bg-[#0064CC] disabled:opacity-30 transition-all"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={loading || !canProceed()}
                className="flex-1 py-3.5 rounded-xl text-[17px] font-semibold bg-[#34C759] text-white active:bg-[#2DB84D] disabled:opacity-30 transition-all"
              >
                {loading ? 'Creating...' : 'Create Identity'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
