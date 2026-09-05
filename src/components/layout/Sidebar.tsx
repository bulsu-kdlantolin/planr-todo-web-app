import React from 'react';
import { useUIStore } from '../../store/useUIStore';
import { useTaskStore } from '../../store/useTaskStore';
import { useReminderStore } from '../../store/useReminderStore';
import { useTimerStore } from '../../store/useTimerStore';
import { useMetaStore } from '../../store/useMetaStore';
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
  Maximize2
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

  const hours = Math.floor(remainingSec / 3600);
  const mins = Math.floor((remainingSec % 3600) / 60);
  const secs = remainingSec % 60;
  const timeFormatted =
    hours > 0
      ? `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const isTimerActive = remainingSec < durationSec || isTimerRunning;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && !fullScreenMode && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Animated Desktop & Mobile Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-surface border-r border-outline-subtle flex flex-col py-6 px-4 z-40 transition-all duration-300 ease-in-out ${
          fullScreenMode
            ? '-translate-x-full opacity-0 pointer-events-none'
            : mobileOpen
            ? 'translate-x-0 opacity-100 shadow-2xl'
            : '-translate-x-full lg:translate-x-0 opacity-100'
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
            className="lg:hidden p-1.5 text-secondary hover:text-on-surface rounded-md hover:bg-surface-low transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-1 pt-1" aria-label="Main Navigation">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
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

        {/* Mini Focus Bar in Sidebar */}
        {isTimerActive && (
          <div className="px-2 pt-2 border-t border-outline-subtle mb-3 animate-fade-in">
            <div className="p-3 bg-surface-low rounded-lg border border-outline-subtle flex items-center justify-between shadow-xs">
              <div
                className="cursor-pointer min-w-0 flex-1"
                onClick={() => handleNavClick('focus')}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-secondary">
                    {ambientType !== 'none' ? `${ambientType} 🎧` : 'Focus'}
                  </span>
                </div>
                <span className="font-mono text-sm font-bold text-on-surface block">
                  {timeFormatted}
                </span>
              </div>

              <button
                type="button"
                onClick={toggleTimer}
                aria-label={isTimerRunning ? 'Pause timer' : 'Resume timer'}
                className="p-2 rounded-md bg-primary-container hover:bg-primary text-on-primary-container transition-all active:scale-95 shadow-xs cursor-pointer flex-shrink-0"
              >
                {isTimerRunning ? (
                  <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Full Screen Mode & Shortcuts Triggers */}
        <div className="px-2 pt-2 border-t border-outline-subtle mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={toggleFullScreenMode}
            className="flex items-center gap-1.5 text-xs text-secondary hover:text-primary font-medium transition-colors cursor-pointer"
            title="Toggle Full Screen Mode (F)"
          >
            <Maximize2 className="w-3.5 h-3.5 text-tertiary" aria-hidden="true" />
            <span>Full Screen Mode (F)</span>
          </button>

          <button
            type="button"
            onClick={openShortcutsModal}
            aria-label="Open keyboard shortcuts cheat sheet"
            className="p-1 text-secondary hover:text-on-surface rounded hover:bg-surface-low transition-colors cursor-pointer"
            title="Keyboard Shortcuts (?)"
          >
            <Keyboard className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        {/* User Profile & Settings Link */}
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
        </div>
      </aside>
    </>
  );
};
