import { describe, it, expect, beforeEach } from 'vitest';
import { useTimerStore } from './useTimerStore';

describe('useTimerStore', () => {
  beforeEach(() => {
    useTimerStore.getState().resetTimer();
    useTimerStore.getState().setFocusSessions([]);
  });

  it('sets presets correctly', () => {
    useTimerStore.getState().setPreset('deep', 50);
    expect(useTimerStore.getState().currentPreset).toBe('deep');
    expect(useTimerStore.getState().durationSec).toBe(50 * 60);
    expect(useTimerStore.getState().remainingSec).toBe(50 * 60);
  });

  it('toggles timer running state', () => {
    expect(useTimerStore.getState().isRunning).toBe(false);
    useTimerStore.getState().toggleTimer();
    expect(useTimerStore.getState().isRunning).toBe(true);
    useTimerStore.getState().toggleTimer();
    expect(useTimerStore.getState().isRunning).toBe(false);
  });

  it('sets ambient type', () => {
    useTimerStore.getState().setAmbientType('rain');
    expect(useTimerStore.getState().ambientType).toBe('rain');
    useTimerStore.getState().setAmbientType('none');
    expect(useTimerStore.getState().ambientType).toBe('none');
  });

  it('completes session and logs focus session', async () => {
    const session = await useTimerStore.getState().completeSession('Deep Architecture Review');

    expect(session.id).toBeDefined();
    expect(session.taskTitle).toBe('Deep Architecture Review');
    expect(useTimerStore.getState().focusSessions.length).toBe(1);
  });
});
