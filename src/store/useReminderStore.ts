import { create } from 'zustand';
import { Reminder } from '../types';
import { supabase } from '../lib/supabase/client';
import { insertReminderDb, updateReminderDb, deleteReminderDb } from '../lib/supabase/reminders';
import { audioManager } from '../utils/audio';
import { generateUUID } from '../utils/id';

interface ReminderState {
  reminders: Reminder[];
  filter: 'active' | 'completed' | 'all';
  setReminders: (reminders: Reminder[]) => void;
  setFilter: (filter: 'active' | 'completed' | 'all') => void;
  addReminder: (remData: Omit<Reminder, 'id' | 'active' | 'completed'>) => Promise<Reminder>;
  toggleReminder: (id: string) => Promise<Reminder | null>;
  snoozeReminder: (id: string, minutes?: number) => Promise<Reminder | null>;
  deleteReminder: (id: string) => Promise<Reminder | null>;
  restoreReminder: (reminder: Reminder) => Promise<void>;
}

const getUserId = async (): Promise<string | null> => {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id || null;
  } catch {
    return null;
  }
};

export const useReminderStore = create<ReminderState>((set, get) => ({
  reminders: [],
  filter: 'active',

  setReminders: (reminders) => set({ reminders }),
  setFilter: (filter) => set({ filter }),

  addReminder: async (remData) => {
    const newRem: Reminder = {
      ...remData,
      id: generateUUID('rem'),
      active: true,
      completed: false,
      revision: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    set((state) => ({ reminders: [...state.reminders, newRem] }));

    const userId = await getUserId();
    if (userId) {
      insertReminderDb(newRem, userId).catch((err) =>
        console.error('Failed to sync reminder to Supabase:', err)
      );
    }
    return newRem;
  },

  toggleReminder: async (id) => {
    const rem = get().reminders.find((r) => r.id === id);
    if (!rem) return null;

    audioManager.playTick();
    const updated: Reminder = {
      ...rem,
      completed: !rem.completed,
      revision: (rem.revision ?? 0) + 1,
      updatedAt: new Date().toISOString()
    };

    set((state) => ({
      reminders: state.reminders.map((r) => (r.id === id ? updated : r))
    }));

    const userId = await getUserId();
    if (userId) {
      updateReminderDb(updated, userId).catch((err) =>
        console.error('Failed to sync reminder update to Supabase:', err)
      );
    }
    return updated;
  },

  snoozeReminder: async (id, minutes = 15) => {
    const rem = get().reminders.find((r) => r.id === id);
    if (!rem) return null;

    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    const updated: Reminder = {
      ...rem,
      time: now.toTimeString().substring(0, 5),
      completed: false,
      revision: (rem.revision ?? 0) + 1,
      updatedAt: new Date().toISOString()
    };

    set((state) => ({
      reminders: state.reminders.map((r) => (r.id === id ? updated : r))
    }));

    const userId = await getUserId();
    if (userId) {
      updateReminderDb(updated, userId).catch((err) =>
        console.error('Failed to sync snoozed reminder to Supabase:', err)
      );
    }
    return updated;
  },

  deleteReminder: async (id) => {
    const target = get().reminders.find((r) => r.id === id) || null;
    if (!target) return null;

    set((state) => ({
      reminders: state.reminders.filter((r) => r.id !== id)
    }));

    const userId = await getUserId();
    if (userId) {
      deleteReminderDb(id, userId).catch((err) =>
        console.error('Failed to sync reminder deletion to Supabase:', err)
      );
    }
    return target;
  },

  restoreReminder: async (reminder) => {
    const restored: Reminder = {
      ...reminder,
      revision: (reminder.revision ?? 0) + 1,
      updatedAt: new Date().toISOString()
    };
    set((state) => ({
      reminders: [...state.reminders, restored]
    }));

    const userId = await getUserId();
    if (userId) {
      insertReminderDb(restored, userId).catch((err) =>
        console.error('Failed to restore reminder in Supabase:', err)
      );
    }
  }
}));
