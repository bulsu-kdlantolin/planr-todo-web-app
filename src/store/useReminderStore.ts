import { create } from 'zustand';
import { Reminder } from '../types';
import { supabase } from '../lib/supabase/client';
import { insertReminderDb, updateReminderDb, deleteReminderDb } from '../lib/supabase/reminders';
import { audioManager } from '../utils/audio';
import { generateUUID } from '../utils/id';
import { useTaskStore } from './useTaskStore';

interface ReminderState {
  reminders: Reminder[];
  filter: 'active' | 'completed' | 'all';
  setReminders: (reminders: Reminder[]) => void;
  setFilter: (filter: 'active' | 'completed' | 'all') => void;
  addReminder: (remData: Omit<Reminder, 'id' | 'active' | 'completed'>) => Promise<Reminder>;
  updateReminder: (id: string, updates: Partial<Omit<Reminder, 'id' | 'createdAt'>>) => Promise<Reminder | null>;
  toggleReminder: (id: string) => Promise<Reminder | null>;
  setReminderCompletedByTaskId: (taskId: string, completed: boolean, fallbackTitle?: string) => Promise<void>;
  snoozeReminder: (id: string, minutes?: number) => Promise<Reminder | null>;
  deleteReminder: (id: string) => Promise<Reminder | null>;
  deleteRemindersByTaskId: (taskId: string, fallbackTitle?: string) => Promise<Reminder[]>;
  deleteRemindersByTaskIds: (taskIds: string[]) => Promise<Reminder[]>;
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

  updateReminder: async (id, updates) => {
    const rem = get().reminders.find((r) => r.id === id);
    if (!rem) return null;

    const updated: Reminder = {
      ...rem,
      ...updates,
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

  toggleReminder: async (id) => {
    const rem = get().reminders.find((r) => r.id === id);
    if (!rem) return null;

    audioManager.playTick();
    const nextCompleted = !rem.completed;
    const updated: Reminder = {
      ...rem,
      completed: nextCompleted,
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

    // Connected Task Synchronization:
    // When marked as done (or undone) in reminders, keep the connected task synchronized
    try {
      const taskStore = useTaskStore.getState();
      let connectedTask = rem.taskId ? taskStore.tasks.find((t) => t.id === rem.taskId) : null;
      if (!connectedTask) {
        connectedTask = taskStore.tasks.find(
          (t) => t.title.trim().toLowerCase() === rem.title.trim().toLowerCase()
        ) || null;
      }

      if (connectedTask && connectedTask.completed !== nextCompleted) {
        await taskStore.toggleTask(connectedTask.id);
      }
    } catch (err) {
      console.error('Failed to sync connected task toggle from reminder:', err);
    }

    return updated;
  },

  setReminderCompletedByTaskId: async (taskId, completed, fallbackTitle) => {
    const linkedReminders = get().reminders.filter((r) => {
      if (r.taskId === taskId) return r.completed !== completed;
      if (fallbackTitle && !r.taskId && r.title.trim().toLowerCase() === fallbackTitle.trim().toLowerCase()) {
        return r.completed !== completed;
      }
      return false;
    });

    if (linkedReminders.length === 0) return;

    const linkedIds = new Set(linkedReminders.map((r) => r.id));
    const nowIso = new Date().toISOString();

    set((state) => ({
      reminders: state.reminders.map((r) =>
        linkedIds.has(r.id)
          ? { ...r, completed, revision: (r.revision ?? 0) + 1, updatedAt: nowIso }
          : r
      )
    }));

    const userId = await getUserId();
    if (userId) {
      linkedReminders.forEach((r) => {
        updateReminderDb({ ...r, completed, updatedAt: nowIso }, userId).catch((err) =>
          console.error('Failed to sync reminder completion status to Supabase:', err)
        );
      });
    }
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

  deleteRemindersByTaskId: async (taskId, fallbackTitle) => {
    const toDelete = get().reminders.filter((r) => {
      if (r.taskId === taskId) return true;
      if (fallbackTitle && !r.taskId && r.title.trim().toLowerCase() === fallbackTitle.trim().toLowerCase()) {
        return true;
      }
      return false;
    });
    if (toDelete.length === 0) return [];

    const deleteIds = new Set(toDelete.map((r) => r.id));
    set((state) => ({
      reminders: state.reminders.filter((r) => !deleteIds.has(r.id))
    }));

    const userId = await getUserId();
    if (userId) {
      toDelete.forEach((r) => {
        deleteReminderDb(r.id, userId).catch((err) =>
          console.error('Failed to cascade delete reminder from Supabase:', err)
        );
      });
    }
    return toDelete;
  },

  deleteRemindersByTaskIds: async (taskIds) => {
    const taskIdSet = new Set(taskIds);
    const toDelete = get().reminders.filter((r) => r.taskId && taskIdSet.has(r.taskId));
    if (toDelete.length === 0) return [];

    const deleteIds = new Set(toDelete.map((r) => r.id));
    set((state) => ({
      reminders: state.reminders.filter((r) => !deleteIds.has(r.id))
    }));

    const userId = await getUserId();
    if (userId) {
      toDelete.forEach((r) => {
        deleteReminderDb(r.id, userId).catch((err) =>
          console.error('Failed to cascade delete reminder series from Supabase:', err)
        );
      });
    }
    return toDelete;
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
