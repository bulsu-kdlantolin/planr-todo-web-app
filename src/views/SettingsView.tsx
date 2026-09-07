import React, { useState } from 'react';
import { useMetaStore } from '../store/useMetaStore';
import { useTaskStore } from '../store/useTaskStore';
import { useReminderStore } from '../store/useReminderStore';
import { useTimerStore } from '../store/useTimerStore';
import { useUIStore } from '../store/useUIStore';
import { useAuth } from '../context/AuthContext';
import { Select } from '../components/common/Select';
import { ToggleSwitch } from '../components/common/ToggleSwitch';
import { ProfileModal } from '../components/modals/ProfileModal';
import { exportWorkspaceAsJSON, exportTasksAsMarkdown, exportTasksAsCSV, restoreWorkspaceFromJSON } from '../utils/exportEngines';
import { TimeFormat } from '../types';
import {
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Bell,
  Clock,
  Download,
  Upload,
  User,
  ShieldCheck,
  FileText,
  FileSpreadsheet,
  Command,
  LogOut,
  LogIn,
  CheckCircle2,
  KeyRound,
  AlertCircle,
  Loader2,
  Mail
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const user = useMetaStore((state) => state.user);
  const settings = useMetaStore((state) => state.settings);
  const updateSettings = useMetaStore((state) => state.updateSettings);

  const tasks = useTaskStore((state) => state.tasks);
  const setTasks = useTaskStore((state) => state.setTasks);
  const reminders = useReminderStore((state) => state.reminders);
  const setReminders = useReminderStore((state) => state.setReminders);
  const focusSessions = useTimerStore((state) => state.focusSessions);
  const setFocusSessions = useTimerStore((state) => state.setFocusSessions);

  const showToast = useUIStore((state) => state.showToast);
  const openShortcutsModal = useUIStore((state) => state.openShortcutsModal);
  const setActiveView = useUIStore((state) => state.setActiveView);

  const { signOut, sendPasswordResetEmail, session } = useAuth();

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  // Password verification state
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const handleSendPasswordVerification = async () => {
    if (!user.email || isSendingVerification) return;
    setIsSendingVerification(true);
    setVerificationError(null);

    const { error } = await sendPasswordResetEmail(user.email);
    setIsSendingVerification(false);

    if (error) {
      setVerificationError(error.message);
    } else {
      setVerificationSent(true);
      showToast('Verification link sent to your email 📬', 'success');
    }
  };

  const handleExportJSON = () => {
    exportWorkspaceAsJSON();
    showToast('Exported backup archive (JSON)');
  };

  const handleExportMD = () => {
    exportTasksAsMarkdown(tasks);
    showToast('Exported tasks (Markdown)');
  };

  const handleExportCSV = () => {
    exportTasksAsCSV(tasks);
    showToast('Exported tasks (CSV spreadsheet)');
  };


  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const text = await file.text();
      const backupData = JSON.parse(text);

      const success = await restoreWorkspaceFromJSON(backupData);
      if (success) {
        showToast('Backup restored successfully! 📦', 'success');
      } else {
        showToast('Failed to import database file.', 'error');
      }
    } catch (err) {
      showToast('Invalid backup file format.', 'error');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const isOAuthUser = Boolean(
    session?.user?.app_metadata?.provider === 'google' ||
    session?.user?.app_metadata?.providers?.includes('google') ||
    session?.user?.identities?.some((id: any) => id.provider === 'google') ||
    (user.email && localStorage.getItem(`planr_oauth_provider_${user.email.toLowerCase()}`) === 'google')
  );

  const hasPassword = Boolean(
    session?.user?.user_metadata?.has_password ||
    (session?.user?.id && localStorage.getItem(`planr_has_password_${session.user.id}`) === 'true') ||
    (user.email && localStorage.getItem(`planr_has_password_${user.email.toLowerCase()}`) === 'true')
  );

  return (
    <div className="max-w-[1500px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-8">
      {/* Header */}
      <div className="pb-5 border-b border-outline-subtle">
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-on-surface">Settings</h1>
        <p className="text-sm text-secondary">
          Manage your display preferences, account security, data backups, and sync settings.
        </p>
      </div>

      {/* User Profile & Auth Card */}
      <div className="bg-surface-lowest border border-outline-variant rounded-xl p-6 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-primary-container font-serif text-xl font-bold overflow-hidden border-2 border-outline-variant shadow-xs flex-shrink-0">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name || 'User'} className="w-full h-full object-cover" />
            ) : (
              <span>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-lg font-semibold text-on-surface">{user.name || 'User'}</h3>
              {user.isLoggedIn && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <CheckCircle2 className="w-3 h-3" /> Signed In
                </span>
              )}
            </div>
            <p className="text-xs text-secondary">{user.title || 'Productivity User'} • {user.email}</p>
            {user.tagline && (
              <p className="text-xs text-secondary/80 italic mt-0.5 font-serif">"{user.tagline}"</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setProfileModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-surface-low hover:bg-surface-container border border-outline-variant text-xs font-semibold uppercase tracking-wider text-on-surface transition-colors cursor-pointer"
          >
            <User className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Edit Profile</span>
          </button>

          {user.isLoggedIn ? (
            <button
              type="button"
              onClick={async () => {
                await signOut();
                showToast('Signed out of Planr', 'info');
                setActiveView('landing');
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-surface-low hover:bg-surface-container text-red-600 dark:text-red-400 border border-outline-variant text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveView('signin')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary-container text-on-primary-container hover:bg-primary text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Security & Password Card (For logged in users) */}
      {user.isLoggedIn && (
        <div className="bg-surface-lowest border border-outline-variant rounded-xl p-6 shadow-card space-y-5">
          <div className="flex items-center gap-2 border-b border-outline-subtle pb-3">
            <KeyRound className="w-5 h-5 text-primary" aria-hidden="true" />
            <h2 className="font-serif text-xl font-semibold text-on-surface">Security & Password</h2>
          </div>

          {isOAuthUser && (
            <div className="p-4 rounded-lg bg-surface-low border border-outline-subtle text-xs text-secondary flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-on-surface">Google Account Linked</p>
                <p className="text-secondary/80 mt-0.5">
                  You are signed in with Google. You can {hasPassword ? 'change your password' : 'add a password'} below to enable signing in with both Google and your email & password.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4 max-w-xl">
            <p className="text-xs text-secondary">
              To protect your account security, changing or setting your password requires email verification. We will send a secure verification link to your registered email address (<span className="font-semibold text-on-surface">{user.email}</span>).
            </p>

            {verificationError && (
              <div
                role="alert"
                className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-xs text-red-800 dark:text-red-300"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600 dark:text-red-400" />
                <span>{verificationError}</span>
              </div>
            )}

            {verificationSent ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2.5 animate-fade-in">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Verification Link Sent</span>
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  We sent a secure password reset link to <strong>{user.email}</strong>. Please check your inbox and click the link to securely set your password.
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleSendPasswordVerification}
                    disabled={isSendingVerification}
                    className="text-xs font-semibold text-emerald-800 dark:text-emerald-200 underline hover:opacity-80 disabled:opacity-50 cursor-pointer"
                  >
                    Resend verification link
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={handleSendPasswordVerification}
                  disabled={isSendingVerification || !user.email}
                  className="px-5 py-2.5 bg-primary-container text-on-primary-container hover:bg-primary rounded-md text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  {isSendingVerification ? (
                    <>
                      <span>Sending verification link...</span>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    </>
                  ) : (
                    <>
                      <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{hasPassword ? 'Send Password Change Link' : 'Send Password Setup Link'}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Appearance & Time Format */}
      <div className="bg-surface-lowest border border-outline-variant rounded-xl p-6 shadow-card space-y-6">
        <h2 className="font-serif text-xl font-semibold text-on-surface border-b border-outline-subtle pb-3">
          Display & Time Format
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Theme Switcher */}
          <div className="flex items-center justify-between p-3.5 bg-surface-low rounded-lg border border-outline-subtle">
            <div className="flex items-center gap-3">
              {settings.theme === 'dark' ? (
                <Moon className="w-5 h-5 text-tertiary" aria-hidden="true" />
              ) : (
                <Sun className="w-5 h-5 text-amber-600" aria-hidden="true" />
              )}
              <div>
                <p className="text-xs font-semibold text-on-surface">Dark Mode</p>
                <p className="text-[11px] text-secondary">
                  {settings.theme === 'dark' ? 'Warm charcoal palette active' : 'Natural bone-white palette active'}
                </p>
              </div>
            </div>

            <ToggleSwitch
              checked={settings.theme === 'dark'}
              onChange={(isDark) => updateSettings({ theme: isDark ? 'dark' : 'light' })}
              ariaLabel="Toggle dark mode"
            />
          </div>

          {/* Time Format Switcher (12h vs 24h) */}
          <div className="flex items-center justify-between p-3.5 bg-surface-low rounded-lg border border-outline-subtle">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-tertiary" aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold text-on-surface">Time Format</p>
                <p className="text-[11px] text-secondary">
                  {settings.timeFormat === '24h' ? '24-hour military format' : '12-hour AM/PM format'}
                </p>
              </div>
            </div>

            <div className="w-28">
              <Select<TimeFormat>
                value={settings.timeFormat || '12h'}
                onChange={(val) => updateSettings({ timeFormat: val })}
                options={[
                  { value: '12h', label: '12h (AM/PM)' },
                  { value: '24h', label: '24h (Military)' }
                ]}
                ariaLabel="Select time format"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Customization Section */}
      <div className="bg-surface-lowest border border-outline-variant rounded-xl p-6 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-surface-low flex items-center justify-center text-primary-container">
            <Command className="w-5 h-5 text-tertiary" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-semibold text-on-surface">Keyboard Shortcuts</h3>
            <p className="text-xs text-secondary">
              Customize and remap quick keys for navigation, task creation, and timer controls.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openShortcutsModal}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-surface-low hover:bg-surface-container border border-outline-variant text-xs font-semibold uppercase tracking-wider text-on-surface transition-colors self-end sm:self-auto"
        >
          <span>Customize Shortcuts</span>
        </button>
      </div>

      {/* Sounds & Audio Preferences */}
      <div className="bg-surface-lowest border border-outline-variant rounded-xl p-6 shadow-card space-y-5">
        <h2 className="font-serif text-xl font-semibold text-on-surface border-b border-outline-subtle pb-3">
          Audio & Sounds
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.soundEffects ? (
                <Volume2 className="w-5 h-5 text-tertiary" aria-hidden="true" />
              ) : (
                <VolumeX className="w-5 h-5 text-secondary" aria-hidden="true" />
              )}
              <div>
                <p className="text-xs font-semibold text-on-surface">UI Chimes & Audio Cues</p>
                <p className="text-[11px] text-secondary">Acoustic chimes for timer completion and reminders</p>
              </div>
            </div>

            <ToggleSwitch
              checked={settings.soundEffects}
              onChange={(checked) => updateSettings({ soundEffects: checked })}
              ariaLabel="Toggle sound effects"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-tertiary" aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold text-on-surface">Break Auto-Start</p>
                <p className="text-[11px] text-secondary">Automatically begin rest countdown after focus blocks</p>
              </div>
            </div>

            <ToggleSwitch
              checked={settings.autoStartBreaks}
              onChange={(checked) => updateSettings({ autoStartBreaks: checked })}
              ariaLabel="Toggle break auto-start"
            />
          </div>
        </div>
      </div>

      {/* Sync & Workspace Backups */}
      <div className="bg-surface-lowest border border-outline-variant rounded-xl p-6 shadow-card space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-tertiary" aria-hidden="true" />
            <h2 className="font-serif text-xl font-semibold text-on-surface">
              Sync & Workspace Backups
            </h2>
          </div>
          <p className="text-xs text-secondary">
            You own all your data. Export your notes to clean Markdown checklists or download a complete JSON backup whenever you want.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={handleExportJSON}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-surface-low hover:bg-surface-container border border-outline-variant text-xs font-semibold text-on-surface transition-colors"
          >
            <Download className="w-4 h-4 text-tertiary" aria-hidden="true" />
            <span>JSON Backup</span>
          </button>

          <button
            type="button"
            onClick={handleExportMD}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-surface-low hover:bg-surface-container border border-outline-variant text-xs font-semibold text-on-surface transition-colors"
          >
            <FileText className="w-4 h-4 text-tertiary" aria-hidden="true" />
            <span>Markdown Export</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-surface-low hover:bg-surface-container border border-outline-variant text-xs font-semibold text-on-surface transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-tertiary" aria-hidden="true" />
            <span>CSV Spreadsheet</span>
          </button>
        </div>

        {/* Restore Backup */}
        <div className="p-4 rounded-lg bg-surface-low border border-outline-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-on-surface">Restore Workspace Backup</p>
            <p className="text-[11px] text-secondary">Import a previously exported JSON backup file</p>
          </div>

          <label className="flex items-center gap-2 px-4 py-2 bg-primary-container text-on-primary-container hover:bg-primary rounded-md text-xs font-semibold uppercase tracking-wider cursor-pointer shadow-sm transition-all active:scale-[0.98]">
            {importing ? (
              <span className="flex items-center gap-2">
                <span>Restoring backup...</span>
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              </span>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Import JSON</span>
              </>
            )}
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleImportFile}
              disabled={importing}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </div>
  );
};
