import { describe, it, expect } from 'vitest';
import { exportToMarkdown, exportToCSV, exportToICalendar } from './exportEngines';
import { Task, Reminder, FocusSession, UserProfile, AppSettings } from '../types';

describe('Multi-Format Export Engines', () => {
  const mockTasks: Task[] = [
    {
      id: 'task-1',
      title: 'Architectural Blueprint',
      description: 'Zustand slices and repository abstraction',
      category: 'Design',
      priority: 'urgent',
      dueDate: '2026-09-01',
      completed: true,
      estimatedPomodoros: 2,
      completedPomodoros: 2,
      subtasks: [{ id: 'sub-1', title: 'Define stores', completed: true }],
      createdAt: new Date().toISOString()
    }
  ];

  const mockReminders: Reminder[] = [
    {
      id: 'rem-1',
      title: 'Tea & Reflection',
      time: '15:00',
      period: 'Afternoon',
      repeat: 'Daily',
      sound: true,
      active: true,
      completed: false
    }
  ];

  const mockSessions: FocusSession[] = [
    {
      id: 'foc-1',
      taskId: 'task-1',
      taskTitle: 'Architectural Blueprint',
      durationMinutes: 25,
      completedAt: new Date().toISOString(),
      type: 'focus'
    }
  ];

  const mockUser: UserProfile = {
    name: 'Alex Morgan',
    title: 'Quiet Confidence',
    tagline: 'Intentional Living',
    email: 'alex@planr.lifestyle',
    isLoggedIn: true
  };

  const mockSettings: AppSettings = {
    theme: 'light',
    timeFormat: '12h',
    soundEffects: true,
    soundVolume: 0.5,
    focusDuration: 25,
    deepFocusDuration: 50,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    autoStartBreaks: false,
    notificationsEnabled: false
  };

  it('exports to Obsidian-compatible Markdown with YAML frontmatter', () => {
    const md = exportToMarkdown({
      tasks: mockTasks,
      reminders: mockReminders,
      focusSessions: mockSessions,
      user: mockUser,
      settings: mockSettings,
      intention: 'Move with stillness.'
    });

    expect(md).toContain('---');
    expect(md).toContain('author: Alex Morgan');
    expect(md).toContain('intention: "Move with stillness."');
    expect(md).toContain('### Design');
    expect(md).toContain('- [x] **Architectural Blueprint**');
    expect(md).toContain('## 🧘 Focus Log Summary');
  });

  it('exports tasks to formatted CSV spreadsheet string', () => {
    const csv = exportToCSV(mockTasks);
    expect(csv).toContain('ID,Title,Description,Category,Priority,Due Date');
    expect(csv).toContain('"Architectural Blueprint"');
    expect(csv).toContain('"urgent"');
  });

  it('exports scheduled items to valid iCalendar (.ics) format', () => {
    const ics = exportToICalendar(mockTasks, mockReminders);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('SUMMARY:Architectural Blueprint [Planr]');
    expect(ics).toContain('SUMMARY:Reminder: Tea & Reflection');
    expect(ics).toContain('END:VCALENDAR');
  });
});
