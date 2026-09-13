import React, { useState, useEffect } from 'react';
import { Loader2, KeyRound, AlertCircle, X, ExternalLink } from 'lucide-react';
import { googleAuth, AuthResponse } from '../services/authService.ts';

interface GoogleButtonProps {
  onSuccess: (response: AuthResponse) => void;
  onError: (errorMsg: string) => void;
  disabled?: boolean;
}

declare global {
  interface Window {
    google?: any;
  }
}

export const GoogleButton: React.FC<GoogleButtonProps> = ({ onSuccess, onError, disabled = false }) => {
  const [loading, setLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [clientIdInput, setClientIdInput] = useState(() => {
    return localStorage.getItem('orca_google_client_id') || import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  });

  const activeClientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    localStorage.getItem('orca_google_client_id') ||
    '';

  const handleCredentialResponse = async (response: any) => {
    if (!response?.credential) {
      onError('Google sign-in could not be completed. Please try again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const authRes = await googleAuth(response.credential);
      if (authRes.error) {
        onError(authRes.error);
      } else {
        onSuccess(authRes);
      }
    } catch (err: any) {
      console.error('Error in googleAuth handler:', err);
      onError('Google authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const triggerGSI = (cid: string) => {
    if (!window.google?.accounts?.id) {
      onError('Google Identity Services is initializing. Please try again in a few seconds.');
      setLoading(false);
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: cid,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Prompt the user with Google One Tap or Account Selector
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // If prompt was dismissed or suppressed, show direct popup
          console.log('One tap suppressed or skipped, invoking token client');
        }
      });
    } catch (e: any) {
      console.error('Failed to initialize Google Sign-In:', e);
      onError('Google sign-in initialization failed. Please verify your Google Client ID.');
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (disabled || loading) return;

    if (!activeClientId) {
      // Prompt user to provide or confirm their Google Client ID
      setShowConfigModal(true);
      return;
    }

    setLoading(true);
    triggerGSI(activeClientId);
  };

  const handleSaveClientIdAndContinue = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = clientIdInput.trim();
    if (!trimmed) {
      onError('Please provide a valid Google Client ID.');
      return;
    }
    localStorage.setItem('orca_google_client_id', trimmed);
    setShowConfigModal(false);
    setLoading(true);
    triggerGSI(trimmed);
  };

  return (
    <>
      <button
        type="button"
        id="btn-continue-with-google"
        onClick={handleClick}
        disabled={disabled || loading}
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/15 hover:border-white/30 text-white font-medium text-xs sm:text-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm group"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
        ) : (
          <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
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
        )}
        <span className="font-semibold text-white/90 group-hover:text-white">
          Continue with Google
        </span>
      </button>

      {/* Google OAuth Client ID Modal when not set in environment */}
      {showConfigModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-slide-up"
        >
          <div className="relative w-full max-w-md bg-[#081528] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl text-white">
            <button
              onClick={() => setShowConfigModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold font-mono">GOOGLE OAUTH CLIENT CONFIGURATION</h4>
                <p className="text-[11px] text-white/50">
                  Real Google OAuth authentication via Google Identity Services
                </p>
              </div>
            </div>

            <p className="text-xs text-white/70 leading-relaxed mb-4">
              To complete real Google authentication, specify your Google OAuth 2.0 Web Client ID
              (from the Google Cloud Console).
            </p>

            <form onSubmit={handleSaveClientIdAndContinue} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-cyan-300 font-semibold mb-1.5">
                  GOOGLE CLIENT ID:
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1234567890-xxx.apps.googleusercontent.com"
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow"
                >
                  Connect with Google
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
