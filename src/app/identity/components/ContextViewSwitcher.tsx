'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const VIEWS = [
  { id: 'main', name: 'Full Profile', icon: '📊', path: '/identity' },
  { id: 'music', name: 'Music Curator', icon: '🎵', path: '/identity/music' },
  { id: 'news', name: 'News Curator', icon: '📰', path: '/identity/news' },
  { id: 'food', name: 'Food Finder', icon: '🍽️', path: '/identity/food', disabled: true },
  { id: 'shopping', name: 'Shopping', icon: '👔', path: '/identity/shopping', disabled: true },
  { id: 'inspiration', name: 'Inspiration', icon: '🧠', path: '/identity/inspiration', disabled: true },
];

export function ContextViewSwitcher() {
  const pathname = usePathname();
  
  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-2 overflow-x-auto py-2">
          {VIEWS.map(view => {
            const isActive = pathname === view.path;
            const isDisabled = view.disabled;
            
            if (isDisabled) {
              return (
                <div
                  key={view.id}
                  className="px-4 py-2 rounded-lg text-sm text-gray-400 dark:text-gray-600 cursor-not-allowed"
                  title="Coming soon"
                >
                  <span className="mr-2">{view.icon}</span>
                  {view.name}
                </div>
              );
            }
            
            return (
              <Link
                key={view.id}
                href={view.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <span className="mr-2">{view.icon}</span>
                {view.name}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
