import { describe, it, expect, vi } from 'vitest';
import { mapDbRowToTask, mapTaskToDbRow, DbTaskRow } from './tasks';
import { Task } from '../../types';

describe('Supabase Tasks Repository', () => {
  it('maps Supabase DB row to application Task correctly', () => {
    const dbRow: DbTaskRow = {
      id: 'task-123',
      user_id: 'user-uuid-1',
      title: 'Complete high priority project',
      description: 'Ship to production',
      due_date: '2026-08-31',
      priority: 4, // urgent
      duration_minutes: 50,
      estimated_pomodoros: 2,
      revision: 3,
      is_completed: true,
      completed_at: '2026-08-31T09:00:00.000Z',
      subtasks: [{ id: 'sub-1', title: 'Subtask 1', completed: true }],
      category: 'Work',
      tags: ['release', 'v1'],
      created_at: '2026-08-30T08:00:00.000Z',
      updated_at: '2026-08-31T09:00:00.000Z',
      deleted_at: null
    };

    const task = mapDbRowToTask(dbRow);

    expect(task.id).toBe('task-123');
    expect(task.title).toBe('Complete high priority project');
    expect(task.priority).toBe('urgent');
    expect(task.completed).toBe(true);
    expect(task.dueDate).toBe('2026-08-31');
    expect(task.estimatedPomodoros).toBe(2);
    expect(task.subtasks).toHaveLength(1);
  });

  it('maps application Task to Supabase DB row correctly', () => {
    const task: Task = {
      id: 'task-456',
      title: 'Design review',
      description: 'Check tokens',
      category: 'Design',
      priority: 'high',
      dueDate: '2026-09-01',
      completed: false,
      estimatedPomodoros: 1,
      completedPomodoros: 0,
      subtasks: [],
      revision: 1,
      createdAt: '2026-08-31T00:00:00.000Z',
      updatedAt: '2026-08-31T00:00:00.000Z',
      deletedAt: null
    };

    const dbRow = mapTaskToDbRow(task, 'user-uuid-99');

    expect(dbRow.id).toBe('task-456');
    expect(dbRow.user_id).toBe('user-uuid-99');
    expect(dbRow.priority).toBe(3); // high = 3
    expect(dbRow.is_completed).toBe(false);
    expect(dbRow.revision).toBe(2);
  });
});
