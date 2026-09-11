import { useEffect } from 'react';
import { useUIStore } from '../store/useUIStore';
import { useMetaStore } from '../store/useMetaStore';

/**
 * Hook to manage global customizable keyboard shortcuts with active input protection.
 */
export function useKeyboardShortcuts() {
  const setActiveView = useUIStore((state) => state.setActiveView);
  const openTaskModal = useUIStore((state) => state.openTaskModal);
  const openShortcutsModal = useUIStore((state) => state.openShortcutsModal);
  const openCommandPalette = useUIStore((state) => state.openCommandPalette);
  const toggleFullScreenMode = useUIStore((state) => state.toggleFullScreenMode);
  const shortcuts = useMetaStore((state) => state.settings.shortcuts) || {};
  const isAnyModalOpen = useUIStore(
    (state) =>
      state.taskModalOpen ||
      state.taskViewModalOpen ||
      state.reminderModalOpen ||
      state.authModalOpen ||
      state.intentionModalOpen ||
      state.profileModalOpen ||
      state.shortcutsModalOpen ||
      state.firstSessionTourOpen ||
      state.commandPaletteOpen ||
      state.eveningWrapUpModalOpen
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global Spotlight Command Palette (Cmd+K or Ctrl+K) works from anywhere
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        openCommandPalette();
        return;
      }

      // Don't trigger single-key shortcuts when any modal is open or when user is typing
      if (isAnyModalOpen) return;

      const target = document.activeElement as HTMLElement;
      if (
        target &&
        (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)
      ) {
        return;
      }

      // Quick '/' shortcut for spotlight search when not in text field
      if (e.key === '/' && !e.shiftKey) {
        e.preventDefault();
        openCommandPalette();
        return;
      }

      const key = e.key.toUpperCase();

      const match = (actionId: string, defaultKey: string) => {
        const targetKey = (shortcuts[actionId as keyof typeof shortcuts] || defaultKey).toUpperCase();
        return key === targetKey;
      };

      if (e.key === '?' || (e.shiftKey && e.key === '/') || match('shortcutsModal', '?')) {
        e.preventDefault();
        openShortcutsModal();
      } else if (match('toggleFullScreen', 'F') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        toggleFullScreenMode();
      } else if (match('newTask', 'N') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        openTaskModal();
      } else if (match('dailyView', 'D') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setActiveView('daily');
      } else if (match('tasksView', 'T') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setActiveView('tasks');
      } else if (match('remindersView', 'R') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setActiveView('reminders');
      } else if (match('focusView', 'C') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setActiveView('focus');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openTaskModal, setActiveView, openShortcutsModal, toggleFullScreenMode, shortcuts, isAnyModalOpen]);
}
