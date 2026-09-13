import React from 'react';

interface OrcaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const OrcaLogo: React.FC<OrcaLogoProps> = ({ size = 'md', showTagline = true }) => {
  const isLarge = size === 'lg';
  const isSmall = size === 'sm';

  return (
    <div className="flex flex-col items-center justify-center text-center select-none">
      {/* Glowing emblem container */}
      <div className="relative mb-3 group">
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-teal-400/20 rounded-full blur-md opacity-75 group-hover:opacity-100 transition duration-700" />
        <div className="relative flex items-center justify-center p-2 rounded-2xl bg-white/[0.04] border border-white/20 backdrop-blur-sm shadow-[0_0_20px_rgba(34,211,238,0.25)]">
          <svg
            viewBox="0 0 480 480"
            className={`${isLarge ? 'w-12 h-12' : isSmall ? 'w-8 h-8' : 'w-10 h-10'} text-white transition-transform duration-500 hover:scale-105`}
            fill="currentColor"
            aria-label="ORCA Emblem"
          >
            <path d="M480 240a240 240 0 0 0-240 240 240 240 0 0 0 240-240Z" />
            <path d="M240 0A240 240 0 0 0 0 240 240 240 0 0 0 240 0Z" />
            <path d="M480 240A240 240 0 0 0 240 0a240 240 0 0 0 240 240Z" />
            <path d="M240 480A240 240 0 0 0 0 240a240 240 0 0 0 240 240Z" />
          </svg>
        </div>
      </div>

      {/* Brand Title */}
      <h1 className="text-white text-2xl font-bold tracking-[0.2em] font-sans">
        ORCA
      </h1>

      {/* Subtitle / Tagline */}
      {showTagline && (
        <p className="text-white/60 text-xs tracking-[0.15em] mt-1 uppercase font-medium">
          Marine Intelligence • AI • Navigation
        </p>
      )}
    </div>
  );
};
