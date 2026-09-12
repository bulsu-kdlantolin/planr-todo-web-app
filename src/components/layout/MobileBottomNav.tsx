import React from 'react';
import { useUIStore } from '../../store/useUIStore';
import { useTaskStore } from '../../store/useTaskStore';
import { useReminderStore } from '../../store/useReminderStore';
import { useTimerStore } from '../../store/useTimerStore';
import { ViewType } from '../../types';
import { SunMedium, CheckSquare, Bell, Timer, Menu } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const activeView = useUIStore((state) => state.activeView);
  const setActiveView = useUIStore((state) => state.setActiveView);
  const mobileSidebarOpen = useUIStore((state) => state.mobileSidebarOpen);
  const setMobileSidebarOpen = useUIStore((state) => state.setMobileSidebarOpen);

  const tasks = useTaskStore((state) => state.tasks);
  const reminders = useReminderStore((state) => state.reminders);
  const isTimerRunning = useTimerStore((state) => state.isRunning);

  const activeTasksCount = tasks.filter((t) => !t.completed).length;
  const activeRemindersCount = reminders.filter((r) => !r.completed).length;

  const navTabs: Array<{
    id: ViewType | 'menu';
    label: string;
    icon: React.ReactNode;
    badge?: number;
    pulseDot?: boolean;
    onClick: () => void;
  }> = [
    {
      id: 'daily',
      label: 'Today',
      icon: <SunMedium className="w-5 h-5" aria-hidden="true" />,
      onClick: () => {
        setActiveView('daily');
        setMobileSidebarOpen(false);
      }
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: <CheckSquare className="w-5 h-5" aria-hidden="true" />,
      badge: activeTasksCount,
      onClick: () => {
        setActiveView('tasks');
        setMobileSidebarOpen(false);
      }
    },
    {
      id: 'reminders',
      label: 'Reminders',
      icon: <Bell className="w-5 h-5" aria-hidden="true" />,
      badge: activeRemindersCount,
      onClick: () => {
        setActiveView('reminders');
        setMobileSidebarOpen(false);
      }
    },
    {
      id: 'focus',
      label: 'Focus',
      icon: <Timer className="w-5 h-5" aria-hidden="true" />,
      pulseDot: isTimerRunning,
      onClick: () => {
        setActiveView('focus');
        setMobileSidebarOpen(false);
      }
    },
    {
      id: 'menu',
      label: 'Menu',
      icon: <Menu className="w-5 h-5" aria-hidden="true" />,
      onClick: () => setMobileSidebarOpen(!mobileSidebarOpen)
    }
  ];

  return (
    <nav
      role="navigation"
      aria-label="Mobile Navigation Bar"
      className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-surface-lowest/95 backdrop-blur-md border-t border-outline-subtle shadow-ambient px-2 py-1 pb-safe flex items-center justify-around transition-colors"
    >
      {navTabs.map((tab) => {
        const isActive = tab.id === activeView || (tab.id === 'menu' && mobileSidebarOpen);

        return (
          <button
            key={tab.id}
            type="button"
            onClick={tab.onClick}
            aria-current={isActive ? 'page' : undefined}
            aria-label={tab.badge ? `${tab.label} (${tab.badge} active)` : tab.label}
            className={`min-h-[48px] min-w-[56px] flex flex-col items-center justify-center gap-1 rounded-xl transition-all cursor-pointer relative px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-container ${
              isActive
                ? 'text-primary-container font-semibold'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            <div className="relative">
              {tab.icon}

              {typeof tab.badge === 'number' && tab.badge > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-primary-container text-on-primary-container text-[10px] font-bold flex items-center justify-center border border-surface-lowest"
                >
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}

              {tab.pulseDot && (
                <span
                  aria-hidden="true"
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-tertiary animate-ping"
                />
              )}
            </div>

            <span className="text-[10px] tracking-tight leading-none font-sans">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
