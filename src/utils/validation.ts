import { Task, Reminder, FocusSession, UserProfile, AppSettings } from '../types';

export interface ValidatedBackupPayload {
  version: number;
  exportedAt: string;
  tasks: Task[];
  reminders: Reminder[];
  focusSessions: FocusSession[];
  user: UserProfile;
  settings: AppSettings;
  intention: string;
}

export function validateBackupJSON(rawString: string): { success: true; data: ValidatedBackupPayload } | { success: false; error: string } {
  try {
    const obj = JSON.parse(rawString);
    if (!obj || typeof obj !== 'object') {
      return { success: false, error: 'Backup payload must be a valid JSON object.' };
    }

    if (!Array.isArray(obj.tasks)) {
      return { success: false, error: 'Malformed backup: "tasks" array is missing or invalid.' };
    }

    // Validate tasks structure & sanitize bounds
    for (const t of obj.tasks) {
      if (!t.id || typeof t.title !== 'string' || typeof t.completed !== 'boolean') {
        return { success: false, error: 'Malformed task entity found in backup payload.' };
      }
      if (t.title.length > 500) {
        t.title = t.title.slice(0, 500);
      }
      if (t.description && typeof t.description === 'string' && t.description.length > 5000) {
        t.description = t.description.slice(0, 5000);
      }
    }

    if (!Array.isArray(obj.reminders)) {
      return { success: false, error: 'Malformed backup: "reminders" array is missing or invalid.' };
    }

    if (!Array.isArray(obj.focusSessions)) {
      return { success: false, error: 'Malformed backup: "focusSessions" array is missing or invalid.' };
    }

    const payload: ValidatedBackupPayload = {
      version: typeof obj.version === 'number' ? obj.version : 1,
      exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : new Date().toISOString(),
      tasks: obj.tasks,
      reminders: obj.reminders,
      focusSessions: obj.focusSessions,
      user: obj.user && typeof obj.user === 'object' && obj.user.name ? obj.user : {
        name: 'Alex Morgan',
        title: 'Quiet Confidence',
        tagline: 'Intentional Living',
        email: 'alex@planr.lifestyle',
        isLoggedIn: true
      },
      settings: obj.settings && typeof obj.settings === 'object' ? obj.settings : {
        theme: 'light',
        soundEffects: true,
        soundVolume: 0.5,
        focusDuration: 25,
        deepFocusDuration: 50,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        autoStartBreaks: false,
        notificationsEnabled: false
      },
      intention: typeof obj.intention === 'string' ? obj.intention : 'Move through the day with stillness, clarity, and deep focus.'
    };

    return { success: true, data: payload };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid JSON syntax';
    return { success: false, error: message };
  }
}
