'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/identity');
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        router.push('/identity');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen bg-black text-white flex items-center justify-center px-4"
      style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      <div className="w-full max-w-[400px]">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <h1 className="text-[28px] font-bold tracking-tight mb-2">Identity</h1>
          <p className="text-[15px] text-zinc-500">
            {mode === 'login' ? 'Sign in to continue' : 'Create your account'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-zinc-900/80 rounded-xl overflow-hidden">
            <div className="px-4">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full py-[14px] bg-transparent text-[17px] text-white placeholder-zinc-500 focus:outline-none border-b border-zinc-800"
                placeholder="Email"
              />
            </div>
            <div className="px-4">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full py-[14px] bg-transparent text-[17px] text-white placeholder-zinc-500 focus:outline-none"
                placeholder="Password"
              />
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-500/10 rounded-xl">
              <p className="text-[13px] text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-[14px] bg-[#007AFF] hover:bg-[#0071E3] active:bg-[#0064CC] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-[17px] font-semibold transition-all duration-150"
          >
            {loading ? 'Signing in...' : mode === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}
            className="text-[15px] text-[#007AFF] active:opacity-60 transition-opacity"
          >
            {mode === 'login' ? "Create Account" : 'Already have an account?'}
          </button>
        </div>

        {/* Test credentials */}
        <div className="mt-10 text-center space-y-1">
          <p className="text-[13px] text-zinc-600">Test account</p>
          <p className="text-[13px] text-zinc-500">ben@test.jules3000.com</p>
          <p className="text-[13px] text-zinc-500">test-password-ben-2026</p>
        </div>

        <div className="mt-6 text-center pb-8">
          <Link href="/identity/demo" className="text-[13px] text-zinc-600 active:text-zinc-400 transition-colors">
            View demo →
          </Link>
        </div>
      </div>
    </div>
  );
}
