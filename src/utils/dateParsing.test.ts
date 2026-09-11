import { describe, it, expect } from 'vitest';
import { parseNaturalLanguageTask } from './dateParsing';

describe('parseNaturalLanguageTask', () => {
  const fixedBase = new Date('2026-09-11T10:00:00'); // Friday, Sep 11, 2026

  it('parses tomorrow with time, priority, and category', () => {
    const res = parseNaturalLanguageTask('Review Q3 metrics tomorrow at 3pm @urgent #work', fixedBase);
    expect(res.title).toBe('Review Q3 metrics');
    expect(res.dueDate).toBe('2026-09-12');
    expect(res.dueTime).toBe('15:00');
    expect(res.priority).toBe('urgent');
    expect(res.category).toBe('Work');
    expect(res.tokens.dateLabel).toBe('Tomorrow');
    expect(res.tokens.timeLabel).toBe('3:00 PM');
    expect(res.tokens.priorityLabel).toBe('Urgent');
    expect(res.tokens.categoryLabel).toBe('Work');
  });

  it('parses recurrence like weekdays and daily', () => {
    const res1 = parseNaturalLanguageTask('Morning meditation every weekday @high #mindful', fixedBase);
    expect(res1.title).toBe('Morning meditation');
    expect(res1.repeat).toBe('Weekdays');
    expect(res1.priority).toBe('high');
    expect(res1.category).toBe('Mindful');

    const res2 = parseNaturalLanguageTask('Drink 2L water daily at 9am', fixedBase);
    expect(res2.title).toBe('Drink 2L water');
    expect(res2.repeat).toBe('Daily');
    expect(res2.dueTime).toBe('09:00');
  });

  it('parses in N days', () => {
    const res = parseNaturalLanguageTask('Follow up with supplier in 3 days @low', fixedBase);
    expect(res.title).toBe('Follow up with supplier');
    expect(res.dueDate).toBe('2026-09-14');
    expect(res.priority).toBe('low');
    expect(res.tokens.dateLabel).toBe('In 3 days');
  });

  it('parses weekday names (e.g. next monday)', () => {
    const res = parseNaturalLanguageTask('Team sync next monday at 10:30am', fixedBase);
    expect(res.title).toBe('Team sync');
    expect(res.dueDate).toBe('2026-09-21'); // next Monday after Friday 11th
    expect(res.dueTime).toBe('10:30');
  });

  it('falls back cleanly to default for simple titles', () => {
    const res = parseNaturalLanguageTask('Buy groceries', fixedBase);
    expect(res.title).toBe('Buy groceries');
    expect(res.dueDate).toBe('2026-09-11');
    expect(res.priority).toBe('medium');
    expect(res.category).toBe('Work');
    expect(res.repeat).toBe('Once');
  });
});
