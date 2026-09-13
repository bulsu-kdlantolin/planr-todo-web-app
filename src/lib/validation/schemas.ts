import { z } from 'zod';

export const SubtaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(300),
  completed: z.boolean().default(false)
});

export const RecurrenceConfigSchema = z.object({
  frequency: z.enum(['Once', 'Daily', 'Weekdays', 'Weekly', 'Monthly', 'Yearly', 'Custom']),
  interval: z.number().int().positive().optional(),
  intervalUnit: z.enum(['days', 'weeks', 'months']).optional(),
  weekdays: z.array(z.number().min(0).max(6)).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

export const TaskInputSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').max(500, 'Title is too long'),
  description: z.string().max(4000).optional(),
  category: z.string().min(1).max(50).default('Personal'),
  priority: z.enum(['urgent', 'high', 'medium', 'low']).default('medium'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  completed: z.boolean().default(false),
  estimatedPomodoros: z.number().int().min(0).max(100).default(1),
  completedPomodoros: z.number().int().min(0).max(100).default(0),
  subtasks: z.array(SubtaskSchema).default([]),
  repeat: z.enum(['Once', 'Daily', 'Weekdays', 'Weekly', 'Monthly', 'Yearly', 'Custom']).default('Once'),
  recurrenceConfig: RecurrenceConfigSchema.optional(),
  recurringSeriesId: z.string().optional(),
  spawnedNextTaskId: z.string().optional()
});

export const ReminderInputSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').max(500),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  period: z.enum(['Morning', 'Afternoon', 'Evening', 'Night']).default('Morning'),
  repeat: z.enum(['Once', 'Daily', 'Weekdays', 'Weekly', 'Monthly', 'Yearly', 'Custom']).default('Once'),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  sound: z.boolean().default(true),
  soundOption: z.enum(['chime', 'bell', 'marimba', 'beep', 'harp']).default('chime'),
  active: z.boolean().default(true),
  completed: z.boolean().default(false),
  description: z.string().max(2000).optional(),
  taskId: z.string().optional()
});

export const SettingsInputSchema = z.object({
  theme: z.enum(['light', 'dark']).default('light'),
  timeFormat: z.enum(['12h', '24h']).default('12h'),
  soundEffects: z.boolean().default(true),
  soundVolume: z.number().min(0).max(1).default(0.5),
  focusDuration: z.number().int().min(1).max(180).default(25),
  deepFocusDuration: z.number().int().min(1).max(240).default(50),
  shortBreakDuration: z.number().int().min(1).max(60).default(5),
  longBreakDuration: z.number().int().min(1).max(120).default(15),
  autoStartBreaks: z.boolean().default(false),
  notificationsEnabled: z.boolean().default(true),
  shortcuts: z.record(z.string(), z.string()).default({})
});

export type ValidatedTaskInput = z.infer<typeof TaskInputSchema>;
export type ValidatedReminderInput = z.infer<typeof ReminderInputSchema>;
export type ValidatedSettingsInput = z.infer<typeof SettingsInputSchema>;
