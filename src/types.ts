export type AuthView =
  | 'login'
  | 'signup'
  | 'forgot-password'
  | 'reset-password'
  | '2fa'
  | 'authenticated';

export interface UserSession {
  token?: string;
  userId?: string;
  email: string;
  name?: string;
  organization?: string;
  role: string;
  stationId: string;
  nodeLocation: string;
  telemetryStatus: 'online' | 'synced';
  loginTimestamp: string;
  twoFactorEnabled?: boolean;
  authProvider?: 'email' | 'google';
}

export interface DispatchedEmailTransmission {
  id: string;
  to: string;
  subject: string;
  body: string;
  type: 'otp' | 'password_reset' | 'security_alert';
  timestamp: string;
  expiresAt?: string;
}

export interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
  general?: string;
}

export type OrcaRole =
  | 'Fisherman'
  | 'Marine Researchers'
  | 'Coastal Authorities'
  | 'Maritime Operators'
  | 'Default Mode';

export interface ChatMessageItem {
  id: string;
  sender: 'user' | 'orca';
  text: string;
  timestamp: string;
  role?: OrcaRole;
  language?: string;
  mode?: 'gemini-live' | 'telemetry-model' | 'telemetry-fallback';
}

export type AlertSeverityLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface AccountSettings {
  name: string;
  email: string;
  organization: string;
  role: string;
  avatarUrl?: string;
}

export interface NotificationSettings {
  enabled: boolean;
  cyclone: boolean;
  highWave: boolean;
  strongWind: boolean;
  heavyRain: boolean;
  marineRisk: boolean;
  pfz: boolean;
  environmentalAnomaly: boolean;
  email: boolean;
  sms: boolean;
  phone?: string;
  severity: AlertSeverityLevel[];
}

export interface LanguageSettings {
  selected: string;
  otherLanguage?: string;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginNotifications: boolean;
}

export interface PrivacySettings {
  storeAnalysisHistory: boolean;
  usageAnalytics: boolean;
  personalizedRecommendations: boolean;
  aiAnalysisHistory: boolean;
  locationAnalysisHistory: boolean;
}

export interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  isCurrent: boolean;
  lastActive: string;
  location?: string;
  ip?: string;
}

export interface OrcaPlatformSettings {
  account: AccountSettings;
  notifications: NotificationSettings;
  language: LanguageSettings;
  security: SecuritySettings;
  privacy: PrivacySettings;
}

export interface UserSettings {
  preferredLanguage: string;
  activeRole: OrcaRole;
  notifications: {
    marineStormAlerts: boolean;
    tidalWarnings: boolean;
    vesselAisUpdates: boolean;
  };
  units: {
    speed: 'knots' | 'kmh' | 'mph';
    temp: 'celsius' | 'fahrenheit';
    distance: 'nautical-miles' | 'km';
    depth: 'meters' | 'fathoms';
  };
  aiPreferences: {
    brevity: 'concise' | 'detailed';
    safetyStrictness: 'standard' | 'high';
  };
}
