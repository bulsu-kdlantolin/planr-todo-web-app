import { describe, it, expect, beforeEach } from 'vitest';
import {
  initDatabase,
  dbPutTask,
  dbDeleteTask,
  dbGetTasksByDueDate,
  dbGetTasksByCategory,
  dbPutReminder,
  dbDeleteReminder,
  dbGetRemindersByPeriod,
  dbPutFocusSession,
  dbGetFocusSessionsByTask,
  dbPutMeta,
  dbGetMeta,
  dbExportJSON,
  dbImportJSON,
  dbResetToDefaults,
  INITIAL_USER
} from './indexedDB';
import { Task, Reminder, FocusSession } from '../types';

describe('IndexedDB Persistence Layer', () => {
  beforeEach(async () => {
    await dbResetToDefaults();
  });

  it('initializes database with clean unauthenticated state', async () => {
    const data = await initDatabase();
    expect(Array.isArray(data.tasks)).toBe(true);
    expect(Array.isArray(data.reminders)).toBe(true);
    expect(data.user.isLoggedIn).toBe(false);
    expect(data.settings.theme).toBe('light');
    expect(data.intention).toBeDefined();
  });

  it('creates, updates, and deletes a task', async () => {
    const newTask: Task = {
      id: 'test-task-1',
      title: 'Automated test task',
      category: 'Work',
      priority: 'urgent',
      dueDate: '2026-08-30',
      completed: false,
      estimatedPomodoros: 2,
      completedPomodoros: 0,
      subtasks: [{ id: 'sub-1', title: 'Write tests', completed: false }],
      createdAt: new Date().toISOString()
    };

    await dbPutTask(newTask);

    const byDate = await dbGetTasksByDueDate('2026-08-30');
    expect(byDate.some(t => t.id === 'test-task-1')).toBe(true);

    const byCat = await dbGetTasksByCategory('Work');
    expect(byCat.some(t => t.id === 'test-task-1')).toBe(true);

    // Update task
    const updated = { ...newTask, completed: true };
    await dbPutTask(updated);

    const byCatUpdated = await dbGetTasksByCategory('Work');
    const target = byCatUpdated.find(t => t.id === 'test-task-1');
    expect(target?.completed).toBe(true);

    // Delete task
    await dbDeleteTask('test-task-1');
    const afterDelete = await dbGetTasksByCategory('Work');
    expect(afterDelete.some(t => t.id === 'test-task-1')).toBe(false);
  });

  it('creates, filters, and deletes reminders', async () => {
    const reminder: Reminder = {
      id: 'test-rem-1',
      title: 'Afternoon stretch',
      time: '14:00',
      period: 'Afternoon',
      repeat: 'Daily',
      sound: true,
      active: true,
      completed: false
    };

    await dbPutReminder(reminder);

    const afternoonRems = await dbGetRemindersByPeriod('Afternoon');
    expect(afternoonRems.some(r => r.id === 'test-rem-1')).toBe(true);

    await dbDeleteReminder('test-rem-1');
    const afterDelete = await dbGetRemindersByPeriod('Afternoon');
    expect(afterDelete.some(r => r.id === 'test-rem-1')).toBe(false);
  });

  it('records and queries focus sessions', async () => {
    const session: FocusSession = {
      id: 'test-foc-1',
      taskId: 'test-task-1',
      taskTitle: 'Automated test task',
      durationMinutes: 25,
      completedAt: new Date().toISOString(),
      type: 'focus'
    };

    await dbPutFocusSession(session);

    const taskSessions = await dbGetFocusSessionsByTask('test-task-1');
    expect(taskSessions.length).toBeGreaterThan(0);
    expect(taskSessions[0].durationMinutes).toBe(25);
  });

  it('stores and retrieves metadata keys correctly', async () => {
    await dbPutMeta('intention', 'Create with calm clarity.');
    const intention = await dbGetMeta('intention');
    expect(intention).toBe('Create with calm clarity.');
  });

  it('exports and imports valid JSON backup archives', async () => {
    const testTask: Task = {
      id: 'json-task-1',
      title: 'JSON Test Task',
      category: 'Work',
      priority: 'high',
      completed: false,
      estimatedPomodoros: 1,
      completedPomodoros: 0,
      subtasks: [],
      createdAt: new Date().toISOString()
    };
    await dbPutTask(testTask);

    const jsonString = await dbExportJSON();
    expect(typeof jsonString).toBe('string');
    const parsed = JSON.parse(jsonString);
    expect(parsed.version).toBe(1);
    expect(Array.isArray(parsed.tasks)).toBe(true);

    // Modify and import back
    parsed.tasks[0].title = 'Imported Modified Title';
    const importSuccess = await dbImportJSON(parsed);
    expect(importSuccess.success).toBe(true);

    const reloaded = await initDatabase();
    expect(reloaded.tasks.some(t => t.title === 'Imported Modified Title')).toBe(true);
  });

  it('rejects malformed or corrupt JSON during import without data loss', async () => {
    const testTask: Task = {
      id: 'preserve-task',
      title: 'Keep this intact',
      category: 'Work',
      priority: 'high',
      completed: false,
      estimatedPomodoros: 1,
      completedPomodoros: 0,
      subtasks: [],
      createdAt: new Date().toISOString()
    };
    await dbPutTask(testTask);

    const corruptPayload = { random: 'garbage', version: 999 };
    const success = await dbImportJSON(corruptPayload);
    expect(success.success).toBe(false);

    // Verify existing data remains intact
    const data = await initDatabase();
    expect(data.tasks.some(t => t.id === 'preserve-task')).toBe(true);
  });
});
