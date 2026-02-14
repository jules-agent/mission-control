'use client';

import { useState, useEffect } from 'react';

interface PhysicalAttributesData {
  hairColor?: string;
  eyeColor?: string;
  heightFeet?: number;
  heightInches?: number;
  heightCm?: number;
  weight?: number;
  weightKg?: number;
  build?: string;
  skinTone?: string;
  shoeSize?: number;
  shirtSize?: string;
  dressShirtSize?: string;
  pantsSize?: string;
  ringSize?: number;
  gloveSize?: string;
  hatSize?: string;
}

interface PhysicalAttributesProps {
  identityId: string;
  physicalAttributes?: Record<string, any>;
  onSave: (identityId: string, data: PhysicalAttributesData) => void;
}

const HAIR_COLORS = ['Black', 'Brown', 'Blonde', 'Red', 'Auburn', 'Gray', 'White', 'Other'];
const EYE_COLORS = ['Brown', 'Blue', 'Green', 'Hazel', 'Gray', 'Amber', 'Other'];
const BUILDS = ['Slim', 'Athletic', 'Average', 'Muscular', 'Stocky', 'Plus Size'];
const SKIN_TONES = ['Fair', 'Light', 'Medium', 'Olive', 'Tan', 'Brown', 'Dark'];
const SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const GLOVE_SIZES = ['XS', 'S', 'M', 'L', 'XL'];
const HAT_SIZES = ['S', 'M', 'L', 'XL', '7', '7 1/4', '7 1/2', '7 3/4', '8'];

export function PhysicalAttributes({ identityId, physicalAttributes, onSave }: PhysicalAttributesProps) {
  const [expanded, setExpanded] = useState(false);
  const [data, setData] = useState<PhysicalAttributesData>(physicalAttributes || {});
  const [useMetric, setUseMetric] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setData(physicalAttributes || {});
  }, [physicalAttributes]);

  function handleChange(field: keyof PhysicalAttributesData, value: any) {
    const updated = { ...data, [field]: value };

    // Auto-convert height
    if (field === 'heightFeet' || field === 'heightInches') {
      const feet = field === 'heightFeet' ? value : data.heightFeet || 0;
      const inches = field === 'heightInches' ? value : data.heightInches || 0;
      const totalInches = (feet * 12) + inches;
      updated.heightCm = Math.round(totalInches * 2.54);
    } else if (field === 'heightCm') {
      const totalInches = Math.round(value / 2.54);
      updated.heightFeet = Math.floor(totalInches / 12);
      updated.heightInches = totalInches % 12;
    }

    // Auto-convert weight
    if (field === 'weight') {
      updated.weightKg = Math.round(value * 0.453592);
    } else if (field === 'weightKg') {
      updated.weight = Math.round(value / 0.453592);
    }

    setData(updated);

    // Debounce save
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      onSave(identityId, updated);
    }, 500);
    setDebounceTimer(timer);
  }

  function getSummary(): string {
    const parts: string[] = [];

    // Height
    if (data.heightFeet || data.heightCm) {
      if (useMetric && data.heightCm) {
        parts.push(`${data.heightCm}cm`);
      } else if (data.heightFeet) {
        const feet = data.heightFeet || 0;
        const inches = data.heightInches || 0;
        parts.push(`${feet}'${inches}"`);
      }
    }

    // Hair
    if (data.hairColor) {
      parts.push(`${data.hairColor} hair`);
    }

    // Eye
    if (data.eyeColor) {
      parts.push(`${data.eyeColor} eyes`);
    }

    return parts.length > 0 ? parts.join(', ') : 'Tap to add';
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full bg-zinc-900/80 rounded-xl p-4 text-left active:bg-zinc-800/60 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[17px] font-semibold text-white flex items-center gap-2">
              <span>📏</span>
              Physical Attributes
            </h3>
            <p className="text-[13px] text-zinc-500 mt-0.5">{getSummary()}</p>
          </div>
          <svg
            className="w-[14px] h-[14px] text-zinc-500"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      </button>
    );
  }

  return (
    <div className="bg-zinc-900/80 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[17px] font-semibold text-white flex items-center gap-2">
          <span>📏</span>
          Physical Attributes
        </h3>
        <button
          onClick={() => setExpanded(false)}
          className="text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hair Color */}
        <div>
          <label className="block text-[13px] text-zinc-400 mb-1.5">Hair Color</label>
          <select
            value={data.hairColor || ''}
            onChange={(e) => handleChange('hairColor', e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-[15px] text-white focus:outline-none focus:border-[#007AFF]"
          >
            <option value="">Select...</option>
            {HAIR_COLORS.map(color => (
              <option key={color} value={color}>{color}</option>
            ))}
          </select>
        </div>

        {/* Eye Color */}
        <div>
          <label className="block text-[13px] text-zinc-400 mb-1.5">Eye Color</label>
          <select
            value={data.eyeColor || ''}
            onChange={(e) => handleChange('eyeColor', e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-[15px] text-white focus:outline-none focus:border-[#007AFF]"
          >
            <option value="">Select...</option>
            {EYE_COLORS.map(color => (
              <option key={color} value={color}>{color}</option>
            ))}
          </select>
        </div>

        {/* Height */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[13px] text-zinc-400">Height</label>
            <button
              onClick={() => setUseMetric(!useMetric)}
              className="text-[11px] text-[#007AFF] active:opacity-60 transition-opacity"
            >
              {useMetric ? 'Use ft/in' : 'Use cm'}
            </button>
          </div>
          {useMetric ? (
            <input
              type="number"
              value={data.heightCm || ''}
              onChange={(e) => handleChange('heightCm', parseFloat(e.target.value) || 0)}
              placeholder="170"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-[15px] text-white placeholder-zinc-600 focus:outline-none focus:border-[#007AFF]"
            />
          ) : (
            <div className="flex gap-2">
              <input
                type="number"
                value={data.heightFeet || ''}
                onChange={(e) => handleChange('heightFeet', parseInt(e.target.value) || 0)}
                placeholder="5"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-[15px] text-white placeholder-zinc-600 focus:outline-none focus:border-[#007AFF]"
              />
              <span className="text-zinc-400 self-center">ft</span>
              <input
                type="number"
                value={data.heightInches || ''}
                onChange={(e) => handleChange('heightInches', parseInt(e.target.value) || 0)}
                placeholder="11"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-[15px] text-white placeholder-zinc-600 focus:outline-none focus:border-[#007AFF]"
              />
              <span className="text-zinc-400 self-center">in</span>
            </div>
          )}
        </div>

        {/* Weight */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[13px] text-zinc-400">Weight</label>
            <button
              onClick={() => setUseMetric(!useMetric)}
              className="text-[11px] text-[#007AFF] active:opacity-60 transition-opacity"
            >
              {useMetric ? 'Use lbs' : 'Use kg'}
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={useMetric ? (data.weightKg || '') : (data.weight || '')}
              onChange={(e) => handleChange(useMetric ? 'weightKg' : 'weight', parseFloat(e.target.value) || 0)}
              placeholder={useMetric ? '70' : '155'}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-[15px] text-white placeholder-zinc-600 focus:outline-none focus:border-[#007AFF]"
            />
            <span className="text-zinc-400 self-center">{useMetric ? 'kg' : 'lbs'}</span>
          </div>
        </div>

        {/* Build */}
        <div>
          <label className="block text-[13px] text-zinc-400 mb-1.5">Build</label>
          <select
            value={data.build || ''}
            onChange={(e) => handleChange('build', e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-[15px] text-white focus:outline-none focus:border-[#007AFF]"
          >
            <option value="">Select...</option>
            {BUILDS.map(build => (
              <option key={build} value={build}>{build}</option>
            ))}
          </select>
        </div>

        {/* Skin Tone */}
        <div>
          <label className="block text-[13px] text-zinc-400 mb-1.5">Skin Tone</label>
          <select
            value={data.skinTone || ''}
            onChange={(e) => handleChange('skinTone', e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-[15px] text-white focus:outline-none focus:border-[#007AFF]"
          >
            <option value="">Select...</option>
            {SKIN_TONES.map(tone => (
              <option key={tone} value={tone}>{tone}</option>
            ))}
          </select>
        </div>

        {/* Shoe Size */}
        <div>
          <label className="block text-[13px] text-zinc-400 mb-1.5">Shoe Size (US)</label>
          <input
            type="number"
            step="0.5"
            value={data.shoeSize || ''}
            onChange={(e) => handleChange('shoeSize', parseFloat(e.target.value) || 0)}
            placeholder="10.5"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-[15px] text-white placeholder-zinc-600 focus:outline-none focus:border-[#007AFF]"
          />
        </div>

        {/* Shirt Size */}
        <div>
          <label className="block text-[13px] text-zinc-400 mb-1.5">Shirt Size</label>
          <select
            value={data.shirtSize || ''}
            onChange={(e) => handleChange('shirtSize', e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-[15px] text-white focus:outline-none focus:border-[#007AFF]"
          >
            <option value="">Select...</option>
            {SHIRT_SIZES.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>

        {/* Dress Shirt Size */}
        <div>
          <label className="block text-[13px] text-zinc-400 mb-1.5">Dress Shirt Size</label>
          <input
            type="text"
            value={data.dressShirtSize || ''}
            onChange={(e) => handleChange('dressShirtSize', e.target.value)}
            placeholder="16 34/35"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-[15px] text-white placeholder-zinc-600 focus:outline-none focus:border-[#007AFF]"
          />
        </div>

        {/* Pants Size */}
        <div>
          <label className="block text-[13px] text-zinc-400 mb-1.5">Pants Size</label>
          <input
            type="text"
            value={data.pantsSize || ''}
            onChange={(e) => handleChange('pantsSize', e.target.value)}
            placeholder="32x30"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-[15px] text-white placeholder-zinc-600 focus:outline-none focus:border-[#007AFF]"
          />
        </div>

        {/* Ring Size */}
        <div>
          <label className="block text-[13px] text-zinc-400 mb-1.5">Ring Size</label>
          <input
            type="number"
            step="0.5"
            value={data.ringSize || ''}
            onChange={(e) => handleChange('ringSize', parseFloat(e.target.value) || 0)}
            placeholder="9.5"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-[15px] text-white placeholder-zinc-600 focus:outline-none focus:border-[#007AFF]"
          />
        </div>

        {/* Glove Size */}
        <div>
          <label className="block text-[13px] text-zinc-400 mb-1.5">Glove Size</label>
          <select
            value={data.gloveSize || ''}
            onChange={(e) => handleChange('gloveSize', e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-[15px] text-white focus:outline-none focus:border-[#007AFF]"
          >
            <option value="">Select...</option>
            {GLOVE_SIZES.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>

        {/* Hat Size */}
        <div>
          <label className="block text-[13px] text-zinc-400 mb-1.5">Hat Size</label>
          <select
            value={data.hatSize || ''}
            onChange={(e) => handleChange('hatSize', e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-[15px] text-white focus:outline-none focus:border-[#007AFF]"
          >
            <option value="">Select...</option>
            {HAT_SIZES.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
