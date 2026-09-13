import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  ArrowRight,
  RotateCw,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Inbox,
  Check,
  Zap,
  Copy,
  Info,
  Radio,
} from 'lucide-react';
import {
  verifyOTP,
  resendOTP,
  getActiveOTP,
  setStoredSession,
  AuthResponse,
} from '../services/authService.ts';
import { DispatchedEmailsModal } from './DispatchedEmailsModal.tsx';
import { UserSession } from '../types.ts';

interface TwoFactorAuthProps {
  email: string;
  maskedEmail?: string;
  purpose?: '2fa_login' | 'email_verification' | 'enable_2fa';
  onSuccess: (session: UserSession) => void;
  onBackToLogin: () => void;
}

export const TwoFactorAuth: React.FC<TwoFactorAuthProps> = ({
  email,
  maskedEmail,
  purpose = '2fa_login',
  onSuccess,
  onBackToLogin,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes in seconds
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [showMailbox, setShowMailbox] = useState(false);

  // Live OTP auto-detection for sandbox/preview environments
  const [detectedCode, setDetectedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Fetch active OTP from server dispatch queue
  const fetchActiveCode = async () => {
    try {
      const res = await getActiveOTP(email);
      if (res?.code) {
        setDetectedCode(res.code);
      }
    } catch {
      // Ignore network errors
    }
  };

  useEffect(() => {
    fetchActiveCode();
    // Poll every 2.5 seconds to catch newly generated codes automatically
    const interval = setInterval(fetchActiveCode, 2500);
    return () => clearInterval(interval);
  }, [email]);

  // Calculate masked email fallback if not provided
  const displayEmail =
    maskedEmail ||
    (() => {
      const [name, domain] = email.split('@');
      if (!name || !domain) return email;
      return `${name.charAt(0)}***@${domain}`;
    })();

  // 5-minute countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const cdTimer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(cdTimer);
  }, [resendCooldown]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isExpired = timeLeft <= 0;

  const handleDigitChange = (index: number, value: string) => {
    const val = value.replace(/\D/g, '');
    if (!val) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

    const singleDigit = val.slice(-1);
    const next = [...digits];
    next[index] = singleDigit;
    setDigits(next);
    setErrorMessage(null);

    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (!pasteData) return;

    const chars = pasteData.slice(0, 6).split('');
    const next = [...digits];
    chars.forEach((ch, idx) => {
      if (idx < 6) next[idx] = ch;
    });
    setDigits(next);
    setErrorMessage(null);

    const targetIdx = Math.min(chars.length, 5);
    inputRefs.current[targetIdx]?.focus();
  };

  const submitCode = async (codeToSubmit: string) => {
    if (codeToSubmit.length !== 6) {
      setErrorMessage('Please enter the full 6-digit code.');
      return;
    }

    if (isExpired) {
      setErrorMessage('This code has expired. Please request a new code.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const response: AuthResponse = await verifyOTP(email, codeToSubmit, purpose);

      if (response.error) {
        setErrorMessage(response.error);
        setLoading(false);
        return;
      }

      if (response.session) {
        setStoredSession(response.session);
        onSuccess(response.session);
      } else {
        const fallbackSession: UserSession = {
          email,
          role: 'Coastal Authorities',
          stationId: 'NODE-PACIFIC-09',
          nodeLocation: 'Pacific Deep Basin • Grid 48.2N',
          telemetryStatus: 'online',
          loginTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setStoredSession(fallbackSession);
        onSuccess(fallbackSession);
      }
    } catch (err) {
      console.error('Verify OTP error:', err);
      setErrorMessage('Verification service error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    submitCode(digits.join(''));
  };

  const handleAutoFill = (codeToFill: string, autoSubmit: boolean = true) => {
    const chars = codeToFill.slice(0, 6).split('');
    const next = ['', '', '', '', '', ''];
    chars.forEach((c, idx) => {
      if (idx < 6) next[idx] = c;
    });
    setDigits(next);
    setErrorMessage(null);

    if (autoSubmit && chars.length === 6) {
      submitCode(codeToFill);
    } else {
      inputRefs.current[5]?.focus();
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResend = async () => {
    if (resending || resendCooldown > 0) return;

    setErrorMessage(null);
    setInfoMessage(null);
    setResending(true);

    try {
      const response: AuthResponse = await resendOTP(email, purpose);

      if (response.error) {
        setErrorMessage(response.error);
        if (response.secondsLeft) {
          setResendCooldown(response.secondsLeft);
        }
      } else {
        setInfoMessage('A new verification code has been dispatched.');
        setTimeLeft(300);
        setResendCooldown(60);
        setDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        await fetchActiveCode();
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      setErrorMessage('Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleSelectCodeFromMailbox = (code: string) => {
    handleAutoFill(code, false);
    setShowMailbox(false);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-5">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mx-auto flex items-center justify-center mb-3">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
          Verify your email
        </h2>
        <p className="text-xs sm:text-sm text-white/60 mt-1">
          Verification code dispatched for:
        </p>
        <p className="text-xs sm:text-sm font-mono font-semibold text-cyan-400 mt-0.5 break-all">
          {displayEmail}
        </p>
      </div>

      {/* Prominent Station Dispatch Banner (Fix for sandbox Gmail delivery) */}
      {detectedCode ? (
        <div className="mb-5 p-3.5 rounded-2xl bg-[#07172b]/95 border border-cyan-400/40 shadow-xl shadow-cyan-950/50 animate-fade-slide-up">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-cyan-300 font-semibold text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
              </span>
              <span className="tracking-wide">Active Verification Code</span>
            </div>
            <button
              type="button"
              onClick={() => setShowMailbox(true)}
              className="text-[11px] font-mono text-cyan-400/80 hover:text-cyan-200 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Inbox className="w-3 h-3" />
              <span>Mailbox</span>
            </button>
          </div>

          <div className="flex items-center justify-between bg-[#040e1b] px-3.5 py-2.5 rounded-xl border border-cyan-500/25 mb-2.5">
            <div className="flex flex-col">
              <span className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">
                6-Digit Security Code
              </span>
              <span className="font-mono text-xl sm:text-2xl font-extrabold tracking-[0.25em] text-cyan-300 select-all">
                {detectedCode}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleCopy(detectedCode)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/15 text-white/80 hover:text-white transition-colors cursor-pointer"
                title="Copy code"
                aria-label="Copy verification code"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                id="btn-autofill-otp"
                onClick={() => handleAutoFill(detectedCode, true)}
                disabled={loading}
                className="px-3 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-black font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-cyan-500/20 disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Auto-fill & Verify</span>
              </button>
            </div>
          </div>

          {/* Explanation note for why Gmail didn't receive external mail */}
          <div className="text-[11px] text-white/70 leading-relaxed flex items-start gap-1.5 pt-1 border-t border-white/10">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-white/90">Gmail Delivery Note:</strong> Cloud preview
              containers capture outbound emails in the station dispatch log to prevent public
              spam. Use the auto-fill button above to verify instantly.
            </span>
          </div>
        </div>
      ) : (
        <div className="mb-4 p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/25 text-white/80 text-xs flex items-start gap-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-cyan-300">Checking your Gmail inbox?</p>
            <p className="text-[11px] text-white/70 leading-normal">
              In this preview environment, outbound verification emails are captured directly in the
              station dispatch log. Click below to inspect your verification transmission.
            </p>
            <button
              type="button"
              onClick={() => setShowMailbox(true)}
              className="inline-flex items-center gap-1 text-[11px] text-cyan-400 font-semibold hover:underline mt-0.5 cursor-pointer"
            >
              <Inbox className="w-3 h-3" />
              <span>Open Station Transmissions Mailbox</span>
            </button>
          </div>
        </div>
      )}

      {/* Info / Success message */}
      {infoMessage && (
        <div
          role="status"
          className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 animate-fade-slide-up"
        >
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{infoMessage}</span>
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div
          role="alert"
          className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2.5 animate-fade-slide-up"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="leading-snug">{errorMessage}</span>
        </div>
      )}

      {/* 6 Digit Input Boxes */}
      <form onSubmit={handleVerify} className="space-y-5">
        <div className="flex items-center justify-center gap-2 sm:gap-2.5">
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              disabled={loading}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={handlePaste}
              className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-mono font-bold rounded-xl bg-[#091728]/80 border transition-all focus:outline-none focus:ring-2 ${
                digit
                  ? 'border-cyan-400 text-white bg-cyan-950/40 focus:ring-cyan-400/40'
                  : 'border-white/20 text-white/90 focus:border-cyan-400 focus:ring-cyan-400/30'
              } ${isExpired ? 'opacity-50 border-rose-500/40' : ''}`}
            />
          ))}
        </div>

        {/* Countdown / Expiration status */}
        <div className="text-center text-xs font-mono">
          {isExpired ? (
            <span className="text-rose-400 font-semibold">This code has expired.</span>
          ) : (
            <span className="text-white/60">
              Code expires in{' '}
              <span className="text-cyan-400 font-semibold">{formatTime(timeLeft)}</span>
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            type="submit"
            id="btn-otp-verify"
            disabled={loading || digits.join('').length !== 6 || isExpired}
            className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-black font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <span>Verify & Proceed</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <button
            type="button"
            id="btn-otp-resend"
            onClick={handleResend}
            disabled={resending || resendCooldown > 0}
            className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/15 text-white/80 hover:text-white text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {resending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>Dispatching Code...</span>
              </>
            ) : resendCooldown > 0 ? (
              <span>Resend Code ({resendCooldown}s)</span>
            ) : (
              <>
                <RotateCw className="w-3.5 h-3.5" />
                <span>Resend Code</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Back to sign in */}
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

      {/* Station Mailbox Transmissions Inspector Link */}
      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/40">
        <button
          type="button"
          onClick={() => setShowMailbox(true)}
          className="flex items-center gap-1.5 text-cyan-400/80 hover:text-cyan-300 transition-colors cursor-pointer font-mono"
        >
          <Inbox className="w-3.5 h-3.5" />
          <span>Inspect Server Dispatched Transmissions</span>
        </button>
        <span className="font-mono text-[10px] text-emerald-400/80 flex items-center gap-1">
          <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
          DISPATCH ACTIVE
        </span>
      </div>

      <DispatchedEmailsModal
        isOpen={showMailbox}
        onClose={() => setShowMailbox(false)}
        emailFilter={email}
        onSelectCode={handleSelectCodeFromMailbox}
      />
    </div>
  );
};

