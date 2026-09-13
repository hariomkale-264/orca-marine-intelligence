import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrcaLogo } from './OrcaLogo.tsx';
import { LoginForm } from './LoginForm.tsx';
import { SignupForm } from './SignupForm.tsx';
import { ForgotPasswordFlow } from './ForgotPasswordFlow.tsx';
import { TwoFactorAuth } from './TwoFactorAuth.tsx';
import { AuthenticatedView } from './AuthenticatedView.tsx';
import { AuthView, UserSession } from '../types.ts';
import { getStoredSession, setStoredSession, getCurrentUser, logout } from '../services/authService.ts';

export const LoginCard: React.FC = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<UserSession | null>(() => getStoredSession());
  const [currentView, setCurrentView] = useState<AuthView>(() => {
    const saved = getStoredSession();
    return saved ? 'authenticated' : 'login';
  });
  const [activeEmail, setActiveEmail] = useState<string>('');
  const [maskedEmail, setMaskedEmail] = useState<string>('');
  const [otpPurpose, setOtpPurpose] = useState<'2fa_login' | 'email_verification'>('2fa_login');

  // Verify stored session on mount against backend
  useEffect(() => {
    const checkSession = async () => {
      const stored = getStoredSession();
      if (stored?.token) {
        try {
          const res = await getCurrentUser();
          if (res.error) {
            setStoredSession(null);
            setSession(null);
            setCurrentView('login');
          }
        } catch {
          // If offline/error keep stored
        }
      }
    };
    checkSession();
  }, []);

  const handleLoginSuccess = (userSession: UserSession) => {
    setSession(userSession);
    setStoredSession(userSession);
    setCurrentView('authenticated');
    setTimeout(() => {
      navigate('/home');
    }, 1000);
  };

  const handleRequest2FA = (
    email: string,
    purpose: '2fa_login' | 'email_verification' = '2fa_login',
    masked?: string
  ) => {
    setActiveEmail(email);
    setOtpPurpose(purpose);
    if (masked) setMaskedEmail(masked);
    setCurrentView('2fa');
  };

  const handleSignOut = async () => {
    await logout();
    setSession(null);
    setCurrentView('login');
  };

  return (
    <div className="relative z-10 w-full flex items-center justify-center p-4 sm:p-6 my-auto">
      {/* Outer ambient glow behind card */}
      <div
        className="absolute w-full max-w-[460px] h-[600px] bg-gradient-to-tr from-cyan-500/10 via-teal-500/5 to-transparent rounded-[28px] blur-2xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      {/* Main Glassmorphism Card */}
      <div
        id="orca-auth-card"
        className="glass-card w-[calc(100%-16px)] sm:w-[calc(100%-32px)] max-w-[380px] sm:max-w-[440px] min-h-[560px] p-6 sm:p-8 flex flex-col items-center justify-between text-white animate-fade-slide-up transition-all duration-500"
      >
        {/* Continuous moving subtle light sheen sweep */}
        <div className="glass-card-sheen" aria-hidden="true" />

        {/* Content Container (elevated above sheen) */}
        <div className="relative z-10 w-full flex flex-col items-center flex-1 justify-center">
          {/* ORCA Brand Logo Header */}
          <div className="mb-5 w-full flex justify-center">
            <OrcaLogo />
          </div>

          {/* Dynamic Auth View */}
          <div className="w-full">
            {currentView === 'login' && (
              <LoginForm
                onSuccess={handleLoginSuccess}
                onRequest2FA={handleRequest2FA}
                onNavigateForgotPassword={() => setCurrentView('forgot-password')}
                onNavigateSignup={() => setCurrentView('signup')}
              />
            )}

            {currentView === 'signup' && (
              <SignupForm
                onSuccess={handleLoginSuccess}
                onRequestVerification={(email, purpose, masked) =>
                  handleRequest2FA(email, purpose, masked)
                }
                onNavigateLogin={() => setCurrentView('login')}
              />
            )}

            {currentView === 'forgot-password' && (
              <ForgotPasswordFlow
                initialEmail={activeEmail}
                onBackToLogin={() => setCurrentView('login')}
                onSuccessReset={() => setCurrentView('login')}
              />
            )}

            {currentView === '2fa' && (
              <TwoFactorAuth
                email={activeEmail}
                maskedEmail={maskedEmail}
                purpose={otpPurpose}
                onSuccess={handleLoginSuccess}
                onBackToLogin={() => setCurrentView('login')}
              />
            )}

            {currentView === 'authenticated' && session && (
              <AuthenticatedView
                session={session}
                onSignOut={handleSignOut}
                onEnterApp={() => navigate('/home')}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
