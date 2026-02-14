'use client';

import { useState, useEffect } from 'react';

const ZOOM_KEY = 'ui-zoom-level';
const ZOOM_STEPS = [80, 85, 90, 95, 100, 105, 110];
const DEFAULT_ZOOM = 90; // Slightly smaller default for mobile

export function ZoomControl({ inline }: { inline?: boolean } = {}) {
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  useEffect(() => {
    const saved = localStorage.getItem(ZOOM_KEY);
    const level = saved ? parseInt(saved) : DEFAULT_ZOOM;
    setZoom(level);
    applyZoom(level);
  }, []);

  function applyZoom(level: number) {
    document.documentElement.style.fontSize = `${level}%`;
  }

  function changeZoom(delta: number) {
    const currentIndex = ZOOM_STEPS.indexOf(zoom);
    const newIndex = Math.max(0, Math.min(ZOOM_STEPS.length - 1, currentIndex + delta));
    const newZoom = ZOOM_STEPS[newIndex];
    setZoom(newZoom);
    applyZoom(newZoom);
    localStorage.setItem(ZOOM_KEY, String(newZoom));
  }

  function resetZoom() {
    setZoom(100);
    applyZoom(100);
    localStorage.setItem(ZOOM_KEY, '100');
  }

  if (inline) {
    return (
      <div className="flex items-center gap-0.5 bg-zinc-800/80 border border-zinc-700/60 rounded-full px-0.5 py-0.5">
        <button
          onClick={() => changeZoom(-1)}
          disabled={zoom <= ZOOM_STEPS[0]}
          className="w-7 h-7 flex items-center justify-center rounded-full text-[14px] font-medium text-zinc-400 hover:bg-zinc-700 active:bg-zinc-600 disabled:opacity-25 transition-all"
        >
          −
        </button>
        <button
          onClick={resetZoom}
          className="min-w-[30px] h-7 flex items-center justify-center text-[10px] font-medium text-zinc-500 hover:text-zinc-300 transition-all"
        >
          {zoom}%
        </button>
        <button
          onClick={() => changeZoom(1)}
          disabled={zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}
          className="w-7 h-7 flex items-center justify-center rounded-full text-[14px] font-medium text-zinc-400 hover:bg-zinc-700 active:bg-zinc-600 disabled:opacity-25 transition-all"
        >
          +
        </button>
      </div>
    );
  }

  return (
    <div
      id="global-zoom-control"
      className="fixed left-3 z-[55] flex items-center gap-0.5 bg-zinc-900/90 backdrop-blur-sm border border-zinc-700/60 rounded-full px-1 py-1 shadow-xl"
      style={{ bottom: 'calc(24px + env(safe-area-inset-bottom))' }}
    >
      <button
        onClick={() => changeZoom(-1)}
        disabled={zoom <= ZOOM_STEPS[0]}
        className="w-8 h-8 flex items-center justify-center rounded-full text-[16px] font-medium text-zinc-300 hover:bg-zinc-700 active:bg-zinc-600 disabled:opacity-25 transition-all"
      >
        −
      </button>
      <button
        onClick={resetZoom}
        className="min-w-[36px] h-8 flex items-center justify-center text-[11px] font-medium text-zinc-500 hover:text-zinc-300 transition-all"
      >
        {zoom}%
      </button>
      <button
        onClick={() => changeZoom(1)}
        disabled={zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}
        className="w-8 h-8 flex items-center justify-center rounded-full text-[16px] font-medium text-zinc-300 hover:bg-zinc-700 active:bg-zinc-600 disabled:opacity-25 transition-all"
      >
        +
      </button>
    </div>
  );
}
