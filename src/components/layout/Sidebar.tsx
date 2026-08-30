import React from 'react';
import { useUIStore } from '../../store/useUIStore';
import { useTaskStore } from '../../store/useTaskStore';
import { useReminderStore } from '../../store/useReminderStore';
import { useTimerStore } from '../../store/useTimerStore';
import { useMetaStore } from '../../store/useMetaStore';
import { useAuth } from '../../context/AuthContext';
import { ViewType } from '../../types';
import { Logo } from '../common/Logo';
import {
  SunMedium,
  CheckSquare,
  Bell,
  Timer,
  Settings,
  User,
  X,
  Play,
  Pause,
  Keyboard,
  Maximize2,
  Cloud,
  CloudCheck,
  CloudOff,
  Database
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const activeView = useUIStore((state) => state.activeView);
  const setActiveView = useUIStore((state) => state.setActiveView);
  const openShortcutsModal = useUIStore((state) => state.openShortcutsModal);
  const fullScreenMode = useUIStore((state) => state.fullScreenMode);
  const toggleFullScreenMode = useUIStore((state) => state.toggleFullScreenMode);

  const tasks = useTaskStore((state) => state.tasks);
  const reminders = useReminderStore((state) => state.reminders);
  const user = useMetaStore((state) => state.user);
  const { syncStatus, isOnline, isConfigured } = useAuth();

  // Focus mini player state
  const isTimerRunning = useTimerStore((state) => state.isRunning);
  const remainingSec = useTimerStore((state) => state.remainingSec);
  const durationSec = useTimerStore((state) => state.durationSec);
  const toggleTimer = useTimerStore((state) => state.toggleTimer);
  const ambientType = useTimerStore((state) => state.ambientType);

  const activeTasksCount = tasks.filter((t) => !t.completed).length;
  const activeRemindersCount = reminders.filter((r) => !r.completed).length;

  const navItems: { id: ViewType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'daily', label: 'Daily Overview', icon: <SunMedium className="w-5 h-5" aria-hidden="true" /> },
    { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-5 h-5" aria-hidden="true" />, badge: activeTasksCount },
    { id: 'reminders', label: 'Reminders', icon: <Bell className="w-5 h-5" aria-hidden="true" />, badge: activeRemindersCount },
    { id: 'focus', label: 'Focus Timer', icon: <Timer className="w-5 h-5" aria-hidden="true" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" aria-hidden="true" /> }
  ];

  const handleNavClick = (view: ViewType) => {
    setActiveView(view);
    setMobileOpen(false);
  };

  const mins = Math.floor(remainingSec / 60);
  const secs = remainingSec % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const isTimerActive = remainingSec < durationSec || isTimerRunning;

  if (fullScreenMode) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Clean Uncluttered Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-surface border-r border-outline-subtle flex flex-col py-6 px-4 z-50 transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 pb-5 border-b border-outline-subtle mb-4">
          <div
            className="flex items-center cursor-pointer select-none"
            onClick={() => handleNavClick('landing')}
          >
            <Logo size="md" />
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
            className="lg:hidden p-1.5 text-secondary hover:text-on-surface rounded-md hover:bg-surface-low transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Main Navigation (Uncluttered without redundant top New Task button) */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-1 pt-1" aria-label="Main Navigation">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-surface-low text-on-surface font-semibold shadow-card'
                    : 'text-secondary hover:text-on-surface hover:bg-surface-low/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-primary-container' : 'text-secondary'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface text-secondary border border-outline-subtle">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Persistent Mini Focus Player */}
        {isTimerActive && (
          <div className="mx-1 mb-4 p-3 bg-surface-lowest border border-outline-variant rounded-lg shadow-card animate-fade-in">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Timer className="w-3.5 h-3.5 text-tertiary" aria-hidden="true" />
                <span>Focus Timer</span>
              </div>
              <span className="font-serif text-sm font-bold text-on-surface">
                {timeFormatted}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-outline-subtle">
              <span className="text-[10px] text-secondary uppercase tracking-wider">
                {ambientType !== 'none' ? `Sound: ${ambientType}` : 'Silent'}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleTimer}
                  aria-label={isTimerRunning ? 'Pause timer' : 'Resume timer'}
                  className="p-1 rounded bg-primary-container text-on-primary-container hover:bg-primary transition-colors"
                >
                  {isTimerRunning ? (
                    <Pause className="w-3 h-3" aria-hidden="true" />
                  ) : (
                    <Play className="w-3 h-3" aria-hidden="true" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('focus')}
                  className="text-[11px] text-primary hover:underline font-medium px-1"
                >
                  Open
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Full Screen Mode & Shortcuts Triggers */}
        <div className="px-2 pt-2 border-t border-outline-subtle mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={toggleFullScreenMode}
            className="flex items-center gap-1.5 text-xs text-secondary hover:text-primary font-medium transition-colors"
            title="Toggle Full Screen Mode (F)"
          >
            <Maximize2 className="w-3.5 h-3.5 text-tertiary" aria-hidden="true" />
            <span>Full Screen Mode (F)</span>
          </button>

          <button
            type="button"
            onClick={openShortcutsModal}
            aria-label="Open keyboard shortcuts cheat sheet"
            className="p-1 text-secondary hover:text-on-surface rounded hover:bg-surface-low transition-colors"
            title="Keyboard Shortcuts (?)"
          >
            <Keyboard className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        {/* User Profile & Sync Indicator */}
        <div className="px-2 pt-3 border-t border-outline-subtle space-y-2">
          <div
            className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0 hover:opacity-80 transition-opacity"
            onClick={() => {
              if (user.isLoggedIn) {
                handleNavClick('settings');
              } else {
                handleNavClick('signin' as any);
              }
            }}
          >
            <div className="w-8 h-8 rounded-full bg-surface-low border border-outline-variant flex items-center justify-center text-secondary overflow-hidden flex-shrink-0">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name || 'User'} className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-on-surface truncate leading-tight">
                {user.name || (user.isLoggedIn ? 'User' : 'Guest / Sign In')}
              </p>
              <p className="text-[10px] text-secondary truncate font-sans">
                {user.title || (user.isLoggedIn ? 'Productivity User' : 'Click to Sign In')}
              </p>
            </div>
          </div>

          {/* Sync Status Badge */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-surface-low/80 rounded-md text-[10px] font-sans text-secondary border border-outline-subtle/50">
            {!isOnline ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Offline (Local DB)</span>
              </>
            ) : user.isLoggedIn && isConfigured ? (
              syncStatus === 'syncing' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                  <span>Syncing with Cloud...</span>
                </>
              ) : syncStatus === 'error' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>Sync Paused</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-lime-600" />
                  <span>Cloud Synced</span>
                </>
              )
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                <span>Private Local Workspace</span>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
