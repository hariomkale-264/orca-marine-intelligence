import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { GoogleButton } from './GoogleButton.tsx';
import { SecurityBadge } from './SecurityBadge.tsx';
import { signup, AuthResponse, setStoredSession } from '../services/authService.ts';
import { UserSession } from '../types.ts';

interface SignupFormProps {
  onSuccess: (session: UserSession) => void;
  onRequestVerification: (email: string, purpose: 'email_verification', maskedEmail?: string) => void;
  onNavigateLogin: () => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({
  onSuccess,
  onRequestVerification,
  onNavigateLogin,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

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
      setErrorMessage('Please create a password.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response: AuthResponse = await signup({
        name: fullName.trim(),
        email: trimmedEmail,
        password,
        confirmPassword,
        role: 'Coastal Authorities',
        organization: 'Oceanic Research Network',
      });

      if (response.error) {
        setErrorMessage(response.error);
        setLoading(false);
        return;
      }

      if (response.requireVerification) {
        onRequestVerification(response.rawEmail || trimmedEmail, 'email_verification', response.email);
      } else if (response.session) {
        setStoredSession(response.session);
        onSuccess(response.session);
      }
    } catch (err) {
      console.error('Sign up error:', err);
      setErrorMessage('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = (res: AuthResponse) => {
    if (res.session) {
      setStoredSession(res.session);
      onSuccess(res.session);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
          Create your account
        </h2>
        <p className="text-xs sm:text-sm text-white/60 mt-1">
          Get started with your account
        </p>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div
          role="alert"
          className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2.5 animate-fade-slide-up"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="leading-snug">{errorMessage}</span>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
        {/* Full Name */}
        <div>
          <label
            htmlFor="signup-name"
            className="block text-xs font-semibold text-white/80 mb-1"
          >
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-cyan-300/70 z-10">
              <User className="w-4 h-4" />
            </div>
            <input
              id="signup-name"
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setErrorMessage(null);
              }}
              placeholder="Commander Alex Vance"
              disabled={loading}
              autoComplete="name"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#091728]/80 border border-white/20 focus:border-cyan-400 focus:bg-[#0c1f36] text-white placeholder-white/35 text-xs sm:text-sm transition-all focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="signup-email"
            className="block text-xs font-semibold text-white/80 mb-1"
          >
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-cyan-300/70 z-10">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMessage(null);
              }}
              placeholder="alex.vance@oceanic.org"
              disabled={loading}
              autoComplete="email"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#091728]/80 border border-white/20 focus:border-cyan-400 focus:bg-[#0c1f36] text-white placeholder-white/35 text-xs sm:text-sm transition-all focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="signup-password"
            className="block text-xs font-semibold text-white/80 mb-1"
          >
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-cyan-300/70 z-10">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMessage(null);
              }}
              placeholder="Minimum 8 characters"
              disabled={loading}
              autoComplete="new-password"
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

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="signup-confirm-password"
            className="block text-xs font-semibold text-white/80 mb-1"
          >
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-cyan-300/70 z-10">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="signup-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrorMessage(null);
              }}
              placeholder="Re-enter your password"
              disabled={loading}
              autoComplete="new-password"
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#091728]/80 border border-white/20 focus:border-cyan-400 focus:bg-[#0c1f36] text-white placeholder-white/35 text-xs sm:text-sm transition-all focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/60 hover:text-white transition-colors cursor-pointer z-10"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Create Account Button */}
        <button
          type="submit"
          id="btn-signup-submit"
          disabled={loading}
          className="w-full mt-3 py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-black font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating Account...</span>
            </>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative flex items-center justify-center my-4">
        <div className="w-full border-t border-white/15" />
        <span className="absolute bg-[#081528] px-3 text-[11px] font-semibold text-white/40 tracking-[0.12em] uppercase whitespace-nowrap">
          OR
        </span>
      </div>

      {/* Continue with Google */}
      <div className="mb-4">
        <GoogleButton
          onSuccess={handleGoogleSuccess}
          onError={(err) => setErrorMessage(err)}
          disabled={loading}
        />
      </div>

      {/* Link back to Sign In */}
      <div className="text-center mt-4">
        <p className="text-xs text-white/60">
          Already have an account?{' '}
          <button
            type="button"
            id="link-go-to-signin"
            onClick={onNavigateLogin}
            className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors focus:outline-none cursor-pointer"
          >
            Sign In
          </button>
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-center">
        <SecurityBadge text="Encrypted Credentials • scrypt KDF" />
      </div>
    </div>
  );
};
