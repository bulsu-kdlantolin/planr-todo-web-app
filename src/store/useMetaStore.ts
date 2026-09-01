import { create } from 'zustand';
import { UserProfile, AppSettings, ThemeMode } from '../types';
import { supabase } from '../lib/supabase/client';
import {
  DEFAULT_USER_PROFILE,
  DEFAULT_SETTINGS,
  upsertUserProfileDb
} from '../lib/supabase/profiles';
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

const getUserId = async (): Promise<string | null> => {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id || null;
  } catch {
    return null;
  }
};

export const useMetaStore = create<MetaState>((set, get) => ({
  user: DEFAULT_USER_PROFILE,
  settings: DEFAULT_SETTINGS,
  intention: '',
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

    const userId = await getUserId();
    if (userId) {
      try {
        await upsertUserProfileDb(userId, updates);
      } catch (err) {
        console.error('Failed to sync profile update to Supabase:', err);
      }
    }
  },

  updateSettings: async (updates) => {
    const updated: AppSettings = { ...get().settings, ...updates };
    set({ settings: updated });

    if (updates.theme) {
      document.documentElement.setAttribute('data-theme', updates.theme);
    }
    if (typeof updates.soundVolume === 'number') {
      audioManager.setVolume(updates.soundVolume);
    }

    const userId = await getUserId();
    if (userId) {
      try {
        await upsertUserProfileDb(userId, undefined, updates);
      } catch (err) {
        console.error('Failed to sync settings update to Supabase:', err);
      }
    }
  },

  updateIntention: async (newIntention) => {
    set({ intention: newIntention });

    const userId = await getUserId();
    if (userId) {
      try {
        await upsertUserProfileDb(userId, undefined, undefined, newIntention);
      } catch (err) {
        console.error('Failed to sync intention to Supabase:', err);
      }
    }
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
