/**
 * Centralized Date & Localization Utilities for Planr
 */

/**
 * Returns YYYY-MM-DD in local timezone
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns formatted long date based on user locale
 */
export function formatHeaderDate(locale?: string): string {
  const userLocale = locale || (typeof navigator !== 'undefined' ? navigator.language : 'en-US');
  return new Intl.DateTimeFormat(userLocale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date()).toUpperCase();
}

/**
 * Formats YYYY-MM-DD to friendly localized string e.g. "Aug 30, 2026"
 */
export function formatDateLong(dateStr: string, locale?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  if (isNaN(date.getTime())) return dateStr;
  const userLocale = locale || (typeof navigator !== 'undefined' ? navigator.language : 'en-US');
  return new Intl.DateTimeFormat(userLocale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

/**
 * Returns contextual greeting based on local time
 */
export function getLocalGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Converts a 24-hour time string ("14:30") to 12-hour ("2:30 PM") or keeps 24-hour ("14:30")
 */
export function formatTimeDisplay(timeStr: string, format: '12h' | '24h' = '12h'): string {
  if (!timeStr) return '';
  if (format === '24h') return timeStr;

  const [hoursStr, minsStr] = timeStr.split(':');
  const hours = parseInt(hoursStr, 10);
  const mins = minsStr || '00';

  if (isNaN(hours)) return timeStr;

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;

  return `${displayHours}:${mins} ${period}`;
}

/**
 * Checks if a given date string is today or overdue
 */
export function getDateStatus(dueDateStr?: string): { isToday: boolean; isOverdue: boolean } {
  if (!dueDateStr) return { isToday: false, isOverdue: false };
  const today = getTodayDateString();
  return {
    isToday: dueDateStr === today,
    isOverdue: dueDateStr < today
  };
}

/**
 * Calculates the next recurrence date (YYYY-MM-DD) based on recurrence rule
 */
export function calculateNextRecurrenceDate(
  baseDateStr: string | undefined,
  repeat?: 'Daily' | 'Weekdays' | 'Weekly' | 'Once'
): string {
  const today = getTodayDateString();
  const startStr = baseDateStr && baseDateStr >= today ? baseDateStr : today;
  const d = new Date(startStr + 'T00:00:00');

  if (repeat === 'Daily') {
    d.setDate(d.getDate() + 1);
  } else if (repeat === 'Weekdays') {
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 6) {
      d.setDate(d.getDate() + 2);
    } else if (d.getDay() === 0) {
      d.setDate(d.getDate() + 1);
    }
  } else if (repeat === 'Weekly') {
    d.setDate(d.getDate() + 7);
  }

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
