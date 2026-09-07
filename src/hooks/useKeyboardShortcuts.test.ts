import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useUIStore } from '../store/useUIStore';

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    useUIStore.setState({
      shortcutsModalOpen: false,
      taskModalOpen: false,
      taskViewModalOpen: false,
      reminderModalOpen: false,
      authModalOpen: false,
      intentionModalOpen: false,
      profileModalOpen: false,
      firstSessionTourOpen: false
    });
  });

  it('opens shortcuts modal when ? key is pressed', () => {
    renderHook(() => useKeyboardShortcuts());

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }));
    expect(useUIStore.getState().shortcutsModalOpen).toBe(true);
  });

  it('switches view when navigation shortcut is pressed', () => {
    useUIStore.getState().setActiveView('daily');
    renderHook(() => useKeyboardShortcuts());

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'T' }));
    expect(useUIStore.getState().activeView).toBe('tasks');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'R' }));
    expect(useUIStore.getState().activeView).toBe('reminders');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'C' }));
    expect(useUIStore.getState().activeView).toBe('focus');
  });

  it('does not trigger shortcuts when a modal is open', () => {
    useUIStore.setState({ activeView: 'tasks', taskModalOpen: true });
    renderHook(() => useKeyboardShortcuts());

    // Press D for daily view
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'D' }));
    // View should remain on tasks
    expect(useUIStore.getState().activeView).toBe('tasks');
  });
});
