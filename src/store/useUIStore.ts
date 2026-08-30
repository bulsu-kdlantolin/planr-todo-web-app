import { create } from 'zustand';
import { ViewType, ToastMessage, Task } from '../types';
import { generateUUID } from '../utils/id';

interface UIState {
  activeView: ViewType;
  mobileSidebarOpen: boolean;
  fullScreenMode: boolean;
  zenMode: boolean; // Alias
  taskModalOpen: boolean;
  editingTask: Task | null;
  reminderModalOpen: boolean;
  authModalOpen: boolean;
  authMode: 'signin' | 'signup';
  intentionModalOpen: boolean;
  profileModalOpen: boolean;
  shortcutsModalOpen: boolean;
  toasts: ToastMessage[];

  setActiveView: (view: ViewType) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setFullScreenMode: (fullScreen: boolean) => void;
  toggleFullScreenMode: () => void;
  setZenMode: (zen: boolean) => void;
  toggleZenMode: () => void;
  openTaskModal: (task?: Task | null) => void;
  closeTaskModal: () => void;
  openReminderModal: () => void;
  closeReminderModal: () => void;
  openAuthModal: (mode?: 'signin' | 'signup') => void;
  closeAuthModal: () => void;
  openIntentionModal: () => void;
  closeIntentionModal: () => void;
  openProfileModal: () => void;
  closeProfileModal: () => void;
  openShortcutsModal: () => void;
  closeShortcutsModal: () => void;

  showToast: (msg: string, type?: 'success' | 'error' | 'info', actionText?: string, onAction?: () => void) => void;
  dismissToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  activeView: 'landing',
  mobileSidebarOpen: false,
  fullScreenMode: false,
  zenMode: false,
  taskModalOpen: false,
  editingTask: null,
  reminderModalOpen: false,
  authModalOpen: false,
  authMode: 'signin',
  intentionModalOpen: false,
  profileModalOpen: false,
  shortcutsModalOpen: false,
  toasts: [],

  setActiveView: (activeView) => {
    set({ activeView });
    window.location.hash = activeView;
    window.scrollTo({ top: 0, behavior: 'instant' });
  },

  setMobileSidebarOpen: (mobileSidebarOpen) => set({ mobileSidebarOpen }),
  setFullScreenMode: (fullScreenMode) => set({ fullScreenMode, zenMode: fullScreenMode }),
  toggleFullScreenMode: () => {
    const next = !get().fullScreenMode;
    set({ fullScreenMode: next, zenMode: next });
    get().showToast(next ? 'Full Screen Mode activated (Press F to exit)' : 'Full Screen Mode deactivated');
  },
  setZenMode: (zen) => get().setFullScreenMode(zen),
  toggleZenMode: () => get().toggleFullScreenMode(),

  openTaskModal: (editingTask = null) => set({ taskModalOpen: true, editingTask }),
  closeTaskModal: () => set({ taskModalOpen: false, editingTask: null }),

  openReminderModal: () => set({ reminderModalOpen: true }),
  closeReminderModal: () => set({ reminderModalOpen: false }),

  openAuthModal: (authMode = 'signin') => set({ authModalOpen: true, authMode }),
  closeAuthModal: () => set({ authModalOpen: false }),

  openIntentionModal: () => set({ intentionModalOpen: true }),
  closeIntentionModal: () => set({ intentionModalOpen: false }),

  openProfileModal: () => set({ profileModalOpen: true }),
  closeProfileModal: () => set({ profileModalOpen: false }),

  openShortcutsModal: () => set({ shortcutsModalOpen: true }),
  closeShortcutsModal: () => set({ shortcutsModalOpen: false }),

  showToast: (message, type = 'success', actionText, onAction) => {
    const id = generateUUID('toast');
    const newToast: ToastMessage = { id, message, type, actionText, onAction };

    set((state) => ({ toasts: [...state.toasts, newToast] }));

    setTimeout(() => {
      get().dismissToast(id);
    }, 4000);
  },

  dismissToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  }
}));
