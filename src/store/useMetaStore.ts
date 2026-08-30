import { create } from 'zustand';
import { UserProfile, AppSettings, ThemeMode } from '../types';
import { dbPutMeta, INITIAL_USER, INITIAL_SETTINGS, INITIAL_INTENTION } from '../db/indexedDB';
import { audioManager } from '../utils/audio';

interface MetaState {
  user: UserProfile;
  settings: AppSettings;
  intention: string;
  isLoading: boolean;
  storageUsageBytes: number | null;
  storageQuotaBytes: number | null;

  setUser: (user: UserProfile) => void;
  setSettings: (settings: AppSettings) => void;
  setIntention: (intention: string) => void;
  setIsLoading: (isLoading: boolean) => void;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  updateIntention: (newIntention: string) => Promise<void>;
  toggleTheme: () => void;
  refreshStorageQuota: () => Promise<void>;
}

export const useMetaStore = create<MetaState>((set, get) => ({
  user: INITIAL_USER,
  settings: INITIAL_SETTINGS,
  intention: INITIAL_INTENTION,
  isLoading: true,
  storageUsageBytes: null,
  storageQuotaBytes: null,

  setUser: (user) => set({ user }),
  setSettings: (settings) => set({ settings }),
  setIntention: (intention) => set({ intention }),
  setIsLoading: (isLoading) => set({ isLoading }),

  updateUser: async (updates) => {
    const updated: UserProfile = { ...get().user, ...updates };
    set({ user: updated });
    await dbPutMeta('user', updated);
  },

  updateSettings: async (updates) => {
    const updated: AppSettings = { ...get().settings, ...updates };
    set({ settings: updated });
    await dbPutMeta('settings', updated);

    if (updates.theme) {
      document.documentElement.setAttribute('data-theme', updates.theme);
    }
    if (typeof updates.soundVolume === 'number') {
      audioManager.setVolume(updates.soundVolume);
    }
  },

  updateIntention: async (newIntention) => {
    set({ intention: newIntention });
    await dbPutMeta('intention', newIntention);
  },

  toggleTheme: () => {
    const nextTheme: ThemeMode = get().settings.theme === 'light' ? 'dark' : 'light';
    get().updateSettings({ theme: nextTheme });
  },

  refreshStorageQuota: async () => {
    if (typeof navigator !== 'undefined' && 'storage' in navigator && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        set({
          storageUsageBytes: estimate.usage || 0,
          storageQuotaBytes: estimate.quota || 0
        });
      } catch {}
    }
  }
}));
