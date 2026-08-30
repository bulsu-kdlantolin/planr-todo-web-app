import { describe, it, expect } from 'vitest';
import {
  priorityToInt,
  intToPriority,
  taskToSupabaseRow,
  supabaseRowToTask,
  reminderToSupabaseRow,
  supabaseRowToReminder,
  focusSessionToSupabaseRow,
  supabaseRowToFocusSession,
  SupabaseTaskRow,
  SupabaseReminderRow,
  SupabaseFocusSessionRow
} from './syncEngine';
import { Task, Reminder, FocusSession } from '../../types';

describe('Supabase Sync Engine Mapping', () => {
  it('converts priority string to int and back correctly', () => {
    expect(priorityToInt('urgent')).toBe(4);
    expect(priorityToInt('high')).toBe(3);
    expect(priorityToInt('medium')).toBe(2);
    expect(priorityToInt('low')).toBe(1);

    expect(intToPriority(4)).toBe('urgent');
    expect(intToPriority(3)).toBe('high');
    expect(intToPriority(2)).toBe('medium');
    expect(intToPriority(1)).toBe('low');
  });

  it('converts local Task to SupabaseTaskRow correctly', () => {
    const task: Task = {
      id: 'task-123',
      title: 'Design high-converting landing page',
      description: 'Use calm typography and modern tokens',
      category: 'Design',
      priority: 'high',
      dueDate: '2026-08-30',
      completed: true,
      completedAt: '2026-08-30T10:00:00.000Z',
      estimatedPomodoros: 3,
      completedPomodoros: 2,
      subtasks: [{ id: 'sub-1', title: 'Typography', completed: true }],
      createdAt: '2026-08-29T12:00:00.000Z',
      updatedAt: '2026-08-30T10:00:00.000Z'
    };

    const row = taskToSupabaseRow(task, 'user-abc-456');

    expect(row.id).toBe('task-123');
    expect(row.user_id).toBe('user-abc-456');
    expect(row.title).toBe('Design high-converting landing page');
    expect(row.priority).toBe(3);
    expect(row.is_completed).toBe(true);
    expect(row.completed_at).toBe('2026-08-30T10:00:00.000Z');
    expect(row.category).toBe('Design');
  });

  it('converts SupabaseTaskRow back to local Task format correctly', () => {
    const row: SupabaseTaskRow = {
      id: 'task-789',
      user_id: 'user-abc-456',
      title: 'Refactor database storage layer',
      description: 'PostgreSQL with local IndexedDB sync',
      due_date: '2026-09-01',
      priority: 4,
      duration_minutes: 50,
      is_completed: false,
      completed_at: null,
      subtasks: [{ id: 'sub-2', title: 'Write RLS rules', completed: false }],
      category: 'Work',
      created_at: '2026-08-30T08:00:00.000Z',
      updated_at: '2026-08-30T09:00:00.000Z'
    };

    const task = supabaseRowToTask(row);

    expect(task.id).toBe('task-789');
    expect(task.title).toBe('Refactor database storage layer');
    expect(task.priority).toBe('urgent');
    expect(task.dueDate).toBe('2026-09-01');
    expect(task.completed).toBe(false);
    expect(task.estimatedPomodoros).toBe(2);
    expect(task.subtasks.length).toBe(1);
  });

  it('converts Reminder to SupabaseReminderRow and back', () => {
    const reminder: Reminder = {
      id: 'rem-101',
      title: 'Midday breathwork break',
      time: '12:30',
      period: 'Afternoon',
      repeat: 'Daily',
      scheduledDate: '2026-08-30',
      sound: true,
      active: true,
      completed: false,
      description: 'Reset mental clarity'
    };

    const row = reminderToSupabaseRow(reminder, 'user-abc-456');
    expect(row.id).toBe('rem-101');
    expect(row.user_id).toBe('user-abc-456');
    expect(row.time).toBe('12:30');
    expect(row.repeat).toBe('Daily');

    const mappedBack = supabaseRowToReminder(row);
    expect(mappedBack.id).toBe('rem-101');
    expect(mappedBack.title).toBe('Midday breathwork break');
    expect(mappedBack.time).toBe('12:30');
    expect(mappedBack.period).toBe('Afternoon');
  });

  it('converts FocusSession to SupabaseFocusSessionRow and back', () => {
    const session: FocusSession = {
      id: 'sess-202',
      taskId: 'task-123',
      taskTitle: 'Design Sprint',
      durationMinutes: 50,
      completedAt: '2026-08-30T11:00:00.000Z',
      type: 'focus'
    };

    const row = focusSessionToSupabaseRow(session, 'user-abc-456');
    expect(row.id).toBe('sess-202');
    expect(row.duration_minutes).toBe(50);
    expect(row.task_title).toBe('Design Sprint');

    const mappedBack = supabaseRowToFocusSession(row);
    expect(mappedBack.id).toBe('sess-202');
    expect(mappedBack.taskTitle).toBe('Design Sprint');
    expect(mappedBack.durationMinutes).toBe(50);
  });
});
