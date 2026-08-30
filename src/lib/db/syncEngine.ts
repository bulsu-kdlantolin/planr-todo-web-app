import { supabase, isSupabaseConfigured } from '../supabase/client';
import {
  Task,
  Reminder,
  FocusSession,
  PriorityLevel,
  TaskCategory,
  DaySegment,
  Recurrence,
  AppSettings,
  UserProfile
} from '../../types';
import { useTaskStore } from '../../store/useTaskStore';
import { useReminderStore } from '../../store/useReminderStore';
import { useTimerStore } from '../../store/useTimerStore';
import { useMetaStore } from '../../store/useMetaStore';
import {
  dbGetAllTasks,
  dbPutTasksBatch,
  dbGetAllReminders,
  dbPutRemindersBatch,
  dbGetAllFocusSessions,
  dbPutFocusSessionsBatch,
  dbClearAllStores
} from '../../db/indexedDB';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

export interface SupabaseTaskRow {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  due_date: string | null;
  priority: number;
  duration_minutes: number;
  estimated_pomodoros?: number;
  is_completed: boolean;
  completed_at: string | null;
  subtasks: any;
  category: string;
  tags?: string[];
  revision?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface SupabaseReminderRow {
  id: string;
  user_id: string;
  title: string;
  time: string;
  period: string;
  repeat: string;
  scheduled_date: string | null;
  sound: boolean;
  active: boolean;
  completed: boolean;
  description?: string;
  revision?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface SupabaseFocusSessionRow {
  id: string;
  user_id: string;
  task_id: string | null;
  task_title: string;
  duration_minutes: number;
  completed_at: string;
  type: string;
  break_preset: string | null;
  created_at?: string;
  deleted_at?: string | null;
}

export const priorityToInt = (priority: PriorityLevel): number => {
  switch (priority) {
    case 'urgent':
      return 4;
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
    default:
      return 2;
  }
};

export const intToPriority = (val: number): PriorityLevel => {
  switch (val) {
    case 4:
      return 'urgent';
    case 3:
      return 'high';
    case 2:
      return 'medium';
    case 1:
      return 'low';
    default:
      return 'medium';
  }
};

export const taskToSupabaseRow = (task: Task, userId: string): SupabaseTaskRow => {
  return {
    id: task.id,
    user_id: userId,
    title: task.title,
    description: task.description || '',
    due_date: task.dueDate || null,
    priority: priorityToInt(task.priority),
    duration_minutes: (task.estimatedPomodoros || 1) * 25,
    estimated_pomodoros: task.estimatedPomodoros || 1,
    is_completed: task.completed,
    completed_at: task.completedAt || null,
    subtasks: task.subtasks || [],
    category: task.category || 'Work',
    tags: [],
    revision: task.revision ?? 1,
    created_at: task.createdAt || new Date().toISOString(),
    updated_at: task.updatedAt || new Date().toISOString(),
    deleted_at: task.deletedAt || null
  };
};

export const supabaseRowToTask = (row: SupabaseTaskRow): Task => {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    category: (row.category || 'Work') as TaskCategory,
    priority: intToPriority(row.priority),
    dueDate: row.due_date || undefined,
    completed: Boolean(row.is_completed),
    completedAt: row.completed_at || undefined,
    estimatedPomodoros: row.estimated_pomodoros ?? Math.max(1, Math.round((row.duration_minutes || 25) / 25)),
    completedPomodoros: 0,
    subtasks: Array.isArray(row.subtasks) ? row.subtasks : [],
    revision: row.revision ?? 1,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    deletedAt: row.deleted_at || null
  };
};

export const reminderToSupabaseRow = (reminder: Reminder, userId: string): SupabaseReminderRow => {
  return {
    id: reminder.id,
    user_id: userId,
    title: reminder.title,
    time: reminder.time,
    period: reminder.period,
    repeat: reminder.repeat,
    scheduled_date: reminder.scheduledDate || null,
    sound: reminder.sound,
    active: reminder.active,
    completed: reminder.completed,
    description: reminder.description || '',
    revision: reminder.revision ?? 1,
    created_at: reminder.createdAt || new Date().toISOString(),
    updated_at: reminder.updatedAt || new Date().toISOString(),
    deleted_at: reminder.deletedAt || null
  };
};

export const supabaseRowToReminder = (row: SupabaseReminderRow): Reminder => {
  return {
    id: row.id,
    title: row.title,
    time: row.time,
    period: (row.period || 'Morning') as DaySegment,
    repeat: (row.repeat || 'Daily') as Recurrence,
    scheduledDate: row.scheduled_date || undefined,
    sound: Boolean(row.sound),
    active: Boolean(row.active),
    completed: Boolean(row.completed),
    description: row.description || '',
    revision: row.revision ?? 1,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    deletedAt: row.deleted_at || null
  };
};

export const focusSessionToSupabaseRow = (session: FocusSession, userId: string): SupabaseFocusSessionRow => {
  return {
    id: session.id,
    user_id: userId,
    task_id: session.taskId || null,
    task_title: session.taskTitle || 'Deep Focus Session',
    duration_minutes: session.durationMinutes || 25,
    completed_at: session.completedAt || new Date().toISOString(),
    type: session.type || 'focus',
    break_preset: session.breakPreset || null,
    created_at: session.completedAt || new Date().toISOString(),
    deleted_at: null
  };
};

export const supabaseRowToFocusSession = (row: SupabaseFocusSessionRow): FocusSession => {
  return {
    id: row.id,
    taskId: row.task_id || undefined,
    taskTitle: row.task_title || 'Deep Focus Session',
    durationMinutes: row.duration_minutes || 25,
    completedAt: row.completed_at || new Date().toISOString(),
    type: (row.type || 'focus') as 'focus' | 'break',
    breakPreset: (row.break_preset as 'short' | 'long') || undefined
  };
};

class SyncEngine {
  private status: SyncStatus = 'idle';
  private listeners: Set<(status: SyncStatus) => void> = new Set();
  private syncTimer: any = null;

  getStatus(): SyncStatus {
    return this.status;
  }

  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => this.listeners.delete(listener);
  }

  private setStatus(status: SyncStatus) {
    this.status = status;
    this.listeners.forEach((l) => l(status));
  }

  /**
   * Pulls remote changes from Supabase and merges into local IndexedDB with batched transactions
   */
  async pullRemoteChanges(userId: string): Promise<void> {
    if (!isSupabaseConfigured() || !userId) return;

    try {
      // 1. Pull Tasks
      const { data: taskRows, error: taskErr } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null);

      if (!taskErr && taskRows) {
        const remoteTasks = taskRows.map(supabaseRowToTask);
        const localTasks = await dbGetAllTasks();
        const localMap = new Map<string, Task>(localTasks.map((t: Task) => [t.id, t]));
        const merged: Task[] = [...localTasks];
        const tasksToPersist: Task[] = [];

        for (const remote of remoteTasks) {
          const local = localMap.get(remote.id);
          if (!local) {
            merged.push(remote);
            tasksToPersist.push(remote);
          } else {
            const remoteRev = remote.revision ?? 0;
            const localRev = local.revision ?? 0;
            const remoteTime = remote.updatedAt ? new Date(remote.updatedAt).getTime() : 0;
            const localTime = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;
            
            // Revision-based conflict resolution with timestamp fallback
            if (remoteRev > localRev || (remoteRev === localRev && remoteTime > localTime)) {
              const idx = merged.findIndex((t) => t.id === remote.id);
              if (idx !== -1) merged[idx] = remote;
              tasksToPersist.push(remote);
            }
          }
        }
        if (tasksToPersist.length > 0) {
          await dbPutTasksBatch(tasksToPersist);
        }
        useTaskStore.getState().setTasks(merged);
      }

      // 2. Pull Reminders
      const { data: reminderRows, error: remErr } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null);

      if (!remErr && reminderRows) {
        const remoteReminders = reminderRows.map(supabaseRowToReminder);
        const localReminders = await dbGetAllReminders();
        const localMap = new Map<string, Reminder>(localReminders.map((r: Reminder) => [r.id, r]));
        const merged: Reminder[] = [...localReminders];
        const remindersToPersist: Reminder[] = [];

        for (const remote of remoteReminders) {
          const local = localMap.get(remote.id);
          if (!local) {
            merged.push(remote);
            remindersToPersist.push(remote);
          } else {
            const remoteRev = remote.revision ?? 0;
            const localRev = local.revision ?? 0;
            const remoteTime = remote.updatedAt ? new Date(remote.updatedAt).getTime() : 0;
            const localTime = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;
            if (remoteRev > localRev || (remoteRev === localRev && remoteTime > localTime)) {
              const idx = merged.findIndex((r) => r.id === remote.id);
              if (idx !== -1) merged[idx] = remote;
              remindersToPersist.push(remote);
            }
          }
        }
        if (remindersToPersist.length > 0) {
          await dbPutRemindersBatch(remindersToPersist);
        }
        useReminderStore.getState().setReminders(merged);
      }

      // 3. Pull Focus Sessions
      const { data: sessionRows, error: sessErr } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null);

      if (!sessErr && sessionRows) {
        const remoteSessions = sessionRows.map(supabaseRowToFocusSession);
        const localSessions = await dbGetAllFocusSessions();
        const localIds = new Set(localSessions.map((s) => s.id));
        const merged: FocusSession[] = [...localSessions];
        const sessionsToPersist: FocusSession[] = [];

        for (const remote of remoteSessions) {
          if (!localIds.has(remote.id)) {
            merged.push(remote);
            sessionsToPersist.push(remote);
          }
        }
        if (sessionsToPersist.length > 0) {
          await dbPutFocusSessionsBatch(sessionsToPersist);
        }
        useTimerStore.getState().setFocusSessions(merged);
      }

      // 4. Pull Profile & Intention
      const { data: profile, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!profErr && profile) {
        if (profile.name) {
          useMetaStore.getState().updateUser({
            name: profile.name,
            email: profile.email || '',
            title: profile.title || '',
            tagline: profile.tagline || '',
            avatar: profile.avatar_url || undefined,
            isLoggedIn: true
          });
        }
        if (profile.intention) {
          useMetaStore.getState().updateIntention(profile.intention);
        }
        if (profile.settings && typeof profile.settings === 'object') {
          useMetaStore.getState().updateSettings(profile.settings);
        }
      }
    } catch (err) {
      console.warn('Sync pull error:', err);
    }
  }

  /**
   * Pushes local changes to Supabase cloud in chunked batches of 100
   */
  async pushLocalChanges(userId: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !userId) return false;

    const CHUNK_SIZE = 100;

    try {
      // 1. Push Tasks in chunks
      const localTasks = useTaskStore.getState().tasks;
      if (localTasks.length > 0) {
        const taskRows = localTasks.map((t) => taskToSupabaseRow(t, userId));
        for (let i = 0; i < taskRows.length; i += CHUNK_SIZE) {
          const chunk = taskRows.slice(i, i + CHUNK_SIZE);
          await supabase.from('tasks').upsert(chunk, { onConflict: 'id' });
        }
      }

      // 2. Push Reminders in chunks
      const localReminders = useReminderStore.getState().reminders;
      if (localReminders.length > 0) {
        const reminderRows = localReminders.map((r) => reminderToSupabaseRow(r, userId));
        for (let i = 0; i < reminderRows.length; i += CHUNK_SIZE) {
          const chunk = reminderRows.slice(i, i + CHUNK_SIZE);
          await supabase.from('reminders').upsert(chunk, { onConflict: 'id' });
        }
      }

      // 3. Push Focus Sessions in chunks
      const localSessions = useTimerStore.getState().focusSessions;
      if (localSessions.length > 0) {
        const sessionRows = localSessions.map((s) => focusSessionToSupabaseRow(s, userId));
        for (let i = 0; i < sessionRows.length; i += CHUNK_SIZE) {
          const chunk = sessionRows.slice(i, i + CHUNK_SIZE);
          await supabase.from('focus_sessions').upsert(chunk, { onConflict: 'id' });
        }
      }

      // 4. Push Profile, Intention, Settings
      const meta = useMetaStore.getState();
      await supabase.from('profiles').upsert(
        {
          id: userId,
          name: meta.user.name,
          email: meta.user.email,
          title: meta.user.title || 'Productivity User',
          tagline: meta.user.tagline || 'Simple Focus',
          avatar_url: meta.user.avatar || null,
          intention: meta.intention,
          settings: meta.settings,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'id' }
      );

      return true;
    } catch (err) {
      console.warn('Sync push error:', err);
      return false;
    }
  }

  /**
   * Complete Bidirectional Sync Cycle
   */
  async syncAll(userId: string): Promise<void> {
    if (!navigator.onLine) {
      this.setStatus('offline');
      return;
    }

    if (!isSupabaseConfigured() || !userId) {
      this.setStatus('idle');
      return;
    }

    this.setStatus('syncing');

    try {
      await this.pullRemoteChanges(userId);
      const success = await this.pushLocalChanges(userId);
      this.setStatus(success ? 'synced' : 'error');
    } catch {
      this.setStatus('error');
    }
  }

  /**
   * Debounced sync trigger for live user interactions
   */
  triggerDebouncedSync(userId: string, delayMs = 1500) {
    if (!isSupabaseConfigured() || !userId) return;

    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }

    this.syncTimer = setTimeout(() => {
      this.syncAll(userId);
    }, delayMs);
  }
}

export const syncEngine = new SyncEngine();
