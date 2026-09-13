import { UserSession, DispatchedEmailTransmission } from '../types.ts';
import { safeFetchJson } from './apiClient.ts';

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
  return safeFetchJson<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim(), password }),
  });
}

export async function signup(payload: {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  organization?: string;
  role?: string;
}): Promise<AuthResponse> {
  return safeFetchJson<AuthResponse>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      email: payload.email.trim(),
    }),
  });
}

export async function verifyOTP(
  email: string,
  code: string,
  purpose: '2fa_login' | 'email_verification' | 'enable_2fa' | string = '2fa_login'
): Promise<AuthResponse> {
  return safeFetchJson<AuthResponse>('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim(), code: code.trim(), purpose }),
  });
}

export async function resendOTP(
  email: string,
  purpose: '2fa_login' | 'email_verification' | 'enable_2fa' | string = '2fa_login'
): Promise<AuthResponse> {
  return safeFetchJson<AuthResponse>('/api/auth/resend-otp', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim(), purpose }),
  });
}

export async function googleAuth(credential: string, accessToken?: string): Promise<AuthResponse> {
  return safeFetchJson<AuthResponse>('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential, accessToken }),
  });
}

export async function forgotPassword(email: string): Promise<AuthResponse> {
  return safeFetchJson<AuthResponse>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim() }),
  });
}

export async function resetPassword(payload: {
  email: string;
  token: string;
  newPassword: string;
}): Promise<AuthResponse> {
  return safeFetchJson<AuthResponse>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getCurrentUser(): Promise<{ user?: any; session?: UserSession; error?: string }> {
  const result = await safeFetchJson<{ user?: any; session?: UserSession; error?: string }>('/api/auth/me', {
    headers: getAuthHeaders(),
  });
  return result;
}

export async function logout(): Promise<void> {
  try {
    await safeFetchJson('/api/auth/logout', {
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
  return safeFetchJson('/api/auth/2fa/request-enable', {
    method: 'POST',
    headers: getAuthHeaders(),
  });
}

export async function confirmEnable2FA(code: string): Promise<{ success: boolean; twoFactorEnabled?: boolean; error?: string }> {
  return safeFetchJson('/api/auth/2fa/confirm-enable', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ code: code.trim() }),
  });
}

export async function disable2FA(): Promise<{ success: boolean; twoFactorEnabled?: boolean; error?: string }> {
  return safeFetchJson('/api/auth/2fa/disable', {
    method: 'POST',
    headers: getAuthHeaders(),
  });
}

export async function getDispatchedEmails(emailFilter?: string): Promise<DispatchedEmailTransmission[]> {
  try {
    const endpoint = emailFilter
      ? `/api/auth/dispatched-emails?email=${encodeURIComponent(emailFilter)}`
      : '/api/auth/dispatched-emails';
    const data = await safeFetchJson<{ emails?: DispatchedEmailTransmission[] }>(endpoint);
    return data.emails || [];
  } catch {
    return [];
  }
}

export interface ActiveOTPResponse {
  success: boolean;
  code: string | null;
  error?: string;
  to?: string;
  subject?: string;
  timestamp?: string;
  expiresAt?: string;
  isGlobalFallback?: boolean;
}

export async function getActiveOTP(email?: string): Promise<ActiveOTPResponse | null> {
  try {
    const endpoint = email ? `/api/auth/active-otp?email=${encodeURIComponent(email)}` : '/api/auth/active-otp';
    const res = await safeFetchJson<ActiveOTPResponse>(endpoint);
    if (res.error) return null;
    return res;
  } catch {
    return null;
  }
}
