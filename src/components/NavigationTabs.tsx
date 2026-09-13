import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavItem {
  name: string;
  path: string;
  id: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Home', path: '/home', id: 'nav-home' },
  { name: 'Dashboard', path: '/dashboard', id: 'nav-dashboard' },
  { name: 'Smart Navigation', path: '/smart-navigation', id: 'nav-smart-navigation' },
  { name: 'Evidence & Data', path: '/evidence-data', id: 'nav-evidence-data' },
];

export const NavigationTabs: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      id="orca-navigation-tabs"
      aria-label="Main Navigation"
      className="glass-pill-nav flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-full max-w-full overflow-x-auto scrollbar-none select-none"
    >
      {NAV_ITEMS.map((item) => {
        const isActive =
          location.pathname === item.path ||
          (item.path === '/home' && (location.pathname === '/' || location.pathname === ''));

        return (
          <button
            key={item.id}
            id={item.id}
            onClick={() => navigate(item.path)}
            className={`px-3.5 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm rounded-full whitespace-nowrap transition-all duration-300 select-none cursor-pointer ${
              isActive
                ? 'bg-white text-black font-semibold shadow-[0_2px_12px_rgba(255,255,255,0.4)] scale-[1.02]'
                : 'bg-transparent text-white/80 hover:text-white hover:bg-white/10 font-medium'
            }`}
          >
            {item.name}
          </button>
        );
      })}
    </nav>
  );
};
