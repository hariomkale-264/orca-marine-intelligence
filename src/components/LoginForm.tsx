import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle, Inbox } from 'lucide-react';
import { GoogleButton } from './GoogleButton.tsx';
import { SecurityBadge } from './SecurityBadge.tsx';
import { DispatchedEmailsModal } from './DispatchedEmailsModal.tsx';
import { login, AuthResponse, setStoredSession } from '../services/authService.ts';
import { FormErrors, UserSession } from '../types.ts';

interface LoginFormProps {
  onSuccess: (session: UserSession) => void;
  onRequest2FA: (email: string, purpose: '2fa_login' | 'email_verification', maskedEmail?: string) => void;
  onNavigateForgotPassword: () => void;
  onNavigateSignup: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onRequest2FA,
  onNavigateForgotPassword,
  onNavigateSignup,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showMailbox, setShowMailbox] = useState(false);

  // Email format regex validation
  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!validateEmail(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const response: AuthResponse = await login(trimmedEmail, password);

      if (response.error) {
        setErrorMessage(response.error);
        if (response.requireVerification) {
          // Direct to OTP screen to verify unverified email
          onRequest2FA(response.rawEmail || trimmedEmail, 'email_verification', response.email);
        }
        setLoading(false);
        return;
      }

      if (response.require2FA) {
        // Direct to 2FA screen
        onRequest2FA(response.rawEmail || trimmedEmail, '2fa_login', response.email);
        setLoading(false);
        return;
      }

      if (response.session) {
        setStoredSession(response.session);
        onSuccess(response.session);
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage('Authentication service error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = (res: AuthResponse) => {
    if (res.require2FA) {
      onRequest2FA(res.rawEmail || email, '2fa_login', res.email);
    } else if (res.session) {
      setStoredSession(res.session);
      onSuccess(res.session);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
          Welcome Back
        </h2>
        <p className="text-xs sm:text-sm text-white/60 mt-1">
          Sign in to continue to your account
        </p>
      </div>

      {/* Continue with Google */}
      <div className="mb-4">
        <GoogleButton
          onSuccess={handleGoogleSuccess}
          onError={(err) => setErrorMessage(err)}
          disabled={loading}
        />
      </div>

      {/* Divider */}
      <div className="relative flex items-center justify-center my-4">
        <div className="w-full border-t border-white/15" />
        <span className="absolute bg-[#081528] px-3 text-[11px] font-semibold text-white/40 tracking-[0.12em] uppercase whitespace-nowrap">
          OR
        </span>
      </div>

      {/* Error Message Box */}
      {errorMessage && (
        <div
          role="alert"
          className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2.5 animate-fade-slide-up"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="leading-snug">{errorMessage}</span>
        </div>
      )}

      {/* Email & Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Email Field */}
        <div>
          <label
            htmlFor="login-email"
            className="block text-xs font-semibold text-white/80 mb-1.5"
          >
            Email address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-cyan-300/70 z-10">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMessage(null);
              }}
              placeholder="operator@orca-marine.ai"
              disabled={loading}
              autoComplete="email"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#091728]/80 border border-white/20 focus:border-cyan-400 focus:bg-[#0c1f36] text-white placeholder-white/35 text-xs sm:text-sm transition-all focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="login-password"
              className="block text-xs font-semibold text-white/80"
            >
              Password
            </label>
            <button
              type="button"
              id="link-forgot-password"
              onClick={onNavigateForgotPassword}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors focus:outline-none cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-cyan-300/70 z-10">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMessage(null);
              }}
              placeholder="••••••••••••"
              disabled={loading}
              autoComplete="current-password"
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#091728]/80 border border-white/20 focus:border-cyan-400 focus:bg-[#0c1f36] text-white placeholder-white/35 text-xs sm:text-sm transition-all focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/60 hover:text-white transition-colors cursor-pointer z-10"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          id="btn-login-submit"
          disabled={loading}
          className="w-full mt-2 py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-black font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Sign-up Link */}
      <div className="mt-5 text-center">
        <p className="text-xs text-white/60">
          Don't have an account?{' '}
          <button
            type="button"
            id="link-go-to-signup"
            onClick={onNavigateSignup}
            className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors focus:outline-none cursor-pointer"
          >
            Sign Up
          </button>
        </p>
      </div>

      {/* Dispatched Emails Transmissions Inspector Link */}
      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/40">
        <button
          type="button"
          onClick={() => setShowMailbox(true)}
          className="flex items-center gap-1.5 text-cyan-400/80 hover:text-cyan-300 transition-colors cursor-pointer font-mono"
        >
          <Inbox className="w-3.5 h-3.5" />
          <span>Station Mailbox Transmissions</span>
        </button>

        <SecurityBadge text="TLS 1.3 End-to-End" />
      </div>

      {/* Dispatched Emails Modal */}
      <DispatchedEmailsModal
        isOpen={showMailbox}
        onClose={() => setShowMailbox(false)}
        emailFilter={email || undefined}
      />
    </div>
  );
};
