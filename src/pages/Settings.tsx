import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Bell,
  Languages,
  ShieldCheck,
  Shield,
  KeyRound,
  MonitorSmartphone,
  History,
  Database,
  LogOut,
  Check,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Eye,
  EyeOff,
  Smartphone,
  Mail,
  Waves,
  Wind,
  CloudRain,
  ShieldAlert,
  Fish,
  Activity,
  Download,
  Trash2,
  X,
  Copy,
  Laptop,
  Tablet,
  Settings as SettingsIcon,
  Sparkles,
  Info,
  Radio,
} from 'lucide-react';
import {
  AccountSettings,
  ActiveSession,
  AlertSeverityLevel,
  LanguageSettings,
  NotificationSettings,
  OrcaPlatformSettings,
  PrivacySettings,
  SecuritySettings,
} from '../types.ts';
import {
  changePassword,
  clearAnalysisHistory,
  deleteUserData,
  disableTwoFactor,
  downloadUserData,
  enableTwoFactor,
  requestTwoFactorActivation,
  getActiveSessions,
  getUserSettings,
  revokeAllOtherSessions,
  revokeSession,
  updateLanguageSettings,
  updateNotificationPreferences,
  updatePrivacySettings,
  updateSecuritySettings,
  updateUserSettings,
} from '../services/settingsService.ts';
import { DispatchedEmailsModal } from '../components/DispatchedEmailsModal.tsx';

type SettingsTab = 'account' | 'notifications' | 'language' | 'privacy';

interface SettingsProps {
  onSignOut?: () => void;
}

const ROLES = [
  'Researcher',
  'Fisherman',
  'Coastal Authorities',
  'Maritime Operators',
  'Telemetry Specialist',
  'Oceanographer',
];

const OTHER_INDIAN_LANGUAGES = [
  { code: 'Bengali', label: 'Bengali (বাংলা)' },
  { code: 'Gujarati', label: 'Gujarati (ગુજરાતી)' },
  { code: 'Kannada', label: 'Kannada (ಕನ್ನಡ)' },
  { code: 'Malayalam', label: 'Malayalam (മലയാളം)' },
  { code: 'Punjabi', label: 'Punjabi (ਪੰਜਾਬੀ)' },
  { code: 'Tamil', label: 'Tamil (தமிழ்)' },
  { code: 'Telugu', label: 'Telugu (తెలుగు)' },
  { code: 'Odia', label: 'Odia (ଓଡ଼ିଆ)' },
  { code: 'Assamese', label: 'Assamese (অসমীয়া)' },
];

export const Settings: React.FC<SettingsProps> = ({ onSignOut }) => {
  const navigate = useNavigate();

  // Active tab state
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');

  // Unified settings state
  const [settings, setSettings] = useState<OrcaPlatformSettings>(() => getUserSettings());

  // Editable Account form state
  const [accountForm, setAccountForm] = useState<AccountSettings>(() => settings.account);
  const [isSavingAccount, setIsSavingAccount] = useState(false);

  // Active sessions state
  const [sessions, setSessions] = useState<ActiveSession[]>(() => getActiveSessions());

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [showDeleteDataModal, setShowDeleteDataModal] = useState(false);

  // Password Modal form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // 2FA modal state
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorMethod, setTwoFactorMethod] = useState<'totp' | 'sms'>('totp');
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showMailboxModal, setShowMailboxModal] = useState(false);

  // Notification SMS phone input editing
  const [phoneInput, setPhoneInput] = useState(settings.notifications.phone || '+91 98765 43210');

  // Sync account form if settings change
  useEffect(() => {
    setAccountForm(settings.account);
  }, [settings.account]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // ----------------------------------------------------
  // ACCOUNT HANDLERS
  // ----------------------------------------------------
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAccount(true);
    try {
      const updated = await updateUserSettings(accountForm);
      setSettings((prev) => ({ ...prev, account: updated }));
      showToast('Account changes saved successfully');
    } catch {
      showToast('Error saving account changes');
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    localStorage.removeItem('orca_session');
    if (onSignOut) {
      onSignOut();
    } else {
      navigate('/login');
    }
  };

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'None', color: 'bg-white/20' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
    if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
    if (score === 3) return { score: 3, label: 'Good', color: 'bg-cyan-500' };
    return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation password do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setTimeout(() => {
        setPasswordSuccess(false);
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        showToast('Password updated securely');
      }, 1200);
    } catch {
      setPasswordError('Failed to update password. Please try again.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // ----------------------------------------------------
  // NOTIFICATIONS HANDLERS
  // ----------------------------------------------------
  const handleToggleMasterNotification = async (enabled: boolean) => {
    const updated = await updateNotificationPreferences({ enabled });
    setSettings((prev) => ({ ...prev, notifications: updated }));
    showToast(enabled ? 'All notifications enabled' : 'Notifications disabled');
  };

  const handleToggleCategory = async (key: keyof NotificationSettings, value: boolean) => {
    const updated = await updateNotificationPreferences({ [key]: value });
    setSettings((prev) => ({ ...prev, notifications: updated }));
    showToast('Notification preference updated');
  };

  const handleToggleSeverity = async (level: AlertSeverityLevel) => {
    const current = settings.notifications.severity;
    let next: AlertSeverityLevel[];
    if (current.includes(level)) {
      // Keep at least one severity level selected
      if (current.length === 1) {
        showToast('At least one severity tier must remain selected');
        return;
      }
      next = current.filter((l) => l !== level);
    } else {
      next = [...current, level];
    }
    const updated = await updateNotificationPreferences({ severity: next });
    setSettings((prev) => ({ ...prev, notifications: updated }));
  };

  // ----------------------------------------------------
  // LANGUAGE HANDLERS
  // ----------------------------------------------------
  const handleSelectLanguage = async (lang: string, otherLang = '') => {
    const newLangState: LanguageSettings = {
      selected: lang,
      otherLanguage: otherLang,
    };
    const updated = await updateLanguageSettings(newLangState);
    setSettings((prev) => ({ ...prev, language: updated }));
    showToast(`Language set to ${lang}${otherLang ? ` (${otherLang})` : ''}`);
  };

  // ----------------------------------------------------
  // PRIVACY & SECURITY HANDLERS
  // ----------------------------------------------------
  const handleToggle2FA = async () => {
    if (settings.security.twoFactorEnabled) {
      // Disable
      await disableTwoFactor();
      setSettings((prev) => ({
        ...prev,
        security: { ...prev.security, twoFactorEnabled: false },
      }));
      showToast('Two-Step Verification disabled');
    } else {
      // Open Setup Modal & request verification code
      setShow2FAModal(true);
      setTwoFactorCode('');
      setTwoFactorError(null);
      const res = await requestTwoFactorActivation();
      if (res.error) {
        setTwoFactorError(res.error);
      } else {
        showToast('Verification code dispatched to your account email');
      }
    }
  };

  const handleConfirmEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (twoFactorCode.trim().length < 6) {
      setTwoFactorError('Please enter the 6-digit verification code.');
      return;
    }
    const res = await enableTwoFactor(twoFactorCode);
    if (!res.success) {
      setTwoFactorError(res.error || 'Invalid or expired verification code.');
      return;
    }
    setSettings((prev) => ({
      ...prev,
      security: { ...prev.security, twoFactorEnabled: true },
    }));
    setShow2FAModal(false);
    showToast('Two-Step Verification enabled successfully');
  };

  const handleToggleLoginNotifications = async (val: boolean) => {
    const updated = await updateSecuritySettings({ loginNotifications: val });
    setSettings((prev) => ({ ...prev, security: updated }));
    showToast(val ? 'Login notifications active' : 'Login notifications disabled');
  };

  const handleRevokeSession = async (sessionId: string) => {
    const updated = await revokeSession(sessionId);
    setSessions(updated);
    showToast('Session revoked successfully');
  };

  const handleRevokeAllOthers = async () => {
    const updated = await revokeAllOtherSessions();
    setSessions(updated);
    showToast('All other sessions signed out');
  };

  const handleClearHistory = async () => {
    await clearAnalysisHistory();
    setShowClearHistoryModal(false);
    showToast('Analysis history cleared from this browser');
  };

  const handleTogglePrivacySetting = async (key: keyof PrivacySettings, val: boolean) => {
    const updated = await updatePrivacySettings({ [key]: val });
    setSettings((prev) => ({ ...prev, privacy: updated }));
    showToast('Privacy preferences updated');
  };

  const handleDownloadData = () => {
    downloadUserData();
    showToast('Your account and telemetry data is downloading');
  };

  const handleDeleteAllData = async () => {
    await deleteUserData();
    setShowDeleteDataModal(false);
    showToast('All stored preferences and data have been reset');
    setSettings(getUserSettings());
  };

  // Helper for initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'OR';
  };

  return (
    <div
      id="orca-settings-page"
      className="w-full flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-6 text-white select-text pb-28"
    >
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-slide-up">
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-950/95 border border-cyan-400/40 text-cyan-200 text-xs font-mono shadow-2xl backdrop-blur-xl">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/10 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono tracking-widest text-cyan-300 uppercase">
            <SettingsIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>ORCA OPERATOR CONFIGURATION & CONTROL</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans mt-1">
            Settings
          </h1>
          <p className="text-xs sm:text-sm text-white/60 mt-1">
            Manage your ORCA account and preferences
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 w-fit">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/60">NODE:</span>
            <span className="text-white font-semibold">STATION-01</span>
          </div>

          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white/80 hover:text-white text-xs font-mono transition-all cursor-pointer shadow"
            title="Close Settings and return to Home"
            aria-label="Close Settings and return to Home"
          >
            <X className="w-3.5 h-3.5" />
            <span>Close</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Navigation Sidebar Tabs */}
        <aside className="lg:col-span-4 xl:col-span-3 w-full">
          <div className="liquid-glass rounded-3xl p-3 border border-white/15 shadow-xl flex flex-row lg:flex-col gap-1.5 overflow-x-auto scrollbar-none sticky top-20">
            {/* Account Tab */}
            <button
              onClick={() => setActiveTab('account')}
              className={`flex-1 lg:flex-none flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer text-left whitespace-nowrap border ${
                activeTab === 'account'
                  ? 'bg-white text-black font-semibold border-white shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/5 border-transparent'
              }`}
            >
              <User
                className={`w-4 h-4 shrink-0 ${
                  activeTab === 'account' ? 'text-black' : 'text-white/60'
                }`}
              />
              <div className="flex flex-col">
                <span>Account</span>
                <span
                  className={`text-[10px] font-mono hidden sm:inline ${
                    activeTab === 'account' ? 'text-black/60' : 'text-white/40'
                  }`}
                >
                  Profile & Role
                </span>
              </div>
            </button>

            {/* Notifications Tab */}
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex-1 lg:flex-none flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer text-left whitespace-nowrap border ${
                activeTab === 'notifications'
                  ? 'bg-white text-black font-semibold border-white shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/5 border-transparent'
              }`}
            >
              <Bell
                className={`w-4 h-4 shrink-0 ${
                  activeTab === 'notifications' ? 'text-black' : 'text-white/60'
                }`}
              />
              <div className="flex flex-col">
                <span>Notifications</span>
                <span
                  className={`text-[10px] font-mono hidden sm:inline ${
                    activeTab === 'notifications' ? 'text-black/60' : 'text-white/40'
                  }`}
                >
                  Marine Alerts & Channels
                </span>
              </div>
            </button>

            {/* Language Tab */}
            <button
              onClick={() => setActiveTab('language')}
              className={`flex-1 lg:flex-none flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer text-left whitespace-nowrap border ${
                activeTab === 'language'
                  ? 'bg-white text-black font-semibold border-white shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/5 border-transparent'
              }`}
            >
              <Languages
                className={`w-4 h-4 shrink-0 ${
                  activeTab === 'language' ? 'text-black' : 'text-white/60'
                }`}
              />
              <div className="flex flex-col">
                <span>Language</span>
                <span
                  className={`text-[10px] font-mono hidden sm:inline ${
                    activeTab === 'language' ? 'text-black/60' : 'text-white/40'
                  }`}
                >
                  {settings.language.selected}
                </span>
              </div>
            </button>

            {/* Privacy & Security Tab */}
            <button
              onClick={() => setActiveTab('privacy')}
              className={`flex-1 lg:flex-none flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer text-left whitespace-nowrap border ${
                activeTab === 'privacy'
                  ? 'bg-white text-black font-semibold border-white shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/5 border-transparent'
              }`}
            >
              <ShieldCheck
                className={`w-4 h-4 shrink-0 ${
                  activeTab === 'privacy' ? 'text-black' : 'text-white/60'
                }`}
              />
              <div className="flex flex-col">
                <span>Privacy & Security</span>
                <span
                  className={`text-[10px] font-mono hidden sm:inline ${
                    activeTab === 'privacy' ? 'text-black/60' : 'text-white/40'
                  }`}
                >
                  2FA, Sessions & Data
                </span>
              </div>
            </button>

            {/* Quick Station Info Card (Desktop Only) */}
            <div className="hidden lg:block mt-6 p-4 rounded-2xl bg-black/40 border border-white/10 text-xs font-mono">
              <div className="text-white/40 text-[10px] uppercase mb-1">STATION TELEMETRY</div>
              <div className="text-white font-bold flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>ORCA COASTAL NODE</span>
              </div>
              <div className="text-white/50 text-[11px] mt-1">
                Zero-Trust TLS 1.3 Active
              </div>
            </div>
          </div>
        </aside>

        {/* Right Content Area */}
        <main className="lg:col-span-8 xl:col-span-9 w-full space-y-6">
          {/* ========================================================= */}
          {/* TAB 1: ACCOUNT */}
          {/* ========================================================= */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              {/* Profile Card Header */}
              <div className="liquid-glass rounded-3xl p-6 border border-white/15 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  {/* Profile Avatar */}
                  <div className="relative">
                    <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-xl sm:text-2xl font-bold font-mono text-black shadow-xl border-2 border-white/30">
                      {getInitials(accountForm.name)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-slate-950 flex items-center justify-center shadow">
                      <span className="w-1.5 h-1.5 rounded-full bg-black" />
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-bold text-white font-sans truncate">
                        {settings.account.name}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[11px] font-mono font-semibold">
                        {settings.account.role}
                      </span>
                    </div>

                    <div className="text-xs sm:text-sm text-white/70 font-mono mt-1 truncate">
                      {settings.account.email}
                    </div>

                    <div className="text-xs text-white/50 mt-1 flex items-center gap-2">
                      <span>{settings.account.organization}</span>
                      <span>•</span>
                      <span className="text-emerald-400">Authenticated Operator</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Profile Form */}
              <div className="liquid-glass rounded-3xl p-6 border border-white/15 shadow-2xl">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                  <User className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
                    Edit Profile Details
                  </h3>
                </div>

                <form onSubmit={handleSaveAccount} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                      <label className="block text-white/60 mb-1.5 font-medium font-mono text-[11px]">
                        OPERATOR NAME
                      </label>
                      <input
                        type="text"
                        value={accountForm.name}
                        onChange={(e) =>
                          setAccountForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                        required
                        className="w-full p-3 rounded-xl bg-black/60 border border-white/20 text-white text-xs focus:outline-none focus:border-cyan-400 transition-colors"
                        placeholder="e.g. Rahul Sharma"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-white/60 mb-1.5 font-medium font-mono text-[11px]">
                        EMAIL ADDRESS
                      </label>
                      <input
                        type="email"
                        value={accountForm.email}
                        disabled
                        className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white/60 text-xs cursor-not-allowed"
                        placeholder="e.g. rahul@example.com"
                      />
                      <span className="text-[10px] text-white/40 mt-1 block">
                        Primary telemetry credentials identifier (Read-only)
                      </span>
                    </div>

                    {/* Organization */}
                    <div>
                      <label className="block text-white/60 mb-1.5 font-medium font-mono text-[11px]">
                        ORGANIZATION / DEPARTMENT
                      </label>
                      <input
                        type="text"
                        value={accountForm.organization}
                        onChange={(e) =>
                          setAccountForm((prev) => ({ ...prev, organization: e.target.value }))
                        }
                        required
                        className="w-full p-3 rounded-xl bg-black/60 border border-white/20 text-white text-xs focus:outline-none focus:border-cyan-400 transition-colors"
                        placeholder="e.g. Marine Research Department"
                      />
                    </div>

                    {/* User Role */}
                    <div>
                      <label className="block text-white/60 mb-1.5 font-medium font-mono text-[11px]">
                        USER ROLE
                      </label>
                      <select
                        value={accountForm.role}
                        onChange={(e) =>
                          setAccountForm((prev) => ({ ...prev, role: e.target.value }))
                        }
                        className="w-full p-3 rounded-xl bg-slate-950 border border-white/20 text-white text-xs focus:outline-none focus:border-cyan-400 transition-colors cursor-pointer"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r} className="bg-slate-900 text-white">
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Save Changes Button */}
                  <div className="pt-2 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={isSavingAccount}
                      className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs cursor-pointer transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSavingAccount ? (
                        <span>Saving Changes...</span>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Security Actions Card (Password & Logout) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Change Password Card */}
                <div className="liquid-glass rounded-3xl p-5 border border-white/15 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <KeyRound className="w-4 h-4 text-cyan-400" />
                      <h4 className="text-sm font-semibold text-white">Password & Keys</h4>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">
                      Update your operator password regularly to safeguard marine data access.
                    </p>
                  </div>
                  <div className="pt-4">
                    <button
                      onClick={() => {
                        setPasswordError(null);
                        setShowPasswordModal(true);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Change Password</span>
                    </button>
                  </div>
                </div>

                {/* Logout Card */}
                <div className="liquid-glass rounded-3xl p-5 border border-white/15 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <LogOut className="w-4 h-4 text-rose-400" />
                      <h4 className="text-sm font-semibold text-white">Station Sign Out</h4>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">
                      Safely terminate your active ocean telemetry session on this device.
                    </p>
                  </div>
                  <div className="pt-4">
                    <button
                      onClick={() => setShowLogoutModal(true)}
                      className="w-full py-2.5 px-4 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: NOTIFICATIONS */}
          {/* ========================================================= */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              {/* Master Notification Toggle Card */}
              <div className="liquid-glass rounded-3xl p-6 border border-white/15 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all ${
                      settings.notifications.enabled
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400/40 shadow-inner'
                        : 'bg-white/5 text-white/40 border-white/10'
                    }`}
                  >
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-sans">
                      Enable Notifications
                    </h3>
                    <p className="text-xs text-white/60">
                      Master toggle for real-time marine safety broadcasts and hazard telemetry.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                  <input
                    type="checkbox"
                    checked={settings.notifications.enabled}
                    onChange={(e) => handleToggleMasterNotification(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-13 h-7 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[3px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-cyan-500 border border-white/20"></div>
                </label>
              </div>

              {/* Individual Categories Section */}
              <div
                className={`transition-opacity duration-300 ${
                  !settings.notifications.enabled
                    ? 'opacity-40 pointer-events-none select-none'
                    : 'opacity-100'
                }`}
              >
                <div className="liquid-glass rounded-3xl p-6 border border-white/15 shadow-2xl space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                    <ShieldAlert className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
                      Marine Hazard Categories
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {/* 1. Cyclone Alerts */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">Cyclone Alerts</div>
                          <div className="text-[11px] text-white/50">
                            Receive alerts when cyclone activity is detected.
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications.cyclone}
                        onChange={(e) => handleToggleCategory('cyclone', e.target.checked)}
                        className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                      />
                    </div>

                    {/* 2. High Wave Alerts */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                          <Waves className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">High Wave Alerts</div>
                          <div className="text-[11px] text-white/50">
                            Receive alerts when dangerous wave conditions are detected.
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications.highWave}
                        onChange={(e) => handleToggleCategory('highWave', e.target.checked)}
                        className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                      />
                    </div>

                    {/* 3. Strong Wind Alerts */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                          <Wind className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">Strong Wind Alerts</div>
                          <div className="text-[11px] text-white/50">
                            Receive alerts for high wind-speed conditions.
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications.strongWind}
                        onChange={(e) => handleToggleCategory('strongWind', e.target.checked)}
                        className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                      />
                    </div>

                    {/* 4. Heavy Rain Alerts */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
                          <CloudRain className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">Heavy Rain Alerts</div>
                          <div className="text-[11px] text-white/50">
                            Receive heavy rainfall and storm alerts.
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications.heavyRain}
                        onChange={(e) => handleToggleCategory('heavyRain', e.target.checked)}
                        className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                      />
                    </div>

                    {/* 5. Marine Risk Alerts */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">Marine Risk Alerts</div>
                          <div className="text-[11px] text-white/50">
                            Receive overall marine safety and risk alerts.
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications.marineRisk}
                        onChange={(e) => handleToggleCategory('marineRisk', e.target.checked)}
                        className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                      />
                    </div>

                    {/* 6. PFZ Alerts */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                          <Fish className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">PFZ Alerts</div>
                          <div className="text-[11px] text-white/50">
                            Receive Potential Fishing Zone updates.
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications.pfz}
                        onChange={(e) => handleToggleCategory('pfz', e.target.checked)}
                        className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                      />
                    </div>

                    {/* 7. Environmental Anomaly Alerts */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
                          <Activity className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">
                            Environmental Anomaly Alerts
                          </div>
                          <div className="text-[11px] text-white/50">
                            Receive unusual ocean/environmental condition alerts.
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications.environmentalAnomaly}
                        onChange={(e) =>
                          handleToggleCategory('environmentalAnomaly', e.target.checked)
                        }
                        className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Channels & Severity Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* Notification Channels */}
                  <div className="liquid-glass rounded-3xl p-6 border border-white/15 shadow-2xl space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                      <Radio className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
                        Dispatch Channels
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {/* Email Channel */}
                      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <Mail className="w-4 h-4 text-cyan-400" />
                            <span className="text-xs font-semibold text-white">
                              Email Notifications
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.notifications.email}
                            onChange={(e) => handleToggleCategory('email', e.target.checked)}
                            className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                          />
                        </div>
                        <p className="text-[11px] text-white/50">
                          Receive important ORCA alerts by email ({settings.account.email}).
                        </p>
                      </div>

                      {/* SMS Channel */}
                      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <Smartphone className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-semibold text-white">
                              SMS Notifications
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.notifications.sms}
                            onChange={(e) => handleToggleCategory('sms', e.target.checked)}
                            className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                          />
                        </div>
                        <p className="text-[11px] text-white/50">
                          Receive critical marine safety alerts through SMS.
                        </p>
                        {settings.notifications.sms && (
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="tel"
                              value={phoneInput}
                              onChange={(e) => setPhoneInput(e.target.value)}
                              onBlur={() => {
                                updateNotificationPreferences({ phone: phoneInput });
                                showToast('SMS dispatch number updated');
                              }}
                              placeholder="+91 98765 43210"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/20 text-white font-mono text-[11px] focus:outline-none focus:border-cyan-400"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Alert Severity Setting */}
                  <div className="liquid-glass rounded-3xl p-6 border border-white/15 shadow-2xl space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
                        Alert Severity Filter
                      </h3>
                    </div>

                    <p className="text-xs text-white/60">
                      Select which severity levels should trigger active notifications:
                    </p>

                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Low */}
                      <button
                        type="button"
                        onClick={() => handleToggleSeverity('low')}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          settings.notifications.severity.includes('low')
                            ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-300'
                            : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70'
                        }`}
                      >
                        <span className="text-xs font-bold font-mono">Low</span>
                        <span className="text-[10px] opacity-70 mt-1">Minor marine drift</span>
                      </button>

                      {/* Moderate */}
                      <button
                        type="button"
                        onClick={() => handleToggleSeverity('moderate')}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          settings.notifications.severity.includes('moderate')
                            ? 'bg-amber-500/15 border-amber-400/50 text-amber-300'
                            : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70'
                        }`}
                      >
                        <span className="text-xs font-bold font-mono">Moderate</span>
                        <span className="text-[10px] opacity-70 mt-1">Cautionary advisory</span>
                      </button>

                      {/* High */}
                      <button
                        type="button"
                        onClick={() => handleToggleSeverity('high')}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          settings.notifications.severity.includes('high')
                            ? 'bg-orange-500/15 border-orange-400/50 text-orange-300'
                            : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70'
                        }`}
                      >
                        <span className="text-xs font-bold font-mono">High</span>
                        <span className="text-[10px] opacity-70 mt-1">Dangerous condition</span>
                      </button>

                      {/* Critical - ALWAYS VISUALLY EMPHASIZED */}
                      <button
                        type="button"
                        onClick={() => handleToggleSeverity('critical')}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                          settings.notifications.severity.includes('critical')
                            ? 'bg-rose-500/25 border-rose-500 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.3)] ring-1 ring-rose-500'
                            : 'bg-rose-950/20 border-rose-900/40 text-rose-400/50'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold font-mono flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                            Critical
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/40 text-white font-bold">
                            PRIORITY
                          </span>
                        </div>
                        <span className="text-[10px] opacity-80 mt-1">
                          Severe cyclone & surge
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: LANGUAGE */}
          {/* ========================================================= */}
          {activeTab === 'language' && (
            <div className="space-y-6">
              <div className="liquid-glass rounded-3xl p-6 border border-white/15 shadow-2xl">
                <div className="flex items-center gap-2 mb-2 pb-3 border-b border-white/10">
                  <Languages className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
                    Supported Languages
                  </h3>
                </div>

                <p className="text-xs text-white/60 mb-5 leading-relaxed">
                  Choose your interface and telemetry reporting language. ORCA multi-agent
                  summaries will format localized hazard advisories according to your dialect.
                </p>

                {/* Primary Languages Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {/* English */}
                  <button
                    onClick={() => handleSelectLanguage('English')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[95px] ${
                      settings.language.selected === 'English'
                        ? 'bg-white text-black font-semibold border-white shadow-xl'
                        : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-bold">English</span>
                      {settings.language.selected === 'English' && (
                        <Check className="w-4 h-4 text-black" />
                      )}
                    </div>
                    <span
                      className={`text-[11px] ${
                        settings.language.selected === 'English' ? 'text-black/70' : 'text-white/40'
                      }`}
                    >
                      Default Marine Standard
                    </span>
                  </button>

                  {/* Hindi */}
                  <button
                    onClick={() => handleSelectLanguage('हिन्दी')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[95px] ${
                      settings.language.selected === 'हिन्दी'
                        ? 'bg-white text-black font-semibold border-white shadow-xl'
                        : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-bold">हिन्दी</span>
                      {settings.language.selected === 'हिन्दी' && (
                        <Check className="w-4 h-4 text-black" />
                      )}
                    </div>
                    <span
                      className={`text-[11px] ${
                        settings.language.selected === 'हिन्दी' ? 'text-black/70' : 'text-white/40'
                      }`}
                    >
                      Hindi Coastal Telemetry
                    </span>
                  </button>

                  {/* Marathi */}
                  <button
                    onClick={() => handleSelectLanguage('मराठी')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[95px] ${
                      settings.language.selected === 'मराठी'
                        ? 'bg-white text-black font-semibold border-white shadow-xl'
                        : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-bold">मराठी</span>
                      {settings.language.selected === 'मराठी' && (
                        <Check className="w-4 h-4 text-black" />
                      )}
                    </div>
                    <span
                      className={`text-[11px] ${
                        settings.language.selected === 'मराठी' ? 'text-black/70' : 'text-white/40'
                      }`}
                    >
                      Maharashtra Maritime
                    </span>
                  </button>

                  {/* Other Indian languages */}
                  <button
                    onClick={() => {
                      const defaultOther =
                        settings.language.otherLanguage || OTHER_INDIAN_LANGUAGES[0].code;
                      handleSelectLanguage('Other Indian Languages', defaultOther);
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[95px] ${
                      settings.language.selected === 'Other Indian Languages'
                        ? 'bg-cyan-500 text-black font-semibold border-cyan-400 shadow-xl'
                        : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-bold">Other Indian Languages</span>
                      {settings.language.selected === 'Other Indian Languages' && (
                        <Check className="w-4 h-4 text-black" />
                      )}
                    </div>
                    <span
                      className={`text-[11px] ${
                        settings.language.selected === 'Other Indian Languages'
                          ? 'text-black/80 font-mono font-medium'
                          : 'text-white/40'
                      }`}
                    >
                      Regional Coastal Dialects
                    </span>
                  </button>
                </div>

                {/* Sub-dropdown when "Other Indian languages" is selected */}
                {settings.language.selected === 'Other Indian Languages' && (
                  <div className="p-4 rounded-2xl bg-black/60 border border-cyan-400/40 space-y-3 animate-fade-slide-up">
                    <label className="block text-xs font-mono text-cyan-300 font-semibold">
                      SELECT REGIONAL COASTAL LANGUAGE:
                    </label>
                    <select
                      value={settings.language.otherLanguage || OTHER_INDIAN_LANGUAGES[0].code}
                      onChange={(e) =>
                        handleSelectLanguage('Other Indian Languages', e.target.value)
                      }
                      className="w-full p-3 rounded-xl bg-slate-900 border border-white/20 text-white font-sans text-xs focus:outline-none focus:border-cyan-400 cursor-pointer"
                    >
                      {OTHER_INDIAN_LANGUAGES.map((item) => (
                        <option key={item.code} value={item.code} className="bg-slate-900 text-white">
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Prototype Architecture Notice */}
                <div className="mt-6 p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-start gap-3 text-xs text-white/60 leading-relaxed">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white block mb-0.5">
                      Multilingual Translation Architecture
                    </span>
                    Language preference is saved locally to your operator profile. Live
                    AI-grounded translation across all Indian regional coastal dialects will route
                    through this preference once the real-time multilingual pipeline is connected.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: PRIVACY & SECURITY */}
          {/* ========================================================= */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              {/* 1. Change Password & 2FA Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Change Password (Reused Modal) */}
                <div className="liquid-glass rounded-3xl p-6 border border-white/15 shadow-2xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <KeyRound className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-sm font-semibold text-white">Change Password</h3>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">
                      Update your account security passphrase. Reuses the centralized cryptographic
                      credential modal.
                    </p>
                  </div>
                  <div className="pt-4">
                    <button
                      onClick={() => {
                        setPasswordError(null);
                        setShowPasswordModal(true);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Change Password</span>
                    </button>
                  </div>
                </div>

                {/* Two-Step Verification */}
                <div className="liquid-glass rounded-3xl p-6 border border-white/15 shadow-2xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-cyan-400" />
                        <h3 className="text-sm font-semibold text-white">
                          Two-Step Verification
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggle2FA}
                        className={`px-3 py-1 rounded-full text-xs font-mono font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                          settings.security.twoFactorEnabled
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                            : 'bg-white/5 text-white/50 border-white/15 hover:text-white/80'
                        }`}
                        title="Toggle Two-Step Verification"
                      >
                        <span className={`w-2 h-2 rounded-full ${settings.security.twoFactorEnabled ? 'bg-emerald-400' : 'bg-white/30'}`} />
                        <span>{settings.security.twoFactorEnabled ? 'ON' : 'OFF'}</span>
                      </button>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed mt-1">
                      {settings.security.twoFactorEnabled
                        ? 'Two-step verification adds an additional layer of security to your account.'
                        : 'Your account currently uses password/Google authentication without email OTP verification.'}
                    </p>
                  </div>
                  <div className="pt-4">
                    <button
                      onClick={handleToggle2FA}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer border ${
                        settings.security.twoFactorEnabled
                          ? 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/30 text-rose-300'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-black border-cyan-400 font-bold'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>{settings.security.twoFactorEnabled ? 'Disable Two-Step Verification' : 'Enable Two-Step Verification'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Login Notifications Toggle */}
              <div className="liquid-glass rounded-3xl p-6 border border-white/15 shadow-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Login Notifications</h3>
                    <p className="text-xs text-white/60 mt-0.5">
                      Get notified when your ORCA account is accessed from a new device.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                  <input
                    type="checkbox"
                    checked={settings.security.loginNotifications}
                    onChange={(e) => handleToggleLoginNotifications(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500 border border-white/20"></div>
                </label>
              </div>

              {/* 3. Active Sessions */}
              <div className="liquid-glass rounded-3xl p-6 border border-white/15 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <MonitorSmartphone className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
                      Active Sessions
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-white/50">
                    {sessions.length} DEPLOYED TERMINALS
                  </span>
                </div>

                <div className="space-y-3">
                  {sessions.map((sess) => (
                    <div
                      key={sess.id}
                      className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white/80 shrink-0">
                          {sess.device.includes('Phone') ? (
                            <Smartphone className="w-4 h-4" />
                          ) : sess.device.includes('iPad') ? (
                            <Tablet className="w-4 h-4" />
                          ) : (
                            <Laptop className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white">{sess.device}</span>
                            {sess.isCurrent && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                                Current Device
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-white/50 font-mono mt-0.5">
                            {sess.browser} • {sess.lastActive}
                            {sess.location && ` • ${sess.location}`}
                          </div>
                        </div>
                      </div>

                      {!sess.isCurrent && (
                        <button
                          onClick={() => handleRevokeSession(sess.id)}
                          className="self-end sm:self-center px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-[11px] font-mono font-semibold transition cursor-pointer"
                        >
                          Revoke Session
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {sessions.some((s) => !s.isCurrent) && (
                  <div className="pt-2">
                    <button
                      onClick={handleRevokeAllOthers}
                      className="text-xs text-rose-400 hover:text-rose-300 font-mono underline cursor-pointer"
                    >
                      Sign out of all other sessions →
                    </button>
                  </div>
                )}
              </div>

              {/* 4. Analysis History */}
              <div className="liquid-glass rounded-3xl p-6 border border-white/15 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
                      Analysis History
                    </h3>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div>
                    <div className="text-xs font-semibold text-white">Store Analysis History</div>
                    <div className="text-[11px] text-white/50">
                      Retain map location analyses, AI agent reports, and marine risk queries.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.privacy.storeAnalysisHistory}
                    onChange={(e) =>
                      handleTogglePrivacySetting('storeAnalysisHistory', e.target.checked)
                    }
                    className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-white/50">
                    Purge saved location pins and prior ocean assessments from local memory.
                  </span>
                  <button
                    onClick={() => setShowClearHistoryModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Clear Analysis History</span>
                  </button>
                </div>
              </div>

              {/* 5. Data Privacy & Export */}
              <div className="liquid-glass rounded-3xl p-6 border border-white/15 shadow-2xl space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
                    Data Privacy & Governance
                  </h3>
                </div>

                {/* Data Collection explanation */}
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-white/60 leading-relaxed">
                  <span className="font-semibold text-white block mb-0.5">Data Collection</span>
                  ORCA uses interaction telemetry and anonymized operational queries to calibrate
                  oceanic risk models and marine consensus agents. You can selectively disable data
                  streams below.
                </div>

                {/* Privacy toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                    <span className="text-white">Usage Analytics</span>
                    <input
                      type="checkbox"
                      checked={settings.privacy.usageAnalytics}
                      onChange={(e) =>
                        handleTogglePrivacySetting('usageAnalytics', e.target.checked)
                      }
                      className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                    <span className="text-white">Personalized Recommendations</span>
                    <input
                      type="checkbox"
                      checked={settings.privacy.personalizedRecommendations}
                      onChange={(e) =>
                        handleTogglePrivacySetting('personalizedRecommendations', e.target.checked)
                      }
                      className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                    <span className="text-white">AI Analysis History</span>
                    <input
                      type="checkbox"
                      checked={settings.privacy.aiAnalysisHistory}
                      onChange={(e) =>
                        handleTogglePrivacySetting('aiAnalysisHistory', e.target.checked)
                      }
                      className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                    <span className="text-white">Location Analysis History</span>
                    <input
                      type="checkbox"
                      checked={settings.privacy.locationAnalysisHistory}
                      onChange={(e) =>
                        handleTogglePrivacySetting('locationAnalysisHistory', e.target.checked)
                      }
                      className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                    />
                  </label>
                </div>

                {/* Export / Delete Action Row */}
                <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    onClick={handleDownloadData}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download My Data</span>
                  </button>

                  <button
                    onClick={() => setShowDeleteDataModal(true)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete My Data</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: CHANGE PASSWORD MODAL */}
      {/* ========================================================= */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-950 border border-white/20 rounded-3xl p-6 shadow-2xl space-y-4 animate-fade-slide-up">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white font-sans">Change Password</h3>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-1 rounded-lg text-white/50 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 font-sans">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-sans">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Password updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-3.5 text-xs">
              {/* Current Password */}
              <div>
                <label className="block text-white/60 mb-1 font-mono text-[11px]">
                  CURRENT PASSWORD
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter current password"
                    className="w-full p-2.5 pr-9 rounded-xl bg-slate-900 border border-white/20 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass((p) => !p)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-white/60 mb-1 font-mono text-[11px]">
                  NEW PASSWORD
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Minimum 8 characters"
                    className="w-full p-2.5 pr-9 rounded-xl bg-slate-900 border border-white/20 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass((p) => !p)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-white/50">Strength:</span>
                      <span className="font-bold text-white">
                        {getPasswordStrength(newPassword).label}
                      </span>
                    </div>
                    <div className="w-full grid grid-cols-4 gap-1 h-1.5">
                      {[1, 2, 3, 4].map((step) => {
                        const strength = getPasswordStrength(newPassword);
                        const isFilled = strength.score >= step;
                        return (
                          <div
                            key={step}
                            className={`rounded-full transition-all duration-300 ${
                              isFilled ? strength.color : 'bg-white/10'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-white/60 mb-1 font-mono text-[11px]">
                  CONFIRM NEW PASSWORD
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-enter new password"
                    className="w-full p-2.5 pr-9 rounded-xl bg-slate-900 border border-white/20 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass((p) => !p)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
                  >
                    {showConfirmPass ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl text-white/60 hover:text-white text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs cursor-pointer shadow transition disabled:opacity-50"
                >
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: LOGOUT CONFIRMATION DIALOG */}
      {/* ========================================================= */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-slate-950 border border-white/20 rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-fade-slide-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
              <LogOut className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white font-sans">
                Are you sure you want to log out?
              </h3>
              <p className="text-xs text-white/60 mt-1 leading-relaxed">
                Your active ocean telemetry session will be terminated and you will need to sign in
                again to access the console.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/10 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-lg transition cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: TWO-FACTOR AUTHENTICATION SETUP MODAL */}
      {/* ========================================================= */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-950 border border-white/20 rounded-3xl p-6 shadow-2xl space-y-4 animate-fade-slide-up">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white font-sans">Activate Two-Step Verification</h3>
              </div>
              <button
                onClick={() => setShow2FAModal(false)}
                className="p-1 rounded-lg text-white/50 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              Two-step verification adds an additional layer of security to your account. To verify that you have access to this account before activating it, we sent a 6-digit verification code to your email.
            </p>

            <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-300 flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono">
                <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Account: {settings.account.email}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowMailboxModal(true)}
                className="text-[11px] underline text-cyan-400 hover:text-cyan-200 cursor-pointer font-sans"
              >
                Inspect Mailbox
              </button>
            </div>

            {/* Verification Code Input */}
            <form onSubmit={handleConfirmEnable2FA} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-mono text-white/60 mb-1">
                  6-DIGIT EMAIL VERIFICATION CODE
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => {
                    setTwoFactorCode(e.target.value.replace(/\D/g, ''));
                    setTwoFactorError(null);
                  }}
                  placeholder="000000"
                  className="w-full text-center tracking-[0.4em] text-lg font-mono p-2.5 rounded-xl bg-black border border-white/20 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              {twoFactorError && (
                <div className="text-[11px] text-rose-400 font-sans p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30">
                  {twoFactorError}
                </div>
              )}

              <div className="flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={async () => {
                    setTwoFactorError(null);
                    await requestTwoFactorActivation();
                    showToast('New verification code dispatched to email');
                  }}
                  className="text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
                >
                  Resend verification code
                </button>
                <span className="text-white/40 font-mono text-[10px]">Code valid for 10 min</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShow2FAModal(false)}
                  className="py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/10 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-lg transition cursor-pointer"
                >
                  Confirm & Activate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispatched Emails Inspect Modal */}
      <DispatchedEmailsModal
        isOpen={showMailboxModal}
        onClose={() => setShowMailboxModal(false)}
      />

      {/* ========================================================= */}
      {/* MODAL 4: CLEAR ANALYSIS HISTORY CONFIRMATION */}
      {/* ========================================================= */}
      {showClearHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-slate-950 border border-white/20 rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-fade-slide-up">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <History className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white font-sans">
                Are you sure you want to delete your analysis history?
              </h3>
              <p className="text-xs text-white/60 mt-1 leading-relaxed">
                This will purge all cached ocean coordinates, AI agent evaluations, and search
                telemetry stored in this browser.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowClearHistoryModal(false)}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/10 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleClearHistory}
                className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-lg transition cursor-pointer"
              >
                Delete History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: DELETE MY DATA STRONG CONFIRMATION */}
      {/* ========================================================= */}
      {showDeleteDataModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-slate-950 border border-rose-500/40 rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-fade-slide-up ring-1 ring-rose-500/30">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white font-sans">
                Delete all account data?
              </h3>
              <div className="inline-block px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-mono font-bold mt-1.5">
                This action cannot be undone.
              </div>
              <p className="text-xs text-white/60 mt-2 leading-relaxed">
                All saved telemetry preferences, active sessions, notification filters, and
                personalized agent models will be permanently wiped.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowDeleteDataModal(false)}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/10 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllData}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg transition cursor-pointer"
              >
                Delete My Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
