import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { NavigationTabs } from './NavigationTabs.tsx';
import { SettingsButton } from './SettingsButton.tsx';

export const ORCANavbar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('orca_session');
    navigate('/login');
  };

  return (
    <header
      id="orca-top-navbar"
      className="w-full relative z-30 px-4 sm:px-6 md:px-10 lg:px-14 py-2 sm:py-2.5"
    >
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-4">
        {/* Top row on mobile / Left on desktop */}
        <div className="w-full md:w-auto flex items-center justify-between md:justify-start">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
            aria-label="ORCA Home"
          >
            {/* Minimal ORCA Emblem */}
            <div className="w-8 h-8 rounded-xl bg-white/[0.08] border border-white/20 backdrop-blur-md flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:bg-white/20 transition-all duration-300">
              <svg
                viewBox="0 0 480 480"
                className="w-5 h-5 text-white transition-transform duration-300 group-hover:scale-110"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M480 240a240 240 0 0 0-240 240 240 240 0 0 0 240-240Z" />
                <path d="M240 0A240 240 0 0 0 0 240 240 240 0 0 240 0Z" />
                <path d="M480 240A240 240 0 0 0 240 0a240 240 0 0 0 240 240Z" />
                <path d="M240 480A240 240 0 0 0 0 240a240 240 0 0 0 240 240Z" />
              </svg>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-white font-bold tracking-[0.25em] text-base font-sans">
                ORCA
              </span>
              <span className="text-white/40 text-[9px] tracking-widest uppercase font-mono hidden sm:inline">
                MARINE AI
              </span>
            </div>
          </button>

          {/* Settings & Logout on mobile top-right */}
          <div className="flex items-center gap-1.5 md:hidden">
            <SettingsButton />
            <button
              onClick={handleLogout}
              title="Sign Out / Lock Console"
              aria-label="Sign Out"
              className="p-2 rounded-full bg-white/[0.08] backdrop-blur-xl text-white/80 hover:text-white border border-white/20 hover:bg-white/[0.18] hover:border-white/35 transition-all duration-200 cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <div className="w-full md:w-auto flex justify-center overflow-x-auto py-1">
          <NavigationTabs />
        </div>

        {/* Right: Settings & Logout Icons (Desktop) */}
        <div className="hidden md:flex items-center justify-end gap-2">
          <SettingsButton />
          <button
            onClick={handleLogout}
            title="Sign Out to Login Page"
            aria-label="Sign Out"
            className="p-2.5 rounded-full bg-white/[0.08] backdrop-blur-xl text-white/80 hover:text-white border border-white/20 hover:bg-white/[0.18] hover:border-white/35 transition-all duration-200 flex items-center justify-center cursor-pointer group shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
          >
            <LogOut className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
