import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { useTaskStore } from '../../store/useTaskStore';
import { useReminderStore } from '../../store/useReminderStore';
import { useMetaStore } from '../../store/useMetaStore';
import { exportWorkspaceAsJSON } from '../../utils/exportEngines';
import { Task, Reminder, ViewType } from '../../types';
import {
  Search,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  List,
  Bell,
  Timer,
  Settings,
  Plus,
  Maximize2,
  Sun,
  Moon,
  Download,
  Command,
  ArrowRight,
  X
} from 'lucide-react';

interface PaletteItem {
  id: string;
  type: 'navigation' | 'action' | 'task' | 'reminder';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  badge?: string;
  onSelect: () => void;
}

import { useFocusTrap } from '../../hooks/useFocusTrap';

export const CommandPaletteModal: React.FC = () => {
  const isOpen = useUIStore((state) => state.commandPaletteOpen);
  const onClose = useUIStore((state) => state.closeCommandPalette);
  const setActiveView = useUIStore((state) => state.setActiveView);
  const openTaskModal = useUIStore((state) => state.openTaskModal);
  const openViewTaskModal = useUIStore((state) => state.openViewTaskModal);
  const openReminderModal = useUIStore((state) => state.openReminderModal);
  const openEveningWrapUpModal = useUIStore((state) => state.openEveningWrapUpModal);
  const toggleFullScreenMode = useUIStore((state) => state.toggleFullScreenMode);
  const showToast = useUIStore((state) => state.showToast);

  const tasks = useTaskStore((state) => state.tasks);
  const toggleTask = useTaskStore((state) => state.toggleTask);
  const reminders = useReminderStore((state) => state.reminders);
  const settings = useMetaStore((state) => state.settings);
  const updateSettings = useMetaStore((state) => state.updateSettings);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const paletteCardRef = useRef<HTMLDivElement>(null);

  // Focus trap for command palette dialog
  useFocusTrap(paletteCardRef, {
    isActive: isOpen,
    onEscape: onClose,
    restoreFocus: true
  });

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const navigationCommands: PaletteItem[] = useMemo(
    () => [
      {
        id: 'nav-daily',
        type: 'navigation',
        title: 'Go to Daily Overview',
        subtitle: 'View today\'s progress, tasks, and focus intention',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
        badge: 'D',
        onSelect: () => {
          setActiveView('daily');
          onClose();
        }
      },
      {
        id: 'nav-tasks',
        type: 'navigation',
        title: 'Go to Tasks',
        subtitle: 'Browse all backlog, filtered views, and calendar',
        icon: <List className="w-4 h-4 text-primary" />,
        badge: 'T',
        onSelect: () => {
          setActiveView('tasks');
          onClose();
        }
      },
      {
        id: 'nav-reminders',
        type: 'navigation',
        title: 'Go to Reminders',
        subtitle: 'Manage timed alerts and procedural audio chimes',
        icon: <Bell className="w-4 h-4 text-amber-500" />,
        badge: 'R',
        onSelect: () => {
          setActiveView('reminders');
          onClose();
        }
      },
      {
        id: 'nav-focus',
        type: 'navigation',
        title: 'Go to Focus Timer',
        subtitle: 'Pomodoro timer with ambient sounds (rain, forest, ocean)',
        icon: <Timer className="w-4 h-4 text-sky-500" />,
        badge: 'C',
        onSelect: () => {
          setActiveView('focus');
          onClose();
        }
      },
      {
        id: 'nav-settings',
        type: 'navigation',
        title: 'Go to Settings',
        subtitle: 'Themes, sound options, backups, and preferences',
        icon: <Settings className="w-4 h-4 text-secondary" />,
        badge: 'S',
        onSelect: () => {
          setActiveView('settings');
          onClose();
        }
      }
    ],
    [setActiveView, onClose]
  );

  const actionCommands: PaletteItem[] = useMemo(
    () => [
      {
        id: 'act-new-task',
        type: 'action',
        title: 'Create New Task',
        subtitle: 'Add a new task with subtasks, priority, and date',
        icon: <Plus className="w-4 h-4 text-primary" />,
        badge: 'N',
        onSelect: () => {
          onClose();
          openTaskModal();
        }
      },
      {
        id: 'act-new-reminder',
        type: 'action',
        title: 'Create New Reminder',
        subtitle: 'Schedule an alert with a chosen sound tone',
        icon: <Bell className="w-4 h-4 text-amber-500" />,
        onSelect: () => {
          onClose();
          openReminderModal();
        }
      },
      {
        id: 'act-evening-review',
        type: 'action',
        title: 'Start Evening Wrap-Up & Reflection',
        subtitle: 'Review today\'s wins and migrate remaining items',
        icon: <Moon className="w-4 h-4 text-indigo-400" />,
        onSelect: () => {
          onClose();
          openEveningWrapUpModal();
        }
      },
      {
        id: 'act-zen-mode',
        type: 'action',
        title: 'Toggle Full Screen / Zen Mode',
        subtitle: 'Maximize distraction-free workspace',
        icon: <Maximize2 className="w-4 h-4 text-secondary" />,
        badge: 'F',
        onSelect: () => {
          toggleFullScreenMode();
          onClose();
        }
      },
      {
        id: 'act-toggle-theme',
        type: 'action',
        title: settings.theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme',
        subtitle: 'Calibrate contrast and interface aesthetics',
        icon: settings.theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />,
        onSelect: () => {
          const next = settings.theme === 'dark' ? 'light' : 'dark';
          updateSettings({ theme: next });
          showToast(`Theme changed to ${next}`);
          onClose();
        }
      },
      {
        id: 'act-backup',
        type: 'action',
        title: 'Export Workspace Backup (JSON)',
        subtitle: 'Download complete backup of tasks, reminders, and settings',
        icon: <Download className="w-4 h-4 text-tertiary" />,
        onSelect: () => {
          exportWorkspaceAsJSON();
          showToast('Backup JSON downloaded');
          onClose();
        }
      }
    ],
    [onClose, openTaskModal, openReminderModal, openEveningWrapUpModal, toggleFullScreenMode, settings.theme, updateSettings, showToast]
  );

  // Filtered items based on query
  const items: PaletteItem[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return [...actionCommands.slice(0, 3), ...navigationCommands];
    }

    const matchedNav = navigationCommands.filter(
      (c) => c.title.toLowerCase().includes(q) || (c.subtitle && c.subtitle.toLowerCase().includes(q))
    );

    const matchedAct = actionCommands.filter(
      (c) => c.title.toLowerCase().includes(q) || (c.subtitle && c.subtitle.toLowerCase().includes(q))
    );

    // Matching tasks
    const matchedTasks: PaletteItem[] = tasks
      .filter((t) => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q)))
      .slice(0, 8)
      .map((t) => ({
        id: `task-${t.id}`,
        type: 'task',
        title: t.title,
        subtitle: `${t.category} • ${t.dueDate || 'No date'}${t.completed ? ' • Completed' : ''}`,
        badge: t.priority === 'urgent' ? '⚡ Urgent' : t.priority === 'high' ? '▲ High' : undefined,
        icon: t.completed ? (
          <CheckCircle2 className="w-4 h-4 text-tertiary" />
        ) : (
          <Circle className="w-4 h-4 text-secondary" />
        ),
        onSelect: () => {
          onClose();
          openViewTaskModal(t);
        }
      }));

    // Matching reminders
    const matchedReminders: PaletteItem[] = reminders
      .filter((r) => r.title.toLowerCase().includes(q))
      .slice(0, 5)
      .map((r) => ({
        id: `rem-${r.id}`,
        type: 'reminder',
        title: r.title,
        subtitle: `Reminder at ${r.time} • ${r.repeat}`,
        badge: r.time,
        icon: <Bell className="w-4 h-4 text-amber-500" />,
        onSelect: () => {
          onClose();
          setActiveView('reminders');
        }
      }));

    return [...matchedTasks, ...matchedReminders, ...matchedAct, ...matchedNav];
  }, [query, navigationCommands, actionCommands, tasks, reminders, onClose, openViewTaskModal, setActiveView]);

  // Keep selected index in range
  useEffect(() => {
    setSelectedIndex(0);
  }, [items.length, query]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (items.length || 1));
      // Scroll into view
      setTimeout(() => {
        const el = listRef.current?.querySelector(`[data-index="${(selectedIndex + 1) % items.length}"]`);
        el?.scrollIntoView({ block: 'nearest' });
      }, 10);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + items.length) % (items.length || 1));
      setTimeout(() => {
        const el = listRef.current?.querySelector(`[data-index="${(selectedIndex - 1 + items.length) % items.length}"]`);
        el?.scrollIntoView({ block: 'nearest' });
      }, 10);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[selectedIndex]) {
        items[selectedIndex].onSelect();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="command-palette-title"
      className="fixed inset-0 z-[150] flex items-start justify-center pt-16 sm:pt-24 px-4 pointer-events-auto animate-fade-in"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Palette Modal Card */}
      <div
        ref={paletteCardRef}
        className="relative w-full max-w-xl bg-surface-lowest border border-outline-variant rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 transition-all text-on-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="command-palette-title" className="sr-only">
          Command Palette
        </h2>

        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-outline-subtle bg-surface-lowest">
          <Search className="w-5 h-5 text-secondary flex-shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search tasks & reminders..."
            aria-label="Command search"
            className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-secondary focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search query"
              className="w-8 h-8 flex items-center justify-center text-secondary hover:text-on-surface rounded transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-low border border-outline-subtle text-secondary">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div ref={listRef} className="max-h-80 overflow-y-auto p-2 divide-y divide-transparent space-y-0.5 custom-scrollbar">
          {items.length === 0 ? (
            <div className="p-8 text-center text-secondary text-xs space-y-1">
              <p className="font-medium text-on-surface">No results found for &ldquo;{query}&rdquo;</p>
              <p>Try searching with another keyword or type &ldquo;new&rdquo; to create tasks.</p>
            </div>
          ) : (
            items.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  data-index={idx}
                  type="button"
                  onClick={item.onSelect}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-primary-container/15 text-on-surface'
                      : 'hover:bg-surface-low text-on-surface'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-primary-container/25' : 'bg-surface-low'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate leading-tight">{item.title}</p>
                      {item.subtitle && (
                        <p className="text-[11px] text-secondary truncate mt-0.5 leading-tight">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.badge && (
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-surface-low border border-outline-subtle text-secondary">
                        {item.badge}
                      </span>
                    )}
                    {isSelected && (
                      <ArrowRight className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 border-t border-outline-subtle bg-surface-low flex items-center justify-between text-[11px] text-secondary">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.5 rounded bg-surface-lowest border border-outline-subtle font-mono text-[10px]">↑↓</kbd> Navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 rounded bg-surface-lowest border border-outline-subtle font-mono text-[10px]">↵</kbd> Select
            </span>
          </div>
          <span className="font-mono text-[10px]">Planr Spotlight</span>
        </div>
      </div>
    </div>
  );
};
