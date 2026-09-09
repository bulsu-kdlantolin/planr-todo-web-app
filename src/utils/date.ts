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

import { Recurrence, RecurrenceConfig } from '../types';

/**
 * Calculates the next recurrence date (YYYY-MM-DD) based on recurrence rule and configuration
 */
export function calculateNextRecurrenceDate(
  baseDateStr: string | undefined,
  repeat?: Recurrence,
  config?: RecurrenceConfig
): string | null {
  if (!repeat || repeat === 'Once') return null;

  const today = getTodayDateString();
  const startStr = baseDateStr && baseDateStr >= today ? baseDateStr : today;
  const d = new Date(startStr + 'T00:00:00');

  const interval = Math.max(1, config?.interval || 1);

  if (repeat === 'Daily') {
    d.setDate(d.getDate() + interval);
  } else if (repeat === 'Weekdays') {
    do {
      d.setDate(d.getDate() + 1);
    } while (d.getDay() === 0 || d.getDay() === 6);
  } else if (repeat === 'Weekly') {
    if (config?.weekdays && config.weekdays.length > 0) {
      // Find the next day that matches the configured weekdays
      const targetDays = new Set(config.weekdays);
      for (let i = 0; i < 14; i++) {
        d.setDate(d.getDate() + 1);
        if (targetDays.has(d.getDay())) break;
      }
    } else {
      d.setDate(d.getDate() + interval * 7);
    }
  } else if (repeat === 'Monthly') {
    d.setMonth(d.getMonth() + interval);
  } else if (repeat === 'Yearly') {
    d.setFullYear(d.getFullYear() + interval);
  } else if (repeat === 'Custom') {
    const unit = config?.intervalUnit || 'days';
    if (unit === 'days') {
      d.setDate(d.getDate() + interval);
    } else if (unit === 'weeks') {
      if (config?.weekdays && config.weekdays.length > 0) {
        const targetDays = new Set(config.weekdays);
        for (let i = 0; i < 14; i++) {
          d.setDate(d.getDate() + 1);
          if (targetDays.has(d.getDay())) break;
        }
      } else {
        d.setDate(d.getDate() + interval * 7);
      }
    } else if (unit === 'months') {
      d.setMonth(d.getMonth() + interval);
    }
  }

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const nextDateStr = `${y}-${m}-${day}`;

  // If past end date, do not schedule next recurrence
  if (config?.endDate && nextDateStr > config.endDate) {
    return null;
  }

  return nextDateStr;
}

/**
 * Checks whether a recurring task is due on a specific target date (YYYY-MM-DD)
 */
export function doesTaskRecurOnDate(
  baseDateStr: string | undefined,
  targetDateStr: string,
  repeat?: Recurrence,
  config?: RecurrenceConfig
): boolean {
  if (!repeat || repeat === 'Once' || !targetDateStr) return false;

  const startDateStr = baseDateStr || targetDateStr;
  // If target date is before start date, not due
  if (targetDateStr < startDateStr) return false;

  // If past end date, not due
  if (config?.endDate && targetDateStr > config.endDate) return false;

  // If exact start date, it is due on start date
  if (targetDateStr === startDateStr) return true;

  const [startY, startM, startD] = startDateStr.split('-').map(Number);
  const [targetY, targetM, targetD] = targetDateStr.split('-').map(Number);

  const startDate = new Date(startY, startM - 1, startD);
  const targetDate = new Date(targetY, targetM - 1, targetD);

  const diffTime = targetDate.getTime() - startDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return false;

  const interval = Math.max(1, config?.interval || 1);

  if (repeat === 'Daily') {
    return diffDays % interval === 0;
  }

  if (repeat === 'Weekdays') {
    const dayOfWeek = targetDate.getDay(); // 0 = Sun, 6 = Sat
    return dayOfWeek >= 1 && dayOfWeek <= 5;
  }

  if (repeat === 'Weekly') {
    const targetDay = targetDate.getDay();
    if (config?.weekdays && config.weekdays.length > 0) {
      if (!config.weekdays.includes(targetDay)) return false;
      if (interval > 1) {
        const startDayOfWeek = (startDate.getDay() + 6) % 7; // Mon = 0
        const startWeekMonday = new Date(startY, startM - 1, startD - startDayOfWeek);
        const targetDayOfWeek = (targetDate.getDay() + 6) % 7;
        const targetWeekMonday = new Date(targetY, targetM - 1, targetD - targetDayOfWeek);
        const weekDiff = Math.round((targetWeekMonday.getTime() - startWeekMonday.getTime()) / (1000 * 60 * 60 * 24 * 7));
        return weekDiff % interval === 0;
      }
      return true;
    }
    return targetDay === startDate.getDay() && (diffDays / 7) % interval === 0;
  }

  if (repeat === 'Monthly') {
    const monthDiff = (targetY - startY) * 12 + (targetM - startM);
    if (monthDiff < 0 || monthDiff % interval !== 0) return false;
    const daysInTargetMonth = new Date(targetY, targetM, 0).getDate();
    const expectedDay = Math.min(startD, daysInTargetMonth);
    return targetD === expectedDay;
  }

  if (repeat === 'Yearly') {
    const yearDiff = targetY - startY;
    if (yearDiff < 0 || yearDiff % interval !== 0) return false;
    return targetM === startM && targetD === startD;
  }

  if (repeat === 'Custom') {
    const unit = config?.intervalUnit || 'days';
    if (unit === 'days') {
      return diffDays % interval === 0;
    }
    if (unit === 'weeks') {
      const targetDay = targetDate.getDay();
      if (config?.weekdays && config.weekdays.length > 0) {
        if (!config.weekdays.includes(targetDay)) return false;
        if (interval > 1) {
          const startDayOfWeek = (startDate.getDay() + 6) % 7;
          const startWeekMonday = new Date(startY, startM - 1, startD - startDayOfWeek);
          const targetDayOfWeek = (targetDate.getDay() + 6) % 7;
          const targetWeekMonday = new Date(targetY, targetM - 1, targetD - targetDayOfWeek);
          const weekDiff = Math.round((targetWeekMonday.getTime() - startWeekMonday.getTime()) / (1000 * 60 * 60 * 24 * 7));
          return weekDiff % interval === 0;
        }
        return true;
      }
      return targetDay === startDate.getDay() && (diffDays / 7) % interval === 0;
    }
    if (unit === 'months') {
      const monthDiff = (targetY - startY) * 12 + (targetM - startM);
      if (monthDiff < 0 || monthDiff % interval !== 0) return false;
      const daysInTargetMonth = new Date(targetY, targetM, 0).getDate();
      const expectedDay = Math.min(startD, daysInTargetMonth);
      return targetD === expectedDay;
    }
  }

  return false;
}

/**
 * Formats ISO date string to localized date and time, e.g. "Sep 8, 2026, 7:15 AM"
 */
export function formatDateTimeLong(isoStr?: string, locale?: string): string {
  if (!isoStr) return '';
  const date = new Date(isoStr);
  if (isNaN(date.getTime())) return isoStr;
  const userLocale = locale || (typeof navigator !== 'undefined' ? navigator.language : 'en-US');
  return new Intl.DateTimeFormat(userLocale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}

