import { describe, it, expect } from 'vitest';
import {
  getTodayDateString,
  formatTimeDisplay,
  getDateStatus,
  getLocalGreeting
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
});
