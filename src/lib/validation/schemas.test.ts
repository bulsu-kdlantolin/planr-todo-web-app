import { describe, it, expect } from 'vitest';
import { TaskInputSchema, ReminderInputSchema, SettingsInputSchema } from './schemas';

describe('Runtime Validation Schemas (Zod)', () => {
  it('validates a valid task input', () => {
    const validTask = {
      title: 'Review quarterly goals',
      category: 'Work',
      priority: 'high',
      dueDate: '2026-09-15',
      estimatedPomodoros: 2,
      subtasks: [{ id: 'sub-1', title: 'Prepare slide deck', completed: false }]
    };

    const result = TaskInputSchema.safeParse(validTask);
    expect(result.success).toBe(true);
  });

  it('rejects an empty task title', () => {
    const invalidTask = {
      title: '',
      priority: 'low'
    };

    const result = TaskInputSchema.safeParse(invalidTask);
    expect(result.success).toBe(false);
  });

  it('validates a valid reminder input', () => {
    const validReminder = {
      title: 'Take daily medication',
      time: '08:30',
      period: 'Morning',
      repeat: 'Daily',
      sound: true
    };

    const result = ReminderInputSchema.safeParse(validReminder);
    expect(result.success).toBe(true);
  });

  it('rejects an invalid reminder time format', () => {
    const invalidReminder = {
      title: 'Meeting',
      time: '25:99'
    };

    const result = ReminderInputSchema.safeParse(invalidReminder);
    expect(result.success).toBe(false);
  });

  it('validates settings and enforces limits', () => {
    const validSettings = {
      theme: 'dark',
      timeFormat: '24h',
      soundVolume: 0.8,
      focusDuration: 30
    };

    const result = SettingsInputSchema.safeParse(validSettings);
    expect(result.success).toBe(true);
  });

  it('rejects invalid soundVolume outside range', () => {
    const invalidSettings = {
      soundVolume: 2.5
    };

    const result = SettingsInputSchema.safeParse(invalidSettings);
    expect(result.success).toBe(false);
  });
});
