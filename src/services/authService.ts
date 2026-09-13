import { UserSession, DispatchedEmailTransmission } from '../types.ts';

const SESSION_KEY = 'orca_session';

export interface AuthResponse {
  success?: boolean;
  error?: string;
  session?: UserSession;
  require2FA?: boolean;
  requireVerification?: boolean;
  email?: string;
  rawEmail?: string;
  message?: string;
  tooManyAttempts?: boolean;
  expired?: boolean;
  secondsLeft?: number;
  remainingAttempts?: number;
}

export function getStoredSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    return null;
  }
}

export function setStoredSession(session: UserSession | null): void {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function getAuthToken(): string | null {
  const session = getStoredSession();
  return session?.token || null;
}

function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), password }),
  });
  return res.json();
}

export async function signup(payload: {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  organization?: string;
  role?: string;
}): Promise<AuthResponse> {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      email: payload.email.trim(),
    }),
  });
  return res.json();
}

export async function verifyOTP(
  email: string,
  code: string,
  purpose: '2fa_login' | 'email_verification' | 'enable_2fa' | string = '2fa_login'
): Promise<AuthResponse> {
  const res = await fetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), code: code.trim(), purpose }),
  });
  return res.json();
}

export async function resendOTP(
  email: string,
  purpose: '2fa_login' | 'email_verification' | 'enable_2fa' | string = '2fa_login'
): Promise<AuthResponse> {
  const res = await fetch('/api/auth/resend-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), purpose }),
  });
  return res.json();
}

export async function googleAuth(credential: string, accessToken?: string): Promise<AuthResponse> {
  const res = await fetch('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential, accessToken }),
  });
  return res.json();
}

export async function forgotPassword(email: string): Promise<AuthResponse> {
  const res = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim() }),
  });
  return res.json();
}

export async function resetPassword(payload: {
  email: string;
  token: string;
  newPassword: string;
}): Promise<AuthResponse> {
  const res = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function getCurrentUser(): Promise<{ user?: any; session?: UserSession; error?: string }> {
  const res = await fetch('/api/auth/me', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    return { error: 'Unauthorized' };
  }
  return res.json();
}

export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  } catch (err) {
    console.error('Logout error:', err);
  } finally {
    setStoredSession(null);
  }
}

export async function requestEnable2FA(): Promise<{ success: boolean; message?: string; error?: string; rawEmail?: string }> {
  const res = await fetch('/api/auth/2fa/request-enable', {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return res.json();
}

export async function confirmEnable2FA(code: string): Promise<{ success: boolean; twoFactorEnabled?: boolean; error?: string }> {
  const res = await fetch('/api/auth/2fa/confirm-enable', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ code: code.trim() }),
  });
  return res.json();
}

export async function disable2FA(): Promise<{ success: boolean; twoFactorEnabled?: boolean; error?: string }> {
  const res = await fetch('/api/auth/2fa/disable', {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return res.json();
}

export async function getDispatchedEmails(emailFilter?: string): Promise<DispatchedEmailTransmission[]> {
  try {
    const url = emailFilter
      ? `/api/auth/dispatched-emails?email=${encodeURIComponent(emailFilter)}`
      : '/api/auth/dispatched-emails';
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.emails || [];
  } catch {
    return [];
  }
}

export interface ActiveOTPResponse {
  success: boolean;
  code: string | null;
  to?: string;
  subject?: string;
  timestamp?: string;
  expiresAt?: string;
  isGlobalFallback?: boolean;
}

export async function getActiveOTP(email?: string): Promise<ActiveOTPResponse | null> {
  try {
    const url = email ? `/api/auth/active-otp?email=${encodeURIComponent(email)}` : '/api/auth/active-otp';
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

