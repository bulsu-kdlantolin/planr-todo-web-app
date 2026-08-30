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
import { exportWorkspaceAsJSON, exportTasksAsMarkdown, exportTasksAsCSV } from '../utils/exportEngines';
import { dbImportJSON } from '../db/indexedDB';
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
  CheckCircle2
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
  const openAuthModal = useUIStore((state) => state.openAuthModal);
  const setActiveView = useUIStore((state) => state.setActiveView);

  const { signOut } = useAuth();

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);

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

      const success = await dbImportJSON(backupData);
      if (success) {
        if (backupData.tasks) setTasks(backupData.tasks);
        if (backupData.reminders) setReminders(backupData.reminders);
        if (backupData.focusSessions) setFocusSessions(backupData.focusSessions);
        if (backupData.meta?.user) useMetaStore.getState().updateUser(backupData.meta.user);
        if (backupData.meta?.settings) useMetaStore.getState().updateSettings(backupData.meta.settings);

        showToast('Backup restored successfully!', 'success');
      } else {
        showToast('Failed to import database file.', 'error');
      }
    } catch {
      showToast('Invalid backup file format.', 'error');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-fade-in space-y-8">
      {/* Header */}
      <div className="pb-5 border-b border-outline-subtle">
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-on-surface">Settings</h1>
        <p className="text-sm text-secondary mt-1">
          Customize your workspace, time preferences, sounds, cloud sync, and local backups.
        </p>
      </div>

      {/* User Profile & Auth Card */}
      <div className="bg-surface-lowest border border-outline-variant rounded-xl p-6 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-primary-container font-serif text-lg font-bold">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-lg font-semibold text-on-surface">{user.name}</h3>
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

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setProfileModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-surface-low hover:bg-surface-container border border-outline-variant text-xs font-semibold uppercase tracking-wider text-on-surface transition-colors"
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
              className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-surface-low hover:bg-surface-container text-red-600 dark:text-red-400 border border-outline-variant text-xs font-semibold uppercase tracking-wider transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveView('signin')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary-container text-on-primary-container hover:bg-primary text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

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

      {/* Private Local Storage & Backups */}
      <div className="bg-surface-lowest border border-outline-variant rounded-xl p-6 shadow-card space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-tertiary" aria-hidden="true" />
            <h2 className="font-serif text-xl font-semibold text-on-surface">
              Private Data & Workspace Backups
            </h2>
          </div>
          <p className="text-xs text-secondary">
            Your tasks and notes are stored securely on this device. You can download a backup at any time or restore from an existing file.
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
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{importing ? 'Restoring...' : 'Import JSON'}</span>
            <input
              type="file"
              accept=".json"
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
