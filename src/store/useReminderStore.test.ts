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
});
