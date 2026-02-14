'use client';

import { useState, useEffect } from 'react';

const ZOOM_KEY = 'ui-zoom-level';
const ZOOM_STEPS = [80, 85, 90, 95, 100, 105, 110];
const DEFAULT_ZOOM = 90; // Slightly smaller default for mobile

export function ZoomControl() {
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [show, setShow] = useState(false);

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

  return (
    <>
      {/* Toggle button - small, in top-left */}
      <button
        onClick={() => setShow(!show)}
        className="fixed top-3 left-3 z-[45] w-7 h-7 bg-zinc-800/80 backdrop-blur-sm border border-zinc-700/50 rounded-lg flex items-center justify-center text-[11px] text-zinc-500 hover:text-zinc-300 active:scale-95 transition-all"
        style={{ top: 'calc(8px + env(safe-area-inset-top))' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
      </button>

      {/* Zoom controls panel */}
      {show && (
        <>
          <div className="fixed inset-0 z-[44]" onClick={() => setShow(false)} />
          <div
            className="fixed left-3 z-[45] flex items-center gap-1 bg-zinc-800 border border-zinc-700 rounded-xl px-2 py-1.5 shadow-xl"
            style={{ top: 'calc(42px + env(safe-area-inset-top))' }}
          >
            <button
              onClick={() => changeZoom(-1)}
              disabled={zoom <= ZOOM_STEPS[0]}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[16px] font-medium text-zinc-300 hover:bg-zinc-700 active:bg-zinc-600 disabled:opacity-25 transition-all"
            >
              −
            </button>
            <button
              onClick={resetZoom}
              className="min-w-[44px] h-8 flex items-center justify-center rounded-lg text-[12px] font-medium text-zinc-400 hover:bg-zinc-700 active:bg-zinc-600 transition-all"
            >
              {zoom}%
            </button>
            <button
              onClick={() => changeZoom(1)}
              disabled={zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[16px] font-medium text-zinc-300 hover:bg-zinc-700 active:bg-zinc-600 disabled:opacity-25 transition-all"
            >
              +
            </button>
          </div>
        </>
      )}
    </>
  );
}
