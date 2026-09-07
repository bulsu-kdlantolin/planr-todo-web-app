export type PriorityLevel = 'urgent' | 'high' | 'medium' | 'low';

export type TaskCategory =
  | 'Work'
  | 'Design'
  | 'Personal'
  | 'Mindful'
  | 'Health'
  | (string & {});

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: PriorityLevel;
  dueDate?: string; // YYYY-MM-DD
  completed: boolean;
  completedAt?: string; // ISO string when completed
  estimatedPomodoros: number;
  completedPomodoros: number;
  subtasks: Subtask[];
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
  revision?: number;
  repeat?: Recurrence;
  recurrenceConfig?: RecurrenceConfig;
  recurringSeriesId?: string;
  spawnedNextTaskId?: string;
}

export type DaySegment = 'Morning' | 'Afternoon' | 'Evening' | 'Night';
export type Recurrence = 'Once' | 'Daily' | 'Weekdays' | 'Weekly' | 'Monthly' | 'Yearly' | 'Custom';

export interface RecurrenceConfig {
  frequency: Recurrence;
  interval?: number;
  intervalUnit?: 'days' | 'weeks' | 'months';
  weekdays?: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  endDate?: string; // YYYY-MM-DD
}

export type ReminderSound = 'chime' | 'bell' | 'marimba' | 'beep' | 'harp';

export interface Reminder {
  id: string;
  title: string;
  time: string; // HH:MM
  period: DaySegment;
  repeat: Recurrence;
  scheduledDate?: string; // YYYY-MM-DD for non-recurring or specific date
  sound: boolean;
  soundOption?: ReminderSound;
  active: boolean;
  completed: boolean;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  revision?: number;
}

export interface FocusSession {
  id: string;
  taskId?: string | null;
  taskTitle: string;
  durationMinutes: number;
  completedAt: string;
  type: 'focus' | 'break';
  breakPreset?: 'short' | 'long';
}

export interface UserProfile {
  name: string;
  title: string;
  tagline: string;
  email: string;
  avatar?: string;
  isLoggedIn: boolean;
}

export type ThemeMode = 'light' | 'dark';
export type TimeFormat = '12h' | '24h';

export interface AppSettings {
  theme: ThemeMode;
  timeFormat: TimeFormat;
  soundEffects: boolean;
  soundVolume: number;
  focusDuration: number;
  deepFocusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  autoStartBreaks: boolean;
  notificationsEnabled: boolean;
  shortcuts?: {
    newTask?: string;
    toggleFullScreen?: string;
    dailyView?: string;
    tasksView?: string;
    remindersView?: string;
    focusView?: string;
    shortcutsModal?: string;
  };
}

export type ViewType =
  | 'landing'
  | 'signin'
  | 'signup'
  | 'onboarding'
  | 'daily'
  | 'tasks'
  | 'reminders'
  | 'focus'
  | 'settings'
  | 'reset-password';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  actionText?: string;
  onAction?: () => void;
  duration?: number;
}

export interface AppMetaEntries {
  user: UserProfile;
  settings: AppSettings;
  intention: string;
  is_seeded: boolean;
}

export type MetaKey = keyof AppMetaEntries;

export type TaskFilterType = 'all' | 'today' | 'upcoming' | 'high' | 'work' | 'personal' | 'mindful' | 'completed';
export type TaskSortType = 'dueDate' | 'priority' | 'created' | 'title';

/**
 * Discriminated union for resilient async data lifecycle states
 */
export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

/**
 * Abstract Sync Provider Interface for cloud sync adapters
 */
export interface ISyncProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  pullChanges(lastSyncTimestamp: string): Promise<{ tasks: Task[]; reminders: Reminder[] }>;
  pushChanges(changes: { tasks: Task[]; reminders: Reminder[] }): Promise<boolean>;
}
