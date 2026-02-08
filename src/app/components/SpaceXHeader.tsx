"use client";

import { useEffect, useState } from "react";
import { LogButton } from "./LogPanel";
import Link from "next/link";

type VersionInfo = {
  currentVersion: string;
  latestVersion: string | null;
  updateAvailable: boolean;
  releaseUrl?: string;
};

export function SpaceXHeader() {
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });
  const [missionTime, setMissionTime] = useState("T+00:00:00");
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);

  useEffect(() => {
    // Check for updates on mount and every 10 minutes
    const checkVersion = () => {
      fetch("/api/openclaw-version")
        .then((res) => res.json())
        .then((data) => setVersionInfo(data))
        .catch(() => {}); // Silently fail
    };
    
    checkVersion(); // Initial check
    const interval = setInterval(checkVersion, 600000); // Every 10 min
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Mission elapsed time since "launch" (session start)
    const launchTime = Date.now();
    
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - launchTime) / 1000);
      const h = Math.floor(elapsed / 3600);
      const m = Math.floor((elapsed % 3600) / 60);
      const s = elapsed % 60;
      setMissionTime(`T+${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-black/40 border border-white/10">
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          animation: 'grid-scroll 20s linear infinite',
        }} />
      </div>

      {/* Radar sweep effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-10">
        <div className="absolute inset-0 rounded-full border border-blue-500/50" />
        <div className="absolute inset-[15%] rounded-full border border-blue-500/30" />
        <div className="absolute inset-[30%] rounded-full border border-blue-500/20" />
        <div 
          className="absolute inset-0 origin-center"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0deg, rgba(59, 130, 246, 0.3) 30deg, transparent 60deg)',
            animation: 'radar-sweep 4s linear infinite',
          }}
        />
      </div>

      {/* Trajectory line */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <defs>
          <linearGradient id="trajectory-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0)" />
            <stop offset="30%" stopColor="rgba(59, 130, 246, 0.5)" />
            <stop offset="70%" stopColor="rgba(167, 139, 250, 0.5)" />
            <stop offset="100%" stopColor="rgba(167, 139, 250, 0)" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <path 
          d="M 0 180 Q 300 180 450 100 T 900 40 T 1200 60" 
          fill="none" 
          stroke="url(#trajectory-gradient)" 
          strokeWidth="2"
          filter="url(#glow)"
          className="trajectory-path"
        />
        {/* Rocket position indicator */}
        <circle cx="680" cy="55" r="6" fill="#60a5fa" filter="url(#glow)">
          <animate attributeName="cx" values="680;720;680" dur="3s" repeatCount="indefinite" />
          <animate attributeName="cy" values="55;45;55" dur="3s" repeatCount="indefinite" />
        </circle>
      </svg>

      {/* Content */}
      <div className="relative z-10 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left - Mission info */}
          <div className="flex items-center gap-6">
            {/* Mission patch / logo - Lobster emblem */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-blue-500/50 shadow-lg shadow-blue-500/20">
                <img 
                  src="/mission-emblem.png" 
                  alt="Mission Control Emblem"
                  className="w-full h-full object-cover scale-125"
                />
              </div>
              {/* Live pulse */}
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-black"></span>
              </span>
            </div>

            {/* Mission name & status */}
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-white">MISSION CONTROL</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-500/20 text-green-400 border border-green-500/30">
                  LIVE
                </span>
                <Link
                  href="/news"
                  className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-colors cursor-pointer"
                >
                  📰 NEWS
                </Link>
                <LogButton />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-slate-400 font-mono">
                  OPENCLAW {versionInfo?.currentVersion || "2026.2.6-3"} • Operations Command Center
                </p>
                {versionInfo?.updateAvailable && versionInfo.releaseUrl && (
                  <a
                    href={versionInfo.releaseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
                    title={`Update to ${versionInfo.latestVersion}`}
                  >
                    🔔 UPDATE
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Right - Telemetry */}
          <div className="flex items-center gap-8">
            {/* Mission elapsed time */}
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Mission Time</p>
              <p className="text-2xl font-mono font-bold text-blue-400">{missionTime}</p>
            </div>

            {/* Telemetry indicators */}
            <div className="flex gap-4">
              <TelemetryBox label="ALTITUDE" value="LEO" unit="" color="text-cyan-400" />
              <TelemetryBox label="VELOCITY" value="7.8" unit="km/s" color="text-green-400" />
              <TelemetryBox label="SYSTEMS" value="GO" unit="" color="text-green-400" status />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom data ticker */}
      <div className="relative z-10 border-t border-white/5 bg-black/30 px-6 py-1.5">
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase tracking-wider">
          <span>Tracking: All Systems Nominal</span>
          <span>Downlink: 2.4 Gbps</span>
          <span>Ground Stations: 4/4 Online</span>
          <span>Signal: Strong</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes grid-scroll {
          0% { transform: translate(0, 0); }
          100% { transform: translate(40px, 40px); }
        }
        @keyframes radar-sweep {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .trajectory-path {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: draw-trajectory 3s ease-out forwards;
        }
        @keyframes draw-trajectory {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}

function TelemetryBox({ label, value, unit, color, status }: { 
  label: string; 
  value: string; 
  unit: string; 
  color: string;
  status?: boolean;
}) {
  return (
    <div className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 min-w-[80px]">
      <p className="text-[9px] uppercase tracking-wider text-slate-600 mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        {status && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-1" />}
        <span className={`text-lg font-mono font-bold ${color}`}>{value}</span>
        {unit && <span className="text-[10px] text-slate-500">{unit}</span>}
      </div>
    </div>
  );
}
