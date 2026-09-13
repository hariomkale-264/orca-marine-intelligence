import React, { useState, useEffect } from 'react';
import { Mail, ArrowLeft, ArrowRight, KeyRound, CheckCircle, Loader2, AlertCircle, Eye, EyeOff, Inbox, Zap, Info } from 'lucide-react';
import { SecurityBadge } from './SecurityBadge.tsx';
import { forgotPassword, resetPassword, getDispatchedEmails, AuthResponse } from '../services/authService.ts';
import { DispatchedEmailsModal } from './DispatchedEmailsModal.tsx';

interface ForgotPasswordFlowProps {
  initialEmail?: string;
  initialToken?: string;
  onBackToLogin: () => void;
  onSuccessReset: () => void;
}

type Step = 'request' | 'reset-form' | 'success';

export const ForgotPasswordFlow: React.FC<ForgotPasswordFlowProps> = ({
  initialEmail = '',
  initialToken = '',
  onBackToLogin,
  onSuccessReset,
}) => {
  const [step, setStep] = useState<Step>(initialToken ? 'reset-form' : 'request');
  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [showMailbox, setShowMailbox] = useState(false);

  // Check URL query parameters for reset_token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('reset_token');
    const urlEmail = params.get('email');
    if (urlToken) {
      setToken(urlToken);
      if (urlEmail) setEmail(urlEmail);
      setStep('reset-form');
    }
  }, []);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessInfo(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const response: AuthResponse = await forgotPassword(trimmedEmail);
      if (response.error) {
        setErrorMessage(response.error);
      } else {
        setSuccessInfo(
          response.message || 'If an account exists with this email, a password reset link has been dispatched.'
        );
        // Automatically check if token is in server dispatch log
        try {
          const emails = await getDispatchedEmails(trimmedEmail);
          const resetEmail = emails.find((m) => m.type === 'password_reset');
          if (resetEmail) {
            const tokenMatch = resetEmail.body.match(/reset_token=([a-f0-9]{64})/i);
            if (tokenMatch) {
              setToken(tokenMatch[1]);
            }
          }
        } catch {
          // Non-blocking
        }
      }
    } catch (err) {
      console.error('Forgot password request error:', err);
      setErrorMessage('Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token.trim()) {
      setErrorMessage('Reset token is missing or invalid.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response: AuthResponse = await resetPassword({
        email: email.trim(),
        token: token.trim(),
        newPassword,
      });

      if (response.error) {
        setErrorMessage(response.error);
      } else {
        setStep('success');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setErrorMessage('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Step 1: Request Reset Link */}
      {step === 'request' && (
        <div>
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mx-auto flex items-center justify-center mb-3">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
              Reset your password
            </h2>
            <p className="text-xs sm:text-sm text-white/60 mt-1">
              Enter your email address and we'll send you a password reset link.
            </p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2.5 animate-fade-slide-up"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {successInfo && (
            <div
              role="status"
              className="mb-4 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs space-y-2.5 animate-fade-slide-up"
            >
              <div className="flex items-center gap-2 font-semibold text-emerald-300">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Reset Authorization Dispatched</span>
              </div>
              <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                {successInfo}
              </p>

              {token ? (
                <div className="pt-1.5 space-y-2">
                  <button
                    type="button"
                    onClick={() => setStep('reset-form')}
                    className="w-full py-2.5 px-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Apply Token & Set New Password</span>
                  </button>
                  <p className="text-[10px] text-white/50 text-center">
                    Captured directly from server transmission — no need to wait for external Gmail delivery.
                  </p>
                </div>
              ) : (
                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowMailbox(true)}
                    className="text-cyan-300 hover:text-cyan-200 underline text-xs font-mono font-medium"
                  >
                    Inspect Server Transmissions →
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('reset-form')}
                    className="px-3 py-1 bg-emerald-500/30 hover:bg-emerald-500/40 border border-emerald-400/50 rounded-lg text-white font-semibold text-[11px]"
                  >
                    Enter Reset Token
                  </button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleRequestReset} className="space-y-4">
            <div>
              <label htmlFor="reset-email" className="block text-xs font-semibold text-white/80 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-cyan-300/70 z-10">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="reset-email"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-black font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Link...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={onBackToLogin}
              className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Enter New Password with Token */}
      {step === 'reset-form' && (
        <div>
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mx-auto flex items-center justify-center mb-3">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
              Create new password
            </h2>
            <p className="text-xs sm:text-sm text-white/60 mt-1">
              Enter your reset verification token and choose a new secure password.
            </p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2.5 animate-fade-slide-up"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-3.5">
            {/* Token */}
            <div>
              <label htmlFor="reset-token" className="block text-xs font-semibold text-white/80 mb-1">
                Reset Token
              </label>
              <input
                id="reset-token"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste token from reset email"
                disabled={loading}
                className="w-full px-4 py-2.5 rounded-xl bg-[#091728]/80 border border-white/20 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 focus:bg-[#0c1f36]"
              />
            </div>

            {/* Email Confirmation */}
            <div>
              <label htmlFor="reset-confirm-email" className="block text-xs font-semibold text-white/80 mb-1">
                Account Email
              </label>
              <input
                id="reset-confirm-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@orca-marine.ai"
                disabled={loading}
                autoComplete="email"
                className="w-full px-4 py-2.5 rounded-xl bg-[#091728]/80 border border-white/20 text-white text-xs focus:outline-none focus:border-cyan-400 focus:bg-[#0c1f36]"
              />
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="reset-new-password" className="block text-xs font-semibold text-white/80 mb-1">
                New Password (minimum 8 characters)
              </label>
              <div className="relative">
                <input
                  id="reset-new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={loading}
                  autoComplete="new-password"
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-[#091728]/80 border border-white/20 text-white text-xs focus:outline-none focus:border-cyan-400 focus:bg-[#0c1f36]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/60 hover:text-white cursor-pointer z-10"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label htmlFor="reset-confirm-new-password" className="block text-xs font-semibold text-white/80 mb-1">
                Confirm New Password
              </label>
              <input
                id="reset-confirm-new-password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                disabled={loading}
                autoComplete="new-password"
                className="w-full px-4 py-2.5 rounded-xl bg-[#091728]/80 border border-white/20 text-white text-xs focus:outline-none focus:border-cyan-400 focus:bg-[#0c1f36]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-black font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <span>Update Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep('request')}
              className="text-xs text-white/60 hover:text-white transition-colors"
            >
              ← Back to Request
            </button>
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-xs text-white/60 hover:text-white transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Success Screen */}
      {step === 'success' && (
        <div className="text-center py-4 space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Password Reset Successful</h3>
            <p className="text-xs text-white/60 mt-1">
              Your account password has been securely updated. You may now sign in with your new credentials.
            </p>
          </div>
          <button
            type="button"
            onClick={onSuccessReset}
            className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs sm:text-sm transition-all duration-200 shadow-lg"
          >
            Sign In Now
          </button>
        </div>
      )}

      {/* Mailbox Transmissions Modal */}
      <DispatchedEmailsModal
        isOpen={showMailbox}
        onClose={() => setShowMailbox(false)}
        emailFilter={email}
        onSelectCode={(code) => {
          setToken(code);
          setShowMailbox(false);
        }}
      />
    </div>
  );
};
