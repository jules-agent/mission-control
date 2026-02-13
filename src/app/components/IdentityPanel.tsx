'use client';

import Link from 'next/link';

export function IdentityPanel() {
  return (
    <section className="rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">🎵 Master Identity System</h2>
          <p className="text-purple-100 mb-4">
            Manage your musical influences, philosophy, and preferences.
            <br />
            Powers Life's Soundtrack and all future tools.
          </p>
          <Link
            href="/identity"
            className="inline-block px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition"
          >
            Manage Identities →
          </Link>
        </div>
        <div className="text-6xl opacity-20">
          ⚡
        </div>
      </div>
    </section>
  );
}
