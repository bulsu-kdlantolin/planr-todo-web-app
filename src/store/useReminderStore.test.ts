import { describe, it, expect, beforeEach } from 'vitest';
import { useReminderStore } from './useReminderStore';

describe('useReminderStore', () => {
  beforeEach(() => {
    useReminderStore.getState().setReminders([]);
  });

  it('adds a reminder with revision 1', async () => {
    const reminder = await useReminderStore.getState().addReminder({
      title: 'Hydration Break',
      time: '14:00',
      period: 'Afternoon',
      repeat: 'Daily',
      sound: true
    });

    expect(reminder.id).toBeDefined();
    expect(reminder.title).toBe('Hydration Break');
    expect(reminder.revision).toBe(1);
    expect(reminder.active).toBe(true);
    expect(useReminderStore.getState().reminders.length).toBe(1);
  });

  it('toggles reminder and increments revision', async () => {
    const reminder = await useReminderStore.getState().addReminder({
      title: 'Standup Meeting',
      time: '09:30',
      period: 'Morning',
      repeat: 'Weekdays',
      sound: true
    });

    const toggled = await useReminderStore.getState().toggleReminder(reminder.id);
    expect(toggled?.completed).toBe(true);
    expect(toggled?.revision).toBe(2);

    const activeAgain = await useReminderStore.getState().toggleReminder(reminder.id);
    expect(activeAgain?.completed).toBe(false);
    expect(activeAgain?.revision).toBe(3);
  });

  it('snoozes a reminder by 15 minutes and increments revision', async () => {
    const reminder = await useReminderStore.getState().addReminder({
      title: 'Take vitamin',
      time: '08:00',
      period: 'Morning',
      repeat: 'Daily',
      sound: true
    });

    const snoozed = await useReminderStore.getState().snoozeReminder(reminder.id, 15);
    expect(snoozed).not.toBeNull();
    expect(snoozed?.revision).toBe(2);
    expect(snoozed?.completed).toBe(false);
  });

  it('deletes and restores reminder', async () => {
    const reminder = await useReminderStore.getState().addReminder({
      title: 'Stretch break',
      time: '16:00',
      period: 'Afternoon',
      repeat: 'Daily',
      sound: true
    });

    const deleted = await useReminderStore.getState().deleteReminder(reminder.id);
    expect(deleted?.id).toBe(reminder.id);
    expect(useReminderStore.getState().reminders.length).toBe(0);

    if (deleted) {
      await useReminderStore.getState().restoreReminder(deleted);
      expect(useReminderStore.getState().reminders.length).toBe(1);
    }
  });

  it('updates a reminder and increments revision', async () => {
    const reminder = await useReminderStore.getState().addReminder({
      title: 'Water plants',
      time: '10:00',
      period: 'Morning',
      repeat: 'Daily',
      sound: true
    });

    const updated = await useReminderStore.getState().updateReminder(reminder.id, {
      title: 'Water indoor plants',
      time: '11:00',
      period: 'Morning',
      repeat: 'Weekly'
    });

    expect(updated).not.toBeNull();
    expect(updated?.title).toBe('Water indoor plants');
    expect(updated?.time).toBe('11:00');
    expect(updated?.repeat).toBe('Weekly');
    expect(updated?.revision).toBe(2);
    expect(useReminderStore.getState().reminders[0].title).toBe('Water indoor plants');
  });

  it('cascades deletion by taskId and fallback title', async () => {
    await useReminderStore.getState().addReminder({
      taskId: 'task-123',
      title: 'Review PR',
      time: '14:00',
      period: 'Afternoon',
      repeat: 'Once',
      sound: true
    });

    await useReminderStore.getState().addReminder({
      title: 'Legacy Reminder Without TaskId',
      time: '15:00',
      period: 'Afternoon',
      repeat: 'Once',
      sound: true
    });

    await useReminderStore.getState().addReminder({
      title: 'Unrelated Reminder',
      time: '16:00',
      period: 'Evening',
      repeat: 'Daily',
      sound: true
    });

    expect(useReminderStore.getState().reminders.length).toBe(3);

    // Delete by taskId
    const deletedByTaskId = await useReminderStore.getState().deleteRemindersByTaskId('task-123');
    expect(deletedByTaskId.length).toBe(1);
    expect(deletedByTaskId[0].title).toBe('Review PR');
    expect(useReminderStore.getState().reminders.length).toBe(2);

    // Delete by fallback title
    const deletedByTitle = await useReminderStore.getState().deleteRemindersByTaskId('random-id', 'Legacy Reminder Without TaskId');
    expect(deletedByTitle.length).toBe(1);
    expect(deletedByTitle[0].title).toBe('Legacy Reminder Without TaskId');
    expect(useReminderStore.getState().reminders.length).toBe(1);
    expect(useReminderStore.getState().reminders[0].title).toBe('Unrelated Reminder');
  });

  it('cascades deletion across task series by taskIds', async () => {
    await useReminderStore.getState().addReminder({
      taskId: 'series-task-1',
      title: 'Weekly Standup #1',
      time: '09:00',
      period: 'Morning',
      repeat: 'Weekly',
      sound: true
    });

    await useReminderStore.getState().addReminder({
      taskId: 'series-task-2',
      title: 'Weekly Standup #2',
      time: '09:00',
      period: 'Morning',
      repeat: 'Weekly',
      sound: true
    });

    await useReminderStore.getState().addReminder({
      taskId: 'standalone-task',
      title: 'Doctor Appointment',
      time: '11:00',
      period: 'Morning',
      repeat: 'Once',
      sound: true
    });

    expect(useReminderStore.getState().reminders.length).toBe(3);

    const deleted = await useReminderStore.getState().deleteRemindersByTaskIds(['series-task-1', 'series-task-2']);
    expect(deleted.length).toBe(2);
    expect(useReminderStore.getState().reminders.length).toBe(1);
    expect(useReminderStore.getState().reminders[0].title).toBe('Doctor Appointment');
  });

  it('marks the connected task as done when its reminder is marked as done', async () => {
    const { useTaskStore } = await import('./useTaskStore');
    const task = await useTaskStore.getState().addTask({
      title: 'Submit Tax Assessment',
      category: 'Work',
      priority: 'high',
      dueDate: '2026-09-30',
      estimatedPomodoros: 1,
      subtasks: []
    });

    const reminder = await useReminderStore.getState().addReminder({
      taskId: task.id,
      title: 'Submit Tax Assessment',
      time: '11:00',
      period: 'Morning',
      repeat: 'Once',
      sound: true
    });

    expect(useTaskStore.getState().tasks.find((t) => t.id === task.id)?.completed).toBe(false);
    expect(reminder.completed).toBe(false);

    // Toggle reminder to done
    const toggled = await useReminderStore.getState().toggleReminder(reminder.id);
    expect(toggled?.completed).toBe(true);

    // Connected task is automatically marked done as well
    const updatedTask = useTaskStore.getState().tasks.find((t) => t.id === task.id);
    expect(updatedTask?.completed).toBe(true);

    // Toggle reminder back to active
    await useReminderStore.getState().toggleReminder(reminder.id);
    const uncompletedTask = useTaskStore.getState().tasks.find((t) => t.id === task.id);
    expect(uncompletedTask?.completed).toBe(false);
  });

  it('marks linked reminder as done when setReminderCompletedByTaskId is invoked', async () => {
    const reminder = await useReminderStore.getState().addReminder({
      taskId: 'task-sync-999',
      title: 'Daily Standup Sync',
      time: '09:00',
      period: 'Morning',
      repeat: 'Daily',
      sound: true
    });

    expect(reminder.completed).toBe(false);

    await useReminderStore.getState().setReminderCompletedByTaskId('task-sync-999', true);
    expect(useReminderStore.getState().reminders.find((r) => r.id === reminder.id)?.completed).toBe(true);

    await useReminderStore.getState().setReminderCompletedByTaskId('task-sync-999', false);
    expect(useReminderStore.getState().reminders.find((r) => r.id === reminder.id)?.completed).toBe(false);
  });
});

