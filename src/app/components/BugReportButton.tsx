'use client';

import { useState } from 'react';

interface BugReportButtonProps {
  appName: string;
  inline?: boolean;
}

export function BugReportButton({ appName, inline }: BugReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<'bug' | 'feature'>('bug');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_name: appName,
          type,
          description: description.trim(),
          user_email: email || null,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setOpen(false);
          setSubmitted(false);
          setDescription('');
          setEmail('');
          setType('bug');
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to submit report:', err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(true)}
        className={`${inline ? 'w-8 h-8 text-sm' : 'fixed bottom-6 right-6 z-50 w-12 h-12 text-xl shadow-lg'} bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-full flex items-center justify-center transition-all active:scale-95`}
        title="Report bug or request feature"
      >
        🐛
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden shadow-2xl">
            {submitted ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-white font-medium">Thanks for your feedback!</p>
                <p className="text-zinc-400 text-sm mt-1">We&apos;ll look into it.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                  <h3 className="text-white font-semibold">Send Feedback</h3>
                  <button type="button" onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white text-xl">×</button>
                </div>

                {/* Type Toggle */}
                <div className="px-5 pb-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setType('bug')}
                      className={`flex-1 py-2 text-sm rounded-lg border transition ${
                        type === 'bug'
                          ? 'bg-red-500/20 border-red-500/40 text-red-300'
                          : 'border-zinc-700 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      🐛 Bug Report
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('feature')}
                      className={`flex-1 py-2 text-sm rounded-lg border transition ${
                        type === 'feature'
                          ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                          : 'border-zinc-700 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      ✨ Feature Request
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div className="px-5 pb-3">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={type === 'bug' ? 'What went wrong?' : 'What would you like to see?'}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-500 resize-none focus:outline-none focus:border-zinc-500"
                    rows={4}
                    autoFocus
                    required
                  />
                </div>

                {/* Email (optional) */}
                <div className="px-5 pb-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email (optional, for follow-up)"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                  />
                </div>

                {/* Submit */}
                <div className="px-5 pb-5">
                  <button
                    type="submit"
                    disabled={submitting || !description.trim()}
                    className="w-full py-2.5 bg-white text-black font-medium rounded-lg text-sm hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    {submitting ? 'Sending...' : 'Submit'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
