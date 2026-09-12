import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFocusTrap } from './useFocusTrap';

describe('useFocusTrap Hook', () => {
  let container: HTMLDivElement;
  let btn1: HTMLButtonElement;
  let btn2: HTMLButtonElement;
  let input: HTMLInputElement;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    btn1 = document.createElement('button');
    btn1.setAttribute('aria-label', 'Close dialog');
    input = document.createElement('input');
    input.type = 'text';
    btn2 = document.createElement('button');
    btn2.textContent = 'Submit';

    container.appendChild(btn1);
    container.appendChild(input);
    container.appendChild(btn2);
    document.body.appendChild(container);
  });

  afterEach(() => {
    vi.useRealTimers();
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  });

  it('auto-focuses the first input or primary interactive element on mount when active', () => {
    const ref = { current: container };
    renderHook(() =>
      useFocusTrap(ref, {
        isActive: true,
        onEscape: vi.fn()
      })
    );

    vi.advanceTimersByTime(100);
    expect(document.activeElement).toBe(input);
  });

  it('calls onEscape when Escape key is pressed', () => {
    const onEscape = vi.fn();
    const ref = { current: container };
    renderHook(() =>
      useFocusTrap(ref, {
        isActive: true,
        onEscape
      })
    );

    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    document.dispatchEvent(event);

    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('wraps focus from last to first on Tab key press', () => {
    const ref = { current: container };
    renderHook(() =>
      useFocusTrap(ref, {
        isActive: true
      })
    );

    btn2.focus();
    expect(document.activeElement).toBe(btn2);

    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    document.dispatchEvent(tabEvent);

    expect(document.activeElement).toBe(btn1);
  });

  it('wraps focus from first to last on Shift+Tab key press', () => {
    const ref = { current: container };
    renderHook(() =>
      useFocusTrap(ref, {
        isActive: true
      })
    );

    btn1.focus();
    expect(document.activeElement).toBe(btn1);

    const shiftTabEvent = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true });
    document.dispatchEvent(shiftTabEvent);

    expect(document.activeElement).toBe(btn2);
  });
});
