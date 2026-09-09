import { describe, it, expect } from 'vitest';
import {
  getTodayDateString,
  formatTimeDisplay,
  getDateStatus,
  getLocalGreeting,
  doesTaskRecurOnDate
} from './date';

describe('Date & Localization Utilities', () => {
  it('returns valid YYYY-MM-DD today date string', () => {
    const today = getTodayDateString();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('correctly formats 24h to 12h time with AM/PM', () => {
    expect(formatTimeDisplay('09:00', '12h')).toBe('9:00 AM');
    expect(formatTimeDisplay('12:00', '12h')).toBe('12:00 PM');
    expect(formatTimeDisplay('14:30', '12h')).toBe('2:30 PM');
    expect(formatTimeDisplay('00:15', '12h')).toBe('12:15 AM');
    expect(formatTimeDisplay('23:59', '12h')).toBe('11:59 PM');
  });

  it('keeps 24h format when requested', () => {
    expect(formatTimeDisplay('14:30', '24h')).toBe('14:30');
    expect(formatTimeDisplay('09:00', '24h')).toBe('09:00');
  });

  it('correctly calculates today and overdue status', () => {
    const today = getTodayDateString();
    expect(getDateStatus(today)).toEqual({ isToday: true, isOverdue: false });
    expect(getDateStatus('2020-01-01')).toEqual({ isToday: false, isOverdue: true });
    expect(getDateStatus('2099-01-01')).toEqual({ isToday: false, isOverdue: false });
  });

  it('returns appropriate contextual greeting', () => {
    const greeting = getLocalGreeting();
    expect(['Good morning', 'Good afternoon', 'Good evening']).toContain(greeting);
  });

  describe('doesTaskRecurOnDate', () => {
    it('returns false for Once or invalid targets', () => {
      expect(doesTaskRecurOnDate('2026-09-01', '2026-09-02', 'Once')).toBe(false);
      expect(doesTaskRecurOnDate('2026-09-01', '', 'Daily')).toBe(false);
    });

    it('identifies daily recurrences correctly', () => {
      expect(doesTaskRecurOnDate('2026-09-01', '2026-09-01', 'Daily')).toBe(true);
      expect(doesTaskRecurOnDate('2026-09-01', '2026-09-02', 'Daily')).toBe(true);
      expect(doesTaskRecurOnDate('2026-09-01', '2026-08-31', 'Daily')).toBe(false);
      // With interval 2
      expect(doesTaskRecurOnDate('2026-09-01', '2026-09-03', 'Daily', { frequency: 'Daily', interval: 2 })).toBe(true);
      expect(doesTaskRecurOnDate('2026-09-01', '2026-09-02', 'Daily', { frequency: 'Daily', interval: 2 })).toBe(false);
    });

    it('identifies weekdays recurrences (Mon-Fri) and ignores weekends', () => {
      // 2026-09-01 is Tuesday
      expect(doesTaskRecurOnDate('2026-09-01', '2026-09-04', 'Weekdays')).toBe(true); // Friday
      expect(doesTaskRecurOnDate('2026-09-01', '2026-09-05', 'Weekdays')).toBe(false); // Saturday
      expect(doesTaskRecurOnDate('2026-09-01', '2026-09-06', 'Weekdays')).toBe(false); // Sunday
      expect(doesTaskRecurOnDate('2026-09-01', '2026-09-07', 'Weekdays')).toBe(true); // Monday
    });

    it('identifies weekly recurrences with specific weekdays', () => {
      // 2026-09-01 is Tuesday (day 2). Weekdays set: Mon (1) and Wed (3)
      const config = { frequency: 'Weekly' as const, weekdays: [1, 3] };
      expect(doesTaskRecurOnDate('2026-09-01', '2026-09-02', 'Weekly', config)).toBe(true); // Wednesday
      expect(doesTaskRecurOnDate('2026-09-01', '2026-09-03', 'Weekly', config)).toBe(false); // Thursday
      expect(doesTaskRecurOnDate('2026-09-01', '2026-09-07', 'Weekly', config)).toBe(true); // Next Monday
    });

    it('respects recurrence endDate boundary', () => {
      const config = { frequency: 'Daily' as const, endDate: '2026-09-05' };
      expect(doesTaskRecurOnDate('2026-09-01', '2026-09-05', 'Daily', config)).toBe(true);
      expect(doesTaskRecurOnDate('2026-09-01', '2026-09-06', 'Daily', config)).toBe(false);
    });
  });
});
