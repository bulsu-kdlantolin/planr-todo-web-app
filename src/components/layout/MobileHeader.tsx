import React from 'react';
import { useUIStore } from '../../store/useUIStore';
import { Logo } from '../common/Logo';
import { Menu, Search, Plus } from 'lucide-react';

export const MobileHeader: React.FC = () => {
  const mobileSidebarOpen = useUIStore((state) => state.mobileSidebarOpen);
  const setMobileSidebarOpen = useUIStore((state) => state.setMobileSidebarOpen);
  const openCommandPalette = useUIStore((state) => state.openCommandPalette);
  const openTaskModal = useUIStore((state) => state.openTaskModal);
  const activeView = useUIStore((state) => state.activeView);

  const viewTitles: Record<string, string> = {
    daily: 'Daily Overview',
    tasks: 'Tasks',
    reminders: 'Reminders',
    focus: 'Focus Timer',
    settings: 'Settings'
  };

  const currentTitle = viewTitles[activeView] || 'Planr';

  return (
    <header
      className="sticky top-0 z-30 lg:hidden bg-surface/95 backdrop-blur-md border-b border-outline-subtle px-3 py-2 flex items-center justify-between shadow-xs transition-colors"
      role="banner"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          aria-label="Open navigation menu"
          aria-expanded={mobileSidebarOpen}
          aria-controls="app-sidebar"
          className="w-11 h-11 flex items-center justify-center rounded-lg text-secondary hover:text-on-surface hover:bg-surface-low transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-container"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <Logo size="sm" showWordmark={false} />
          <h1 className="font-serif text-base font-semibold text-on-surface truncate">
            {currentTitle}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          type="button"
          onClick={openCommandPalette}
          aria-label="Open command palette search"
          className="w-11 h-11 flex items-center justify-center rounded-lg text-secondary hover:text-on-surface hover:bg-surface-low transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-container"
        >
          <Search className="w-4 h-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => openTaskModal()}
          aria-label="Create new task"
          className="w-11 h-11 flex items-center justify-center rounded-lg bg-primary-container text-on-primary-container hover:bg-primary shadow-xs transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-container"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
};

export default MobileHeader;
