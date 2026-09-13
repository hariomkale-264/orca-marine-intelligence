import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { MainAppBackground } from './MainAppBackground.tsx';
import { ORCANavbar } from './ORCANavbar.tsx';

export const MainLayout: React.FC = () => {
  const location = useLocation();
  const isHome = location.pathname === '/home' || location.pathname === '/';
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  return (
    <div
      className={`relative w-full selection:bg-white selection:text-black font-sans ${
        isHome
          ? 'h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col'
          : 'min-h-screen flex flex-col'
      }`}
    >
      {/* Background Video: Raw ambient marine footage */}
      <MainAppBackground />

      {/* Top Navigation Bar: Glassmorphic frosted shield matching marine aesthetic */}
      <div
        className={`sticky top-0 z-40 w-full shrink-0 pointer-events-auto transition-all duration-300 ${
          isScrolled ? 'glass-navbar glass-navbar-scrolled' : 'glass-navbar'
        }`}
      >
        <ORCANavbar />
      </div>

      {/* Dynamic Page Routed Outlet */}
      <main
        className={`relative z-10 flex-1 flex flex-col w-full min-h-0 ${
          isHome ? 'h-full overflow-hidden' : ''
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
};

