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
