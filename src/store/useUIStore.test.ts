import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from './useUIStore';

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.setState({ toasts: [] });
    useUIStore.getState().closeTaskModal();
    useUIStore.getState().closeReminderModal();
    useUIStore.getState().closeAuthModal();
    useUIStore.getState().closeIntentionModal();
    useUIStore.getState().closeShortcutsModal();
    useUIStore.getState().setActiveView('daily');
  });

  it('controls activeView transitions', () => {
    expect(useUIStore.getState().activeView).toBe('daily');
    useUIStore.getState().setActiveView('tasks');
    expect(useUIStore.getState().activeView).toBe('tasks');
  });

  it('manages task modal open and editing states', () => {
    expect(useUIStore.getState().taskModalOpen).toBe(false);
    useUIStore.getState().openTaskModal();
    expect(useUIStore.getState().taskModalOpen).toBe(true);
    expect(useUIStore.getState().editingTask).toBeNull();

    useUIStore.getState().closeTaskModal();
    expect(useUIStore.getState().taskModalOpen).toBe(false);
  });

  it('manages reminder modal open and editing states', () => {
    expect(useUIStore.getState().reminderModalOpen).toBe(false);
    expect(useUIStore.getState().editingReminder).toBeNull();

    useUIStore.getState().openReminderModal();
    expect(useUIStore.getState().reminderModalOpen).toBe(true);
    expect(useUIStore.getState().editingReminder).toBeNull();

    useUIStore.getState().closeReminderModal();
    expect(useUIStore.getState().reminderModalOpen).toBe(false);

    const mockReminder = {
      id: 'rem-1',
      title: 'Deep breath',
      time: '12:00',
      period: 'Afternoon' as const,
      repeat: 'Daily' as const,
      sound: true,
      active: true,
      completed: false,
      createdAt: '2026-08-30T00:00:00.000Z',
      updatedAt: '2026-08-30T00:00:00.000Z'
    };

    useUIStore.getState().openReminderModal(mockReminder);
    expect(useUIStore.getState().reminderModalOpen).toBe(true);
    expect(useUIStore.getState().editingReminder?.id).toBe('rem-1');

    useUIStore.getState().closeReminderModal();
    expect(useUIStore.getState().reminderModalOpen).toBe(false);
    expect(useUIStore.getState().editingReminder).toBeNull();
  });

  it('toggles full screen zen mode', () => {
    expect(useUIStore.getState().fullScreenMode).toBe(false);
    useUIStore.getState().toggleFullScreenMode();
    expect(useUIStore.getState().fullScreenMode).toBe(true);
    useUIStore.getState().toggleFullScreenMode();
    expect(useUIStore.getState().fullScreenMode).toBe(false);
  });

  it('dispatches toast notifications', () => {
    useUIStore.getState().showToast('Test notification', 'success');
    const toasts = useUIStore.getState().toasts;
    expect(toasts.length).toBe(1);
    expect(toasts[0].message).toBe('Test notification');
    expect(toasts[0].type).toBe('success');
  });
});
