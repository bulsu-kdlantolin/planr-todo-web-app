import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useUIStore } from '../store/useUIStore';

describe('useKeyboardShortcuts', () => {
  it('opens shortcuts modal when ? key is pressed', () => {
    useUIStore.getState().closeShortcutsModal();
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
});
