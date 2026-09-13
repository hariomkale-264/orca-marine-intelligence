import React from 'react';
import { AnimatedBackground } from '../components/AnimatedBackground.tsx';
import { LoginCard } from '../components/LoginCard.tsx';

export const LoginPage: React.FC = () => {
  return (
    <main
      className="min-h-screen w-full relative overflow-x-hidden overflow-y-auto flex flex-col items-center justify-center selection:bg-cyan-500/30 selection:text-cyan-200"
      style={{
        fontFamily: '"Helvetica Now Var", Helvetica, Arial, sans-serif',
      }}
    >
      {/* Cinematic Animated Background with Video, Meteor, Atmospheric Movement */}
      <AnimatedBackground />

      {/* Main Content Area: Centered Login Glass Card */}
      <div className="relative z-10 w-full min-h-screen flex flex-col items-center justify-between py-6 px-4">
        {/* Subtle Top Ocean AI Telemetry Header */}
        <header className="w-full max-w-5xl flex items-center justify-between text-[11px] font-mono tracking-widest text-white/40 select-none px-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-white/60">SYS: ONLINE</span>
            <span className="hidden sm:inline text-white/30">•</span>
            <span className="hidden sm:inline">PACIFIC SATELLITE TELEMETRY</span>
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span>SECURE AI PROTOCOL</span>
            <span className="text-cyan-400/70 font-semibold">TLS 1.3</span>
          </div>
        </header>

        {/* Centered Glass Card */}
        <LoginCard />

        {/* Subtle Bottom Marine Telemetry Footer */}
        <footer className="w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-white/40 tracking-wider select-none px-2 pt-2">
          <div className="flex items-center gap-2">
            <span>© 2026 ORCA TECHNOLOGIES</span>
            <span>•</span>
            <span>AUTONOMOUS OCEANIC MESH</span>
          </div>
          <div className="text-white/30 text-[10px]">
            PROTECTED BY ZERO-TRUST MARINE TELEMETRY ENCLAVES
          </div>
        </footer>
      </div>
    </main>
  );
};
