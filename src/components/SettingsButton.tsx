import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';

export const SettingsButton: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isSettingsActive = location.pathname === '/settings';

  const handleClick = () => {
    if (isSettingsActive) {
      navigate('/home');
    } else {
      navigate('/settings');
    }
  };

  return (
    <button
      id="orca-settings-button"
      onClick={handleClick}
      aria-label={isSettingsActive ? 'Close Settings and return to Home' : 'ORCA Settings'}
      title={isSettingsActive ? 'Close Settings (Return to Home)' : 'ORCA Settings'}
      className={`relative p-2 sm:p-2.5 rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer group ${
        isSettingsActive
          ? 'bg-white text-black shadow-[0_2px_12px_rgba(255,255,255,0.4)] ring-2 ring-cyan-400/40'
          : 'bg-white/[0.08] backdrop-blur-xl text-white/90 border border-white/20 hover:bg-white/[0.18] hover:border-white/35 hover:text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
      }`}
    >
      <Settings
        className={`w-5 h-5 transition-transform duration-300 ${
          isSettingsActive ? 'rotate-90 text-black' : 'group-hover:rotate-45'
        }`}
      />
    </button>
  );
};
