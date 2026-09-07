import { useEffect, useRef } from 'react';
import { useReminderStore } from '../store/useReminderStore';
import { useMetaStore } from '../store/useMetaStore';
import { useUIStore } from '../store/useUIStore';
import { audioManager } from '../utils/audio';
import { sendBrowserNotification } from '../utils/notifications';
import { getTodayDateString } from '../utils/date';

/**
 * Global reactive hook that checks active reminders against the current clock time.
 * When a scheduled reminder triggers:
 * 1. Plays its configured procedural audio option (chime, bell, marimba, beep, or harp).
 * 2. Emits a system notification if enabled.
 * 3. Shows an interactive toast with a "Done" action button.
 */
export function useReminderAlerts() {
  const reminders = useReminderStore((state) => state.reminders);
  const toggleReminder = useReminderStore((state) => state.toggleReminder);
  const notificationsEnabled = useMetaStore((state) => state.settings.notificationsEnabled ?? true);
  const soundEffects = useMetaStore((state) => state.settings.soundEffects ?? true);
  const showToast = useUIStore((state) => state.showToast);

  // Track already fired reminders in the format `${id}_${YYYY-MM-DD}_${HH:mm}`
  const alertedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      const todayDateStr = getTodayDateString();
      const currentDayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat

      reminders.forEach((r) => {
        if (r.completed || !r.active) return;
        if (r.time !== currentTimeStr) return;

        // Verify recurrence filter
        let shouldTrigger = false;
        if (r.repeat === 'Once') {
          shouldTrigger = !r.scheduledDate || r.scheduledDate === todayDateStr;
        } else if (r.repeat === 'Daily') {
          shouldTrigger = true;
        } else if (r.repeat === 'Weekdays') {
          shouldTrigger = currentDayOfWeek >= 1 && currentDayOfWeek <= 5;
        } else if (r.repeat === 'Weekly') {
          // If created on the same day of week or scheduledDate matches day of week
          if (r.scheduledDate) {
            const schedDate = new Date(r.scheduledDate + 'T00:00:00');
            shouldTrigger = schedDate.getDay() === currentDayOfWeek;
          } else if (r.createdAt) {
            const created = new Date(r.createdAt);
            shouldTrigger = created.getDay() === currentDayOfWeek;
          } else {
            shouldTrigger = true;
          }
        } else {
          shouldTrigger = true;
        }

        if (!shouldTrigger) return;

        const alertKey = `${r.id}_${todayDateStr}_${currentTimeStr}`;
        if (alertedRef.current.has(alertKey)) return;

        // Mark as alerted for this minute
        alertedRef.current.add(alertKey);

        // 1. Play chosen procedural audio sound
        if (soundEffects && r.sound !== false) {
          audioManager.playReminderSound(r.soundOption || 'chime');
        }

        // 2. Dispatch browser notification if permitted
        if (notificationsEnabled) {
          sendBrowserNotification(`⏰ Reminder: ${r.title}`, {
            body: r.description || `It's time for: ${r.title}`
          });
        }

        // 3. Display interactive toast
        showToast(
          `⏰ Reminder: ${r.title}`,
          'info',
          'Mark Done',
          () => {
            toggleReminder(r.id);
          }
        );
      });
    };

    // Check immediately on mount and every 10 seconds
    checkReminders();
    const timer = setInterval(checkReminders, 10000);

    return () => clearInterval(timer);
  }, [reminders, notificationsEnabled, soundEffects, showToast, toggleReminder]);
}
