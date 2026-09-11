import { PriorityLevel, TaskCategory, Recurrence, DaySegment } from '../types';
import { getTodayDateString } from './date';

export function getTimeDaySegment(timeStr: string): DaySegment {
  const hours = parseInt(timeStr.split(':')[0], 10) || 9;
  if (hours < 12) return 'Morning';
  if (hours < 17) return 'Afternoon';
  if (hours < 21) return 'Evening';
  return 'Night';
}

export interface ParsedTaskResult {
  title: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  repeat: Recurrence;
  priority: PriorityLevel;
  category: TaskCategory;
  tokens: {
    dateLabel?: string;
    timeLabel?: string;
    repeatLabel?: string;
    priorityLabel?: string;
    categoryLabel?: string;
  };
}

const WEEKDAY_NAMES: Record<string, number> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6
};

const MONTH_NAMES: Record<string, number> = {
  january: 0,
  jan: 0,
  february: 1,
  feb: 1,
  march: 2,
  mar: 2,
  april: 3,
  apr: 3,
  may: 4,
  june: 5,
  jun: 5,
  july: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  sep: 8,
  sept: 8,
  october: 9,
  oct: 9,
  november: 10,
  nov: 10,
  december: 11,
  dec: 11
};

function formatDateToIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseNaturalLanguageTask(rawText: string, baseDate: Date = new Date()): ParsedTaskResult {
  let text = rawText.trim();
  let priority: PriorityLevel = 'medium';
  let category: TaskCategory = 'Work';
  let repeat: Recurrence = 'Once';
  let dueDate = formatDateToIso(baseDate);
  let dueTime: string | undefined = undefined;

  const tokens: ParsedTaskResult['tokens'] = {};

  // 1. Priority parsing (@urgent, @high, @medium, @low)
  if (/@urgent\b/i.test(text)) {
    priority = 'urgent';
    tokens.priorityLabel = 'Urgent';
    text = text.replace(/@urgent\b/gi, ' ');
  } else if (/@high\b/i.test(text)) {
    priority = 'high';
    tokens.priorityLabel = 'High';
    text = text.replace(/@high\b/gi, ' ');
  } else if (/@medium\b/i.test(text)) {
    priority = 'medium';
    tokens.priorityLabel = 'Medium';
    text = text.replace(/@medium\b/gi, ' ');
  } else if (/@low\b/i.test(text)) {
    priority = 'low';
    tokens.priorityLabel = 'Low';
    text = text.replace(/@low\b/gi, ' ');
  }

  // 2. Category parsing (#work, #personal, #mindful, etc.)
  const catMatch = text.match(/#([a-zA-Z0-9]+)/);
  if (catMatch && catMatch[1]) {
    const rawCat = catMatch[1].toLowerCase();
    const formattedCat = (rawCat.charAt(0).toUpperCase() + rawCat.slice(1)) as TaskCategory;
    category = formattedCat;
    tokens.categoryLabel = formattedCat;
    text = text.replace(/#[a-zA-Z0-9]+/g, ' ');
  }

  // 3. Recurrence parsing (every day, daily, every weekday, weekdays, every week, weekly, every month, monthly)
  if (/\b(?:every\s+weekday|weekdays)\b/i.test(text)) {
    repeat = 'Weekdays';
    tokens.repeatLabel = 'Weekdays';
    text = text.replace(/\b(?:every\s+weekday|weekdays)\b/gi, ' ');
  } else if (/\b(?:every\s+day|daily)\b/i.test(text)) {
    repeat = 'Daily';
    tokens.repeatLabel = 'Daily';
    text = text.replace(/\b(?:every\s+day|daily)\b/gi, ' ');
  } else if (/\b(?:every\s+week|weekly)\b/i.test(text)) {
    repeat = 'Weekly';
    tokens.repeatLabel = 'Weekly';
    text = text.replace(/\b(?:every\s+week|weekly)\b/gi, ' ');
  } else if (/\b(?:every\s+month|monthly)\b/i.test(text)) {
    repeat = 'Monthly';
    tokens.repeatLabel = 'Monthly';
    text = text.replace(/\b(?:every\s+month|monthly)\b/gi, ' ');
  }

  // 4. Time parsing (e.g. at 3pm, at 3:30pm, at 14:00, 3pm, 11:45am, noon, midnight)
  const timeRegex = /\b(?:at\s+)?(?:(1[0-2]|0?[1-9]):([0-5][0-9])\s*(am|pm)|(1[0-2]|0?[1-9])\s*(am|pm)|([01]?[0-9]|2[0-3]):([0-5][0-9])|noon|midnight)\b/i;
  const timeMatch = text.match(timeRegex);

  if (timeMatch) {
    const matchedStr = timeMatch[0].toLowerCase();
    if (matchedStr.includes('noon')) {
      dueTime = '12:00';
      tokens.timeLabel = '12:00 PM';
    } else if (matchedStr.includes('midnight')) {
      dueTime = '00:00';
      tokens.timeLabel = '12:00 AM';
    } else if (timeMatch[1] && timeMatch[2] && timeMatch[3]) {
      // 12-hour with minutes: e.g. 3:30pm
      let hours = parseInt(timeMatch[1], 10);
      const mins = timeMatch[2];
      const meridiem = timeMatch[3].toLowerCase();
      if (meridiem === 'pm' && hours < 12) hours += 12;
      if (meridiem === 'am' && hours === 12) hours = 0;
      dueTime = `${String(hours).padStart(2, '0')}:${mins}`;
      tokens.timeLabel = `${timeMatch[1]}:${mins} ${meridiem.toUpperCase()}`;
    } else if (timeMatch[4] && timeMatch[5]) {
      // 12-hour hours only: e.g. 3pm
      let hours = parseInt(timeMatch[4], 10);
      const meridiem = timeMatch[5].toLowerCase();
      if (meridiem === 'pm' && hours < 12) hours += 12;
      if (meridiem === 'am' && hours === 12) hours = 0;
      dueTime = `${String(hours).padStart(2, '0')}:00`;
      tokens.timeLabel = `${timeMatch[4]}:00 ${meridiem.toUpperCase()}`;
    } else if (timeMatch[6] && timeMatch[7]) {
      // 24-hour time: e.g. 14:30
      const hours = parseInt(timeMatch[6], 10);
      const mins = timeMatch[7];
      dueTime = `${String(hours).padStart(2, '0')}:${mins}`;
      const displayHours = hours % 12 || 12;
      const meridiem = hours >= 12 ? 'PM' : 'AM';
      tokens.timeLabel = `${displayHours}:${mins} ${meridiem}`;
    }

    text = text.replace(timeRegex, ' ');
  }

  // 5. Date parsing
  // 5a. "today" / "tonight"
  if (/\b(?:today|tonight)\b/i.test(text)) {
    dueDate = formatDateToIso(baseDate);
    tokens.dateLabel = 'Today';
    text = text.replace(/\b(?:today|tonight)\b/gi, ' ');
  }
  // 5b. "tomorrow" / "tmrw"
  else if (/\b(?:tomorrow|tmrw)\b/i.test(text)) {
    const tmrw = new Date(baseDate);
    tmrw.setDate(tmrw.getDate() + 1);
    dueDate = formatDateToIso(tmrw);
    tokens.dateLabel = 'Tomorrow';
    text = text.replace(/\b(?:tomorrow|tmrw)\b/gi, ' ');
  }
  // 5c. "in N days"
  else if (/\bin\s+(\d+)\s+days?\b/i.test(text)) {
    const match = text.match(/\bin\s+(\d+)\s+days?\b/i);
    if (match && match[1]) {
      const daysToAdd = parseInt(match[1], 10);
      const futureDate = new Date(baseDate);
      futureDate.setDate(futureDate.getDate() + daysToAdd);
      dueDate = formatDateToIso(futureDate);
      tokens.dateLabel = `In ${daysToAdd} days`;
      text = text.replace(/\bin\s+\d+\s+days?\b/gi, ' ');
    }
  }
  // 5d. Weekday matching (e.g. "on friday", "next monday", "wednesday")
  else {
    const weekdayRegex = /\b(?:on\s+)?(?:(next)\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/i;
    const weekdayMatch = text.match(weekdayRegex);
    if (weekdayMatch) {
      const isNext = Boolean(weekdayMatch[1]);
      const dayName = weekdayMatch[2].toLowerCase();
      const targetDay = WEEKDAY_NAMES[dayName];

      if (targetDay !== undefined) {
        const currentDay = baseDate.getDay();
        let diff = targetDay - currentDay;
        if (diff <= 0) diff += 7;
        if (isNext && diff < 7) diff += 7;

        const targetDate = new Date(baseDate);
        targetDate.setDate(targetDate.getDate() + diff);
        dueDate = formatDateToIso(targetDate);
        const dayLabel = dayName.charAt(0).toUpperCase() + dayName.slice(1);
        tokens.dateLabel = `${isNext ? 'Next ' : ''}${dayLabel}`;
        text = text.replace(weekdayRegex, ' ');
      }
    } else {
      // 5e. Month Day matching (e.g. "Sep 15", "September 15th", "15th of Sep")
      const monthDayRegex = /\b(?:(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|sept|october|oct|november|nov|december|dec)\s+(\d{1,2})(?:st|nd|rd|th)?|(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|sept|october|oct|november|nov|december|dec))\b/i;
      const monthMatch = text.match(monthDayRegex);
      if (monthMatch) {
        let monthName = (monthMatch[1] || monthMatch[4])?.toLowerCase();
        let dayNum = parseInt(monthMatch[2] || monthMatch[3], 10);
        if (monthName && dayNum && MONTH_NAMES[monthName] !== undefined) {
          const monthIdx = MONTH_NAMES[monthName];
          const year = baseDate.getFullYear();
          const targetDate = new Date(year, monthIdx, dayNum);
          if (targetDate < baseDate) {
            targetDate.setFullYear(year + 1);
          }
          dueDate = formatDateToIso(targetDate);
          tokens.dateLabel = targetDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          text = text.replace(monthDayRegex, ' ');
        }
      }
    }
  }

  // Clean remaining text as task title
  const cleanTitle = text
    .replace(/\s+/g, ' ')
    .replace(/^[-–—,.:;]+\s*/, '')
    .replace(/\s*[-–—,.:;]+$/, '')
    .trim();

  return {
    title: cleanTitle || rawText.trim(),
    dueDate,
    dueTime,
    repeat,
    priority,
    category,
    tokens
  };
}
