/**
 * ORCA Marine Intelligence Platform
 * Settings & Operator Preferences Service
 *
 * Provides modular, backend-ready functions with local state/localStorage persistence.
 * Ready for drop-in replacement with backend REST/GraphQL endpoints:
 * - GET    /api/settings
 * - PUT    /api/settings/account
 * - PUT    /api/notifications
 * - PUT    /api/language
 * - PUT    /api/security
 * - PUT    /api/privacy
 * - POST   /api/change-password
 * - POST   /api/2fa/enable
 * - POST   /api/2fa/disable
 * - GET    /api/sessions
 * - DELETE /api/sessions/:id
 * - DELETE /api/sessions/others
 * - DELETE /api/analysis-history
 * - GET    /api/user/export
 * - DELETE /api/user/data
 */

import {
  AccountSettings,
  ActiveSession,
  LanguageSettings,
  NotificationSettings,
  OrcaPlatformSettings,
  PrivacySettings,
  SecuritySettings,
} from '../types.ts';
import { buildApiUrl } from './apiClient.ts';

const STORAGE_KEY_SETTINGS = 'orca_settings';
const STORAGE_KEY_NOTIFICATIONS = 'orca_notification_preferences';
const STORAGE_KEY_LANGUAGE = 'orca_language';
const STORAGE_KEY_PRIVACY = 'orca_privacy_settings';
const STORAGE_KEY_SESSIONS = 'orca_sessions';
const STORAGE_KEY_ANALYSIS_HISTORY = 'orca_analysis_history';
const STORAGE_KEY_ACTIVE_ROLE = 'orca_active_role';
const STORAGE_KEY_PREFERRED_LANG = 'orca_preferred_language';
const STORAGE_KEY_USER_SESSION = 'orca_session';

export const DEFAULT_SETTINGS: OrcaPlatformSettings = {
  account: {
    name: 'Rahul Sharma',
    email: 'rahul@example.com',
    organization: 'Marine Research Department',
    role: 'Researcher',
  },
  notifications: {
    enabled: true,
    cyclone: true,
    highWave: true,
    strongWind: true,
    heavyRain: true,
    marineRisk: true,
    pfz: true,
    environmentalAnomaly: true,
    email: true,
    sms: false,
    phone: '+91 98765 43210',
    severity: ['moderate', 'high', 'critical'],
  },
  language: {
    selected: 'English',
    otherLanguage: '',
  },
  security: {
    twoFactorEnabled: false,
    loginNotifications: true,
  },
  privacy: {
    storeAnalysisHistory: true,
    usageAnalytics: true,
    personalizedRecommendations: true,
    aiAnalysisHistory: true,
    locationAnalysisHistory: true,
  },
};

export const INITIAL_SESSIONS: ActiveSession[] = [
  {
    id: 'session-win-current',
    device: 'Windows PC (Command Station)',
    browser: 'Chrome 128.0',
    isCurrent: true,
    lastActive: 'Active now',
    location: 'Mumbai Coastal Command (IN)',
    ip: '103.21.58.14',
  },
  {
    id: 'session-android-mobile',
    device: 'Android (Vessel Field Tablet)',
    browser: 'Chrome Mobile 127',
    isCurrent: false,
    lastActive: 'Last active: 2 hours ago',
    location: 'Goa Harbor Marine Hub',
    ip: '103.88.24.91',
  },
  {
    id: 'session-apple-pad',
    device: 'iPad Pro (Navigational Bridge)',
    browser: 'Safari 17.5',
    isCurrent: false,
    lastActive: 'Last active: Yesterday at 18:42',
    location: 'Ratnagiri Port Operations',
    ip: '49.36.120.4',
  },
];

/**
 * Retrieves the unified user settings from storage or defaults.
 * Synchronizes with existing session if user is logged in.
 */
export const getUserSettings = (): OrcaPlatformSettings => {
  let settings = { ...DEFAULT_SETTINGS };

  // 1. Check main settings storage
  const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings);
      settings = {
        account: { ...settings.account, ...(parsed.account || {}) },
        notifications: { ...settings.notifications, ...(parsed.notifications || {}) },
        language: { ...settings.language, ...(parsed.language || {}) },
        security: { ...settings.security, ...(parsed.security || {}) },
        privacy: { ...settings.privacy, ...(parsed.privacy || {}) },
      };
    } catch (e) {
      console.warn('[ORCA Settings] Failed to parse saved settings, using defaults.', e);
    }
  }

  // 2. Synchronize account with active user session if available
  const savedSession = localStorage.getItem(STORAGE_KEY_USER_SESSION);
  if (savedSession) {
    try {
      const sessionObj = JSON.parse(savedSession);
      if (sessionObj.name) settings.account.name = sessionObj.name;
      if (sessionObj.email) settings.account.email = sessionObj.email;
      if (sessionObj.organization) settings.account.organization = sessionObj.organization;
      if (sessionObj.role) settings.account.role = sessionObj.role;
    } catch {
      // ignore
    }
  }

  // 3. Synchronize separate keys if present
  const savedLang = localStorage.getItem(STORAGE_KEY_PREFERRED_LANG) || localStorage.getItem(STORAGE_KEY_LANGUAGE);
  if (savedLang) {
    settings.language.selected = savedLang;
  }

  const savedRole = localStorage.getItem(STORAGE_KEY_ACTIVE_ROLE);
  if (savedRole) {
    settings.account.role = savedRole;
  }

  const savedNotifs = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
  if (savedNotifs) {
    try {
      settings.notifications = { ...settings.notifications, ...JSON.parse(savedNotifs) };
    } catch {
      // ignore
    }
  }

  const savedPrivacy = localStorage.getItem(STORAGE_KEY_PRIVACY);
  if (savedPrivacy) {
    try {
      settings.privacy = { ...settings.privacy, ...JSON.parse(savedPrivacy) };
    } catch {
      // ignore
    }
  }

  return settings;
};

/**
 * Updates account settings and persists them.
 * Future API: PUT /api/settings
 */
export const updateUserSettings = async (
  account: Partial<AccountSettings>
): Promise<AccountSettings> => {
  const current = getUserSettings();
  const updatedAccount: AccountSettings = {
    ...current.account,
    ...account,
  };

  const updatedSettings: OrcaPlatformSettings = {
    ...current,
    account: updatedAccount,
  };

  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updatedSettings));
  if (account.role) {
    localStorage.setItem(STORAGE_KEY_ACTIVE_ROLE, account.role);
  }

  // Also keep active user session in sync
  const savedSession = localStorage.getItem(STORAGE_KEY_USER_SESSION);
  if (savedSession) {
    try {
      const sessionObj = JSON.parse(savedSession);
      const updatedSession = {
        ...sessionObj,
        name: updatedAccount.name,
        organization: updatedAccount.organization,
        role: updatedAccount.role,
      };
      localStorage.setItem(STORAGE_KEY_USER_SESSION, JSON.stringify(updatedSession));
    } catch {
      // ignore
    }
  }

  return updatedAccount;
};

/**
 * Updates notification preferences.
 * Future API: PUT /api/notifications
 */
export const updateNotificationPreferences = async (
  notifications: Partial<NotificationSettings>
): Promise<NotificationSettings> => {
  const current = getUserSettings();
  const updated: NotificationSettings = {
    ...current.notifications,
    ...notifications,
  };

  const updatedSettings: OrcaPlatformSettings = {
    ...current,
    notifications: updated,
  };

  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updatedSettings));
  localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(updated));

  return updated;
};

/**
 * Updates language preferences.
 * Future API: PUT /api/language
 */
export const updateLanguageSettings = async (
  language: LanguageSettings
): Promise<LanguageSettings> => {
  const current = getUserSettings();
  const updatedSettings: OrcaPlatformSettings = {
    ...current,
    language,
  };

  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updatedSettings));
  localStorage.setItem(STORAGE_KEY_LANGUAGE, language.selected);
  localStorage.setItem(STORAGE_KEY_PREFERRED_LANG, language.selected);

  return language;
};

/**
 * Updates security settings (2FA, login notifications).
 * Future API: PUT /api/security
 */
export const updateSecuritySettings = async (
  security: Partial<SecuritySettings>
): Promise<SecuritySettings> => {
  const current = getUserSettings();
  const updated: SecuritySettings = {
    ...current.security,
    ...security,
  };

  const updatedSettings: OrcaPlatformSettings = {
    ...current,
    security: updated,
  };

  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updatedSettings));
  return updated;
};

/**
 * Updates privacy settings.
 * Future API: PUT /api/privacy
 */
export const updatePrivacySettings = async (
  privacy: Partial<PrivacySettings>
): Promise<PrivacySettings> => {
  const current = getUserSettings();
  const updated: PrivacySettings = {
    ...current.privacy,
    ...privacy,
  };

  const updatedSettings: OrcaPlatformSettings = {
    ...current,
    privacy: updated,
  };

  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updatedSettings));
  localStorage.setItem(STORAGE_KEY_PRIVACY, JSON.stringify(updated));

  return updated;
};

/**
 * Mock change password implementation.
 * Never stores real passwords in localStorage.
 * Future API: POST /api/change-password
 */
export const changePassword = async (
  _currentPassword: string,
  _newPassword: string
): Promise<{ success: boolean; message: string }> => {
  // Simulate network roundtrip
  await new Promise((res) => setTimeout(res, 400));
  return {
    success: true,
    message: 'Operator security credentials have been updated securely.',
  };
};

/**
 * Requests 2FA activation code via email dispatch.
 * API: POST /api/auth/2fa/request-enable
 */
export const requestTwoFactorActivation = async (): Promise<{ success: boolean; message?: string; error?: string; rawEmail?: string }> => {
  try {
    const token = localStorage.getItem('orca_session')
      ? JSON.parse(localStorage.getItem('orca_session') || '{}')?.token
      : null;
    const res = await fetch(buildApiUrl('/api/auth/2fa/request-enable'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: 'Failed to request verification code.' };
  }
};

/**
 * Enables 2FA for the account with real verification code.
 * API: POST /api/auth/2fa/confirm-enable
 */
export const enableTwoFactor = async (code: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const token = localStorage.getItem('orca_session')
      ? JSON.parse(localStorage.getItem('orca_session') || '{}')?.token
      : null;
    const res = await fetch(buildApiUrl('/api/auth/2fa/confirm-enable'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ code: code.trim() }),
    });
    const data = await res.json();
    if (data.success) {
      await updateSecuritySettings({ twoFactorEnabled: true });
      // Update session if present
      const sessionRaw = localStorage.getItem('orca_session');
      if (sessionRaw) {
        const session = JSON.parse(sessionRaw);
        session.twoFactorEnabled = true;
        localStorage.setItem('orca_session', JSON.stringify(session));
      }
      return { success: true };
    }
    return { success: false, error: data.error || 'Invalid verification code.' };
  } catch {
    return { success: false, error: 'Connection error during verification.' };
  }
};

/**
 * Disables 2FA for the account.
 * API: POST /api/auth/2fa/disable
 */
export const disableTwoFactor = async (): Promise<boolean> => {
  try {
    const token = localStorage.getItem('orca_session')
      ? JSON.parse(localStorage.getItem('orca_session') || '{}')?.token
      : null;
    await fetch(buildApiUrl('/api/auth/2fa/disable'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch (e) {
    console.error('Disable 2FA error:', e);
  }
  await updateSecuritySettings({ twoFactorEnabled: false });
  const sessionRaw = localStorage.getItem('orca_session');
  if (sessionRaw) {
    const session = JSON.parse(sessionRaw);
    session.twoFactorEnabled = false;
    localStorage.setItem('orca_session', JSON.stringify(session));
  }
  return true;
};

/**
 * Retrieves active device sessions.
 * Future API: GET /api/sessions
 */
export const getActiveSessions = (): ActiveSession[] => {
  const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  return INITIAL_SESSIONS;
};

/**
 * Revokes a specific non-current session.
 * Future API: DELETE /api/sessions/:id
 */
export const revokeSession = async (sessionId: string): Promise<ActiveSession[]> => {
  const sessions = getActiveSessions().filter((s) => s.id !== sessionId || s.isCurrent);
  localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
  return sessions;
};

/**
 * Signs out all other sessions except current.
 * Future API: DELETE /api/sessions/others
 */
export const revokeAllOtherSessions = async (): Promise<ActiveSession[]> => {
  const sessions = getActiveSessions().filter((s) => s.isCurrent);
  localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
  return sessions;
};

/**
 * Clears stored analysis history.
 * Future API: DELETE /api/analysis-history
 */
export const clearAnalysisHistory = async (): Promise<boolean> => {
  localStorage.removeItem(STORAGE_KEY_ANALYSIS_HISTORY);
  // Also remove transient location pins
  localStorage.removeItem('orca_pinned_locations');
  return true;
};

/**
 * Downloads user data as a structured JSON file.
 * Future API: GET /api/user/export
 */
export const downloadUserData = (): void => {
  const settings = getUserSettings();
  const sessions = getActiveSessions();
  const exportPayload = {
    exportMetadata: {
      platform: 'ORCA Marine Intelligence Platform',
      version: '2.4.0',
      exportedAt: new Date().toISOString(),
      exportType: 'User Account & Marine Telemetry Preferences',
    },
    account: settings.account,
    notifications: settings.notifications,
    language: settings.language,
    security: {
      twoFactorEnabled: settings.security.twoFactorEnabled,
      loginNotifications: settings.security.loginNotifications,
      activeSessionsCount: sessions.length,
    },
    privacy: settings.privacy,
    activeSessions: sessions,
  };

  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(exportPayload, null, 2)
  )}`;
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonString);
  downloadAnchor.setAttribute('download', `orca_user_telemetry_export_${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

/**
 * Deletes all user data and resets preferences to default.
 * Future API: DELETE /api/user/data
 */
export const deleteUserData = async (): Promise<boolean> => {
  localStorage.removeItem(STORAGE_KEY_SETTINGS);
  localStorage.removeItem(STORAGE_KEY_NOTIFICATIONS);
  localStorage.removeItem(STORAGE_KEY_LANGUAGE);
  localStorage.removeItem(STORAGE_KEY_PRIVACY);
  localStorage.removeItem(STORAGE_KEY_ANALYSIS_HISTORY);
  localStorage.removeItem(STORAGE_KEY_SESSIONS);
  localStorage.removeItem('orca_pinned_locations');
  return true;
};
