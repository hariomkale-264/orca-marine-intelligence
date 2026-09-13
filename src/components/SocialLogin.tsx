import React, { useState } from 'react';
import { Github, Loader2 } from 'lucide-react';

interface SocialLoginProps {
  onSocialAuth?: (provider: 'google' | 'github' | 'apple') => void;
  disabled?: boolean;
}

export const SocialLogin: React.FC<SocialLoginProps> = ({ onSocialAuth, disabled = false }) => {
  const [activeProvider, setActiveProvider] = useState<string | null>(null);

  const handleProviderClick = (provider: 'google' | 'github' | 'apple') => {
    if (disabled || activeProvider) return;
    setActiveProvider(provider);
    setTimeout(() => {
      setActiveProvider(null);
      if (onSocialAuth) {
        onSocialAuth(provider);
      }
    }, 900);
  };

  return (
    <div className="w-full space-y-2.5">
      {/* Divider */}
      <div className="relative flex items-center justify-center my-3">
        <div className="w-full border-t border-white/15" />
        <span className="absolute bg-[#081528]/80 backdrop-blur-md px-3 text-[11px] font-semibold text-white/40 tracking-[0.12em] uppercase whitespace-nowrap">
          Or continue with
        </span>
      </div>

      {/* Social Buttons Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
        {/* Google Button */}
        <button
          type="button"
          id="btn-social-google"
          disabled={disabled || !!activeProvider}
          onClick={() => handleProviderClick('google')}
          aria-label="Continue with Google"
          title="Continue with Google"
          className="group relative flex items-center justify-center py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/15 hover:border-white/25 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium"
        >
          {activeProvider === 'google' ? (
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
          ) : (
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.1-2 .4-2.7L1.6 6.4C.6 8.3 0 10.1 0 12s.6 3.7 1.6 5.6l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.3L1.6 16C3.5 19.8 7.4 23 12 23z"
                />
              </svg>
              <span className="hidden sm:inline text-white/80 group-hover:text-white">Google</span>
            </div>
          )}
        </button>

        {/* GitHub Button */}
        <button
          type="button"
          id="btn-social-github"
          disabled={disabled || !!activeProvider}
          onClick={() => handleProviderClick('github')}
          aria-label="Continue with GitHub"
          title="Continue with GitHub"
          className="group relative flex items-center justify-center py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/15 hover:border-white/25 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium"
        >
          {activeProvider === 'github' ? (
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
          ) : (
            <div className="flex items-center gap-1.5">
              <Github className="w-4 h-4 flex-shrink-0 text-white/90 group-hover:text-white" />
              <span className="hidden sm:inline text-white/80 group-hover:text-white">GitHub</span>
            </div>
          )}
        </button>

        {/* Apple Button */}
        <button
          type="button"
          id="btn-social-apple"
          disabled={disabled || !!activeProvider}
          onClick={() => handleProviderClick('apple')}
          aria-label="Continue with Apple"
          title="Continue with Apple"
          className="group relative flex items-center justify-center py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/15 hover:border-white/25 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium"
        >
          {activeProvider === 'apple' ? (
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
          ) : (
            <div className="flex items-center gap-1.5">
              <svg
                className="w-4 h-4 flex-shrink-0 fill-current text-white/90 group-hover:text-white"
                viewBox="0 0 170 170"
              >
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.77-7.93-12.23-14.56-6.04-8.97-10.85-19.55-14.42-31.74-3.57-12.19-5.36-23.77-5.36-34.75 0-14.24 3.63-26.06 10.9-35.46 7.27-9.4 16.29-14.18 27.06-14.34 5.37 0 11.13 1.48 17.28 4.43 6.15 2.96 10.05 4.51 11.71 4.66 1.88-.15 6.04-1.74 12.48-4.79 6.45-3.04 12.35-4.47 17.72-4.29 13.51.65 24.31 5.48 32.38 14.5-11.83 7.18-17.63 17.06-17.41 29.62.22 9.9 4.02 18.06 11.4 24.5 7.38 6.43 16.14 10.15 26.28 11.15-2.22 6.64-4.88 13.31-7.98 20.02zM119.22 33.68c0-7.39 2.65-14.28 7.95-20.67 5.3-6.39 11.96-10.42 19.98-12.11.23 1.1.34 2.12.34 3.07 0 7.4-2.73 14.35-8.19 20.85-5.46 6.5-12.26 10.37-20.4 11.62-.07-.94-.1-1.86-.1-2.76z" />
              </svg>
              <span className="hidden sm:inline text-white/80 group-hover:text-white">Apple</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};
