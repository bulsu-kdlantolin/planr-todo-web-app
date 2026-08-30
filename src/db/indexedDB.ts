import { openDB, DBSchema, IDBPDatabase } from 'idb';
import {
  Task,
  Reminder,
  FocusSession,
  UserProfile,
  AppSettings,
  AppMetaEntries,
  MetaKey
} from '../types';
import { validateBackupJSON } from '../utils/validation';

export const INITIAL_USER: UserProfile = {
  name: "",
  title: "",
  tagline: "",
  email: "",
  isLoggedIn: false
};

export const INITIAL_INTENTION = "Focus on what truly moves the needle today.";

export const INITIAL_SETTINGS: AppSettings = {
  theme: "light",
  timeFormat: "12h",
  soundEffects: true,
  soundVolume: 0.5,
  focusDuration: 25,
  deepFocusDuration: 50,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  autoStartBreaks: false,
  notificationsEnabled: false
};

export const INITIAL_TASKS: Task[] = [];
export const INITIAL_REMINDERS: Reminder[] = [];
export const INITIAL_SESSIONS: FocusSession[] = [];

export interface PlanrDBSchema extends DBSchema {
  tasks: {
    key: string;
    value: Task;
    indexes: {
      'by-dueDate': string;
      'by-category': string;
      'by-priority': string;
      'by-completed': number;
    };
  };
  reminders: {
    key: string;
    value: Reminder;
    indexes: {
      'by-period': string;
      'by-completed': number;
    };
  };
  focusSessions: {
    key: string;
    value: FocusSession;
    indexes: {
      'by-completedAt': string;
      'by-taskId': string;
    };
  };
  meta: {
    key: MetaKey;
    value: { key: MetaKey; value: any };
  };
}

const DB_NAME = 'PlanrDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<PlanrDBSchema>> | null = null;
let isInMemoryFallback = false;

// In-Memory Fallback State (used if IndexedDB is blocked or in private mode)
const memoryStore = {
  tasks: new Map<string, Task>(),
  reminders: new Map<string, Reminder>(),
  focusSessions: new Map<string, FocusSession>(),
  meta: new Map<string, any>()
};

export async function getDB(): Promise<IDBPDatabase<PlanrDBSchema> | null> {
  if (isInMemoryFallback) return null;

  if (!dbPromise) {
    try {
      if (typeof window === 'undefined' || !window.indexedDB) {
        throw new Error('IndexedDB not available');
      }

      dbPromise = openDB<PlanrDBSchema>(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion) {
          if (oldVersion < 1) {
            if (!db.objectStoreNames.contains('tasks')) {
              const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
              taskStore.createIndex('by-dueDate', 'dueDate');
              taskStore.createIndex('by-category', 'category');
              taskStore.createIndex('by-priority', 'priority');
              taskStore.createIndex('by-completed', 'completed');
            }

            if (!db.objectStoreNames.contains('reminders')) {
              const remStore = db.createObjectStore('reminders', { keyPath: 'id' });
              remStore.createIndex('by-period', 'period');
              remStore.createIndex('by-completed', 'completed');
            }

            if (!db.objectStoreNames.contains('focusSessions')) {
              const focusStore = db.createObjectStore('focusSessions', { keyPath: 'id' });
              focusStore.createIndex('by-completedAt', 'completedAt');
              focusStore.createIndex('by-taskId', 'taskId');
            }

            if (!db.objectStoreNames.contains('meta')) {
              db.createObjectStore('meta', { keyPath: 'key' });
            }
          }
        },
        blocked() {
          console.warn('PlanrDB open request was blocked by another tab.');
        },
        blocking() {
          console.warn('PlanrDB is blocking a version change request.');
        },
        terminated() {
          console.warn('PlanrDB connection was unexpectedly terminated.');
          dbPromise = null;
        }
      });
    } catch (err) {
      console.warn('IndexedDB unavailable or blocked. Activating in-memory storage fallback.', err);
      isInMemoryFallback = true;
      return null;
    }
  }

  try {
    return await dbPromise;
  } catch (err) {
    console.warn('Failed to resolve IndexedDB connection. Using in-memory fallback.', err);
    isInMemoryFallback = true;
    return null;
  }
}

export async function initDatabase(): Promise<{
  tasks: Task[];
  reminders: Reminder[];
  focusSessions: FocusSession[];
  user: UserProfile;
  settings: AppSettings;
  intention: string;
}> {
  const db = await getDB();

  if (!db) {
    // Memory storage initialization
    if (memoryStore.tasks.size === 0) {
      INITIAL_TASKS.forEach(t => memoryStore.tasks.set(t.id, t));
      INITIAL_REMINDERS.forEach(r => memoryStore.reminders.set(r.id, r));
      INITIAL_SESSIONS.forEach(s => memoryStore.focusSessions.set(s.id, s));
      memoryStore.meta.set('user', INITIAL_USER);
      memoryStore.meta.set('settings', INITIAL_SETTINGS);
      memoryStore.meta.set('intention', INITIAL_INTENTION);
    }
    return {
      tasks: Array.from(memoryStore.tasks.values()),
      reminders: Array.from(memoryStore.reminders.values()),
      focusSessions: Array.from(memoryStore.focusSessions.values()),
      user: memoryStore.meta.get('user') || INITIAL_USER,
      settings: memoryStore.meta.get('settings') || INITIAL_SETTINGS,
      intention: memoryStore.meta.get('intention') || INITIAL_INTENTION
    };
  }

  const seeded = await db.get('meta', 'is_seeded');

  if (!seeded) {
    const tx = db.transaction(['tasks', 'reminders', 'focusSessions', 'meta'], 'readwrite');
    await Promise.all([
      ...INITIAL_TASKS.map(t => tx.objectStore('tasks').put(t)),
      ...INITIAL_REMINDERS.map(r => tx.objectStore('reminders').put(r)),
      ...INITIAL_SESSIONS.map(s => tx.objectStore('focusSessions').put(s)),
      tx.objectStore('meta').put({ key: 'user', value: INITIAL_USER }),
      tx.objectStore('meta').put({ key: 'settings', value: INITIAL_SETTINGS }),
      tx.objectStore('meta').put({ key: 'intention', value: INITIAL_INTENTION }),
      tx.objectStore('meta').put({ key: 'is_seeded', value: true }),
      tx.done
    ]);
  }

  const [tasks, reminders, focusSessions, userMeta, settingsMeta, intentionMeta] = await Promise.all([
    db.getAll('tasks'),
    db.getAll('reminders'),
    db.getAll('focusSessions'),
    db.get('meta', 'user'),
    db.get('meta', 'settings'),
    db.get('meta', 'intention')
  ]);

  return {
    tasks: tasks.length > 0 ? tasks : INITIAL_TASKS,
    reminders: reminders.length > 0 ? reminders : INITIAL_REMINDERS,
    focusSessions: focusSessions.length > 0 ? focusSessions : INITIAL_SESSIONS,
    user: userMeta ? userMeta.value : INITIAL_USER,
    settings: settingsMeta ? settingsMeta.value : INITIAL_SETTINGS,
    intention: intentionMeta ? intentionMeta.value : INITIAL_INTENTION
  };
}

// Tasks Operations
export async function dbPutTask(task: Task): Promise<void> {
  const taskToSave: Task = {
    ...task,
    updatedAt: new Date().toISOString()
  };

  const db = await getDB();
  if (!db) {
    memoryStore.tasks.set(taskToSave.id, taskToSave);
    return;
  }
  await db.put('tasks', taskToSave);
}

export async function dbDeleteTask(id: string): Promise<void> {
  const db = await getDB();
  if (!db) {
    memoryStore.tasks.delete(id);
    return;
  }
  await db.delete('tasks', id);
}

export async function dbGetAllTasks(): Promise<Task[]> {
  const db = await getDB();
  if (!db) {
    return Array.from(memoryStore.tasks.values());
  }
  return db.getAll('tasks');
}

export async function dbGetTasksByDueDate(dueDate: string): Promise<Task[]> {
  const db = await getDB();
  if (!db) {
    return Array.from(memoryStore.tasks.values()).filter(t => t.dueDate === dueDate);
  }
  return db.getAllFromIndex('tasks', 'by-dueDate', dueDate);
}

export async function dbGetTasksByCategory(category: string): Promise<Task[]> {
  const db = await getDB();
  if (!db) {
    return Array.from(memoryStore.tasks.values()).filter(t => t.category === category);
  }
  return db.getAllFromIndex('tasks', 'by-category', category);
}

// Reminders Operations
export async function dbPutReminder(reminder: Reminder): Promise<void> {
  const db = await getDB();
  if (!db) {
    memoryStore.reminders.set(reminder.id, reminder);
    return;
  }
  await db.put('reminders', reminder);
}

export async function dbDeleteReminder(id: string): Promise<void> {
  const db = await getDB();
  if (!db) {
    memoryStore.reminders.delete(id);
    return;
  }
  await db.delete('reminders', id);
}

export async function dbGetRemindersByPeriod(period: string): Promise<Reminder[]> {
  const db = await getDB();
  if (!db) {
    return Array.from(memoryStore.reminders.values()).filter(r => r.period === period);
  }
  return db.getAllFromIndex('reminders', 'by-period', period as any);
}

export async function dbPutTasksBatch(tasks: Task[]): Promise<void> {
  if (tasks.length === 0) return;
  const db = await getDB();
  if (!db) {
    tasks.forEach((t) => memoryStore.tasks.set(t.id, t));
    return;
  }
  const tx = db.transaction('tasks', 'readwrite');
  for (const task of tasks) {
    tx.store.put(task);
  }
  await tx.done;
}

export async function dbPutRemindersBatch(reminders: Reminder[]): Promise<void> {
  if (reminders.length === 0) return;
  const db = await getDB();
  if (!db) {
    reminders.forEach((r) => memoryStore.reminders.set(r.id, r));
    return;
  }
  const tx = db.transaction('reminders', 'readwrite');
  for (const reminder of reminders) {
    tx.store.put(reminder);
  }
  await tx.done;
}

export async function dbPutFocusSessionsBatch(sessions: FocusSession[]): Promise<void> {
  if (sessions.length === 0) return;
  const db = await getDB();
  if (!db) {
    sessions.forEach((s) => memoryStore.focusSessions.set(s.id, s));
    return;
  }
  const tx = db.transaction('focusSessions', 'readwrite');
  for (const session of sessions) {
    tx.store.put(session);
  }
  await tx.done;
}

// Focus Sessions Operations
export async function dbPutFocusSession(session: FocusSession): Promise<void> {
  const db = await getDB();
  if (!db) {
    memoryStore.focusSessions.set(session.id, session);
    return;
  }
  await db.put('focusSessions', session);
}

export async function dbGetAllReminders(): Promise<Reminder[]> {
  const db = await getDB();
  if (!db) {
    return Array.from(memoryStore.reminders.values());
  }
  return db.getAll('reminders');
}

export async function dbGetAllFocusSessions(): Promise<FocusSession[]> {
  const db = await getDB();
  if (!db) {
    return Array.from(memoryStore.focusSessions.values());
  }
  return db.getAll('focusSessions');
}

export async function dbClearAllStores(): Promise<void> {
  const db = await getDB();
  memoryStore.tasks.clear();
  memoryStore.reminders.clear();
  memoryStore.focusSessions.clear();
  if (db) {
    await Promise.all([
      db.clear('tasks'),
      db.clear('reminders'),
      db.clear('focusSessions')
    ]);
  }
}

export async function dbGetFocusSessionsByTask(taskId: string): Promise<FocusSession[]> {
  const db = await getDB();
  if (!db) {
    return Array.from(memoryStore.focusSessions.values()).filter(s => s.taskId === taskId);
  }
  return db.getAllFromIndex('focusSessions', 'by-taskId', taskId);
}

// Meta Store Operations
export async function dbPutMeta<K extends MetaKey>(
  key: K,
  value: AppMetaEntries[K]
): Promise<void> {
  const db = await getDB();
  if (!db) {
    memoryStore.meta.set(key, value);
    return;
  }
  await db.put('meta', { key, value });
}

export async function dbGetMeta<K extends MetaKey>(
  key: K
): Promise<AppMetaEntries[K] | null> {
  const db = await getDB();
  if (!db) {
    return (memoryStore.meta.get(key) as AppMetaEntries[K]) || null;
  }
  const row = await db.get('meta', key);
  return row ? (row.value as AppMetaEntries[K]) : null;
}

// JSON Backup & Restore Operations
export async function dbExportJSON(): Promise<string> {
  const db = await getDB();

  if (!db) {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      tasks: Array.from(memoryStore.tasks.values()),
      reminders: Array.from(memoryStore.reminders.values()),
      focusSessions: Array.from(memoryStore.focusSessions.values()),
      user: memoryStore.meta.get('user') || INITIAL_USER,
      settings: memoryStore.meta.get('settings') || INITIAL_SETTINGS,
      intention: memoryStore.meta.get('intention') || INITIAL_INTENTION
    };
    return JSON.stringify(payload, null, 2);
  }

  const [tasks, reminders, focusSessions, user, settings, intention] = await Promise.all([
    db.getAll('tasks'),
    db.getAll('reminders'),
    db.getAll('focusSessions'),
    db.get('meta', 'user'),
    db.get('meta', 'settings'),
    db.get('meta', 'intention')
  ]);

  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    tasks,
    reminders,
    focusSessions,
    user: user?.value || INITIAL_USER,
    settings: settings?.value || INITIAL_SETTINGS,
    intention: intention?.value || INITIAL_INTENTION
  };

  return JSON.stringify(payload, null, 2);
}

export async function dbImportJSON(jsonInput: string | object): Promise<{ success: boolean; error?: string }> {
  const jsonString = typeof jsonInput === 'string' ? jsonInput : JSON.stringify(jsonInput);
  const validation = validateBackupJSON(jsonString);
  if (!validation.success) {
    return { success: false, error: validation.error };
  }

  const parsed = validation.data;
  const db = await getDB();

  if (!db) {
    memoryStore.tasks.clear();
    memoryStore.reminders.clear();
    memoryStore.focusSessions.clear();
    parsed.tasks.forEach(t => memoryStore.tasks.set(t.id, t));
    parsed.reminders.forEach(r => memoryStore.reminders.set(r.id, r));
    parsed.focusSessions.forEach(s => memoryStore.focusSessions.set(s.id, s));
    memoryStore.meta.set('user', parsed.user);
    memoryStore.meta.set('settings', parsed.settings);
    memoryStore.meta.set('intention', parsed.intention);
    return { success: true };
  }

  try {
    const tx = db.transaction(['tasks', 'reminders', 'focusSessions', 'meta'], 'readwrite');
    await tx.objectStore('tasks').clear();
    await tx.objectStore('reminders').clear();
    await tx.objectStore('focusSessions').clear();

    await Promise.all([
      ...parsed.tasks.map(t => tx.objectStore('tasks').put(t)),
      ...parsed.reminders.map(r => tx.objectStore('reminders').put(r)),
      ...parsed.focusSessions.map(s => tx.objectStore('focusSessions').put(s)),
      tx.objectStore('meta').put({ key: 'user', value: parsed.user }),
      tx.objectStore('meta').put({ key: 'settings', value: parsed.settings }),
      tx.objectStore('meta').put({ key: 'intention', value: parsed.intention }),
      tx.done
    ]);

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database transaction error';
    return { success: false, error: message };
  }
}

export async function dbResetToDefaults(): Promise<void> {
  const db = await getDB();
  if (!db) {
    memoryStore.tasks.clear();
    memoryStore.reminders.clear();
    memoryStore.focusSessions.clear();
    INITIAL_TASKS.forEach(t => memoryStore.tasks.set(t.id, t));
    INITIAL_REMINDERS.forEach(r => memoryStore.reminders.set(r.id, r));
    INITIAL_SESSIONS.forEach(s => memoryStore.focusSessions.set(s.id, s));
    memoryStore.meta.set('user', INITIAL_USER);
    memoryStore.meta.set('settings', INITIAL_SETTINGS);
    memoryStore.meta.set('intention', INITIAL_INTENTION);
    return;
  }

  const tx = db.transaction(['tasks', 'reminders', 'focusSessions', 'meta'], 'readwrite');
  await tx.objectStore('tasks').clear();
  await tx.objectStore('reminders').clear();
  await tx.objectStore('focusSessions').clear();

  await Promise.all([
    ...INITIAL_TASKS.map(t => tx.objectStore('tasks').put(t)),
    ...INITIAL_REMINDERS.map(r => tx.objectStore('reminders').put(r)),
    ...INITIAL_SESSIONS.map(s => tx.objectStore('focusSessions').put(s)),
    tx.objectStore('meta').put({ key: 'user', value: INITIAL_USER }),
    tx.objectStore('meta').put({ key: 'settings', value: INITIAL_SETTINGS }),
    tx.objectStore('meta').put({ key: 'intention', value: INITIAL_INTENTION }),
    tx.objectStore('meta').put({ key: 'is_seeded', value: true }),
    tx.done
  ]);
}
