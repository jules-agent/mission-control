'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface LocationResult {
  city: string;
  state: string;
  country: string;
  display: string;
}

interface LocationInputProps {
  city?: string;
  state?: string;
  country?: string;
  onSave: (city: string, state: string, country: string) => void;
}

export function LocationInput({ city, state, country, onSave }: LocationInputProps) {
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayLocation = city
    ? [city, state, country].filter(Boolean).join(', ')
    : null;

  useEffect(() => {
    if (editing) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [editing]);

  const searchCities = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      // Using OpenStreetMap Nominatim (free, no API key)
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=5&featuretype=city`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      const mapped: LocationResult[] = data
        .filter((r: any) => r.address)
        .map((r: any) => {
          const addr = r.address;
          const c = addr.city || addr.town || addr.village || addr.municipality || '';
          const s = addr.state || addr.province || addr.region || '';
          const co = addr.country || '';
          return {
            city: c,
            state: s,
            country: co,
            display: [c, s, co].filter(Boolean).join(', '),
          };
        })
        .filter((r: LocationResult) => r.city);
      
      // Deduplicate by display string
      const seen = new Set<string>();
      const unique = mapped.filter((r: LocationResult) => {
        if (seen.has(r.display)) return false;
        seen.add(r.display);
        return true;
      });
      
      setResults(unique);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleInput(value: string) {
    setQuery(value);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => searchCities(value), 300);
    setDebounceTimer(timer);
  }

  function selectLocation(loc: LocationResult) {
    onSave(loc.city, loc.state, loc.country);
    setEditing(false);
    setQuery('');
    setResults([]);
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-[13px] text-zinc-500 hover:text-zinc-300 active:opacity-60 transition-colors flex items-center gap-1"
      >
        📍 {displayLocation || 'Add location'}
      </button>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            placeholder="Type a city..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-[13px] text-white placeholder-zinc-600 focus:outline-none focus:border-[#007AFF] pr-6"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setEditing(false);
                setQuery('');
                setResults([]);
              }
            }}
          />
          {loading && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <div className="w-3 h-3 border border-zinc-600 border-t-[#007AFF] rounded-full animate-spin" />
            </div>
          )}
        </div>
        <button
          onClick={() => { setEditing(false); setQuery(''); setResults([]); }}
          className="text-[13px] text-zinc-500 hover:text-zinc-300 p-1"
        >
          ✕
        </button>
      </div>

      {/* Dropdown results */}
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-8 mt-1 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden shadow-xl z-50">
          {results.map((loc, i) => (
            <button
              key={i}
              onClick={() => selectLocation(loc)}
              className="w-full text-left px-3 py-2.5 text-[13px] text-zinc-300 hover:bg-zinc-700 active:bg-zinc-600 transition-colors border-b border-zinc-800 last:border-0"
            >
              📍 {loc.display}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
