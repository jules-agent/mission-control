"use client";

import { signOut, useSession } from "next-auth/react";

export function DashboardHeader() {
  const { data: session } = useSession();
  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Los_Angeles"
  });
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "America/Los_Angeles"
  });

  return (
    <header className="relative">
      {/* Main header card */}
      <div className="glass-strong rounded-3xl p-8 overflow-hidden">
        {/* Decorative gradient orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-500/15 to-cyan-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          {/* Left side - Branding & greeting */}
          <div className="space-y-4">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                {/* Live indicator */}
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 pulse-live" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gradient">Mission Control</h1>
                <p className="text-sm text-slate-400 mt-0.5">Command Center • All Systems Nominal</p>
              </div>
            </div>

            {/* Greeting */}
            <div className="pl-1">
              <p className="text-lg text-slate-300">
                Welcome back, <span className="text-white font-semibold">{session?.user?.name || "Commander"}</span>
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {currentDate} • {currentTime} PST
              </p>
            </div>
          </div>

          {/* Right side - Stats & actions */}
          <div className="flex flex-col items-end gap-4">
            {/* Quick stats */}
            <div className="flex gap-3">
              <div className="glass rounded-xl px-4 py-2 text-center min-w-[100px]">
                <p className="text-2xl font-bold text-emerald-400">3</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Services OK</p>
              </div>
              <div className="glass rounded-xl px-4 py-2 text-center min-w-[100px]">
                <p className="text-2xl font-bold text-violet-400">0</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Active Tasks</p>
              </div>
              <div className="glass rounded-xl px-4 py-2 text-center min-w-[100px]">
                <p className="text-2xl font-bold text-blue-400">24/7</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Monitoring</p>
              </div>
            </div>

            {/* Sign out */}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors group"
            >
              <span>Sign out</span>
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
