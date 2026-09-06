import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimerTitleSync } from './useTimerTitleSync';
import { useTimerStore } from '../store/useTimerStore';

describe('useTimerTitleSync', () => {
  beforeEach(() => {
    document.title = 'Planr — Simple Daily Planner & Focus Timer';
    useTimerStore.setState({
      isRunning: false,
      remainingSec: 25 * 60,
      durationSec: 25 * 60
    });
  });

  it('restores default title when timer is not running', () => {
    renderHook(() => useTimerTitleSync());
    expect(document.title).toBe('Planr — Simple Daily Planner & Focus Timer');
  });

  it('updates document.title when timer is running', () => {
    const { rerender } = renderHook(() => useTimerTitleSync());

    act(() => {
      useTimerStore.setState({
        isRunning: true,
        remainingSec: 24 * 60 + 50
      });
    });

    rerender();
    expect(document.title).toBe('Focus (24:50) • Planr');

    act(() => {
      useTimerStore.setState({
        isRunning: false
      });
    });

    rerender();
    expect(document.title).toBe('Planr — Simple Daily Planner & Focus Timer');
  });
});
