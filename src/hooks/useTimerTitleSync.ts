import { useEffect } from 'react';
import { useTimerStore } from '../store/useTimerStore';

/**
 * Dynamically synchronizes document.title with the active Focus Timer countdown.
 * Automatically restores the clean default title when timer is paused or stopped.
 */
export function useTimerTitleSync() {
  const isRunning = useTimerStore((state) => state.isRunning);
  const remainingSec = useTimerStore((state) => state.remainingSec);

  useEffect(() => {
    const defaultTitle = 'Planr — Simple Daily Planner & Focus Timer';

    if (!isRunning) {
      document.title = defaultTitle;
      return;
    }

    const hours = Math.floor(remainingSec / 3600);
    const mins = Math.floor((remainingSec % 3600) / 60);
    const secs = remainingSec % 60;
    const timeFormatted =
      hours > 0
        ? `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
        : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    document.title = `Focus (${timeFormatted}) • Planr`;

    return () => {
      document.title = defaultTitle;
    };
  }, [isRunning, remainingSec]);
}
