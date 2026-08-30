import { Task, Reminder, FocusSession, UserProfile, AppSettings } from '../types';
import { dbExportJSON } from '../db/indexedDB';
import { getTodayDateString } from './date';

export interface ExportBundle {
  tasks: Task[];
  reminders: Reminder[];
  focusSessions: FocusSession[];
  user: UserProfile;
  settings: AppSettings;
  intention: string;
}

/**
 * Export tasks and sessions to Markdown format (Obsidian Vault friendly)
 */
export function exportToMarkdown(bundle: ExportBundle): string {
  const { tasks, reminders, focusSessions, intention, user } = bundle;
  const dateStr = getTodayDateString();

  let md = `---
title: Planr Workspace Export - ${dateStr}
author: ${user.name}
intention: "${intention}"
exported_at: ${new Date().toISOString()}
total_tasks: ${tasks.length}
completed_tasks: ${tasks.filter(t => t.completed).length}
---

# 🌿 Planr Workspace Export

> *"Daily Focus Goal: ${intention}"*

## 📋 Tasks & Milestones

`;

  // Group tasks by category
  const categories = Array.from(new Set(tasks.map(t => t.category || 'General')));
  for (const cat of categories) {
    md += `### ${cat}\n`;
    const catTasks = tasks.filter(t => (t.category || 'General') === cat);
    for (const t of catTasks) {
      const check = t.completed ? '[x]' : '[ ]';
      const due = t.dueDate ? ` (Due: ${t.dueDate})` : '';
      const priority = ` [Priority: ${t.priority.toUpperCase()}]`;
      md += `- ${check} **${t.title}**${priority}${due}\n`;
      if (t.description) {
        md += `  - *Notes:* ${t.description}\n`;
      }
      if (t.subtasks && t.subtasks.length > 0) {
        for (const sub of t.subtasks) {
          const subCheck = sub.completed ? '[x]' : '[ ]';
          md += `    - ${subCheck} ${sub.title}\n`;
        }
      }
    }
    md += '\n';
  }

  md += `## ⏰ Reminders\n\n`;
  for (const r of reminders) {
    const check = r.completed ? '[x]' : '[ ]';
    md += `- ${check} **${r.time}** — ${r.title} (${r.period}, Repeat: ${r.repeat})\n`;
    if (r.description) md += `  - *Note:* ${r.description}\n`;
  }

  md += `\n## 🧘 Focus Log Summary\n\n`;
  md += `Total Focus Sessions: **${focusSessions.length}** | Total Focus Time: **${focusSessions.reduce((acc, s) => acc + s.durationMinutes, 0)} minutes**\n\n`;
  for (const s of focusSessions.slice(0, 10)) {
    md += `- ${s.completedAt.split('T')[0]}: **${s.taskTitle}** (${s.durationMinutes}m focus)\n`;
  }

  return md;
}

/**
 * Export tasks to CSV format
 */
export function exportToCSV(tasks: Task[]): string {
  const headers = ['ID', 'Title', 'Description', 'Category', 'Priority', 'Due Date', 'Completed', 'Pomodoros Estimated', 'Pomodoros Completed', 'Created At'];
  const rows = tasks.map(t => [
    `"${t.id}"`,
    `"${t.title.replace(/"/g, '""')}"`,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    `"${t.category}"`,
    `"${t.priority}"`,
    `"${t.dueDate || ''}"`,
    `"${t.completed ? 'YES' : 'NO'}"`,
    t.estimatedPomodoros || 1,
    t.completedPomodoros || 0,
    `"${t.createdAt}"`
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Export tasks and reminders to iCalendar (.ics) RFC 5545 format
 */
export function exportToICalendar(tasks: Task[], reminders: Reminder[]): string {
  const formatICSDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Planr Lifestyle//Planr Calendar Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  // Tasks with due dates
  for (const t of tasks) {
    if (!t.dueDate) continue;
    const due = new Date(t.dueDate);

    ics.push(
      'BEGIN:VEVENT',
      `UID:${t.id}@planr.lifestyle`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART;VALUE=DATE:${t.dueDate.replace(/-/g, '')}`,
      `SUMMARY:${t.title} [Planr]`,
      `DESCRIPTION:${t.description || 'Planr task'} (Category: ${t.category}, Priority: ${t.priority})`,
      `STATUS:${t.completed ? 'COMPLETED' : 'CONFIRMED'}`,
      'END:VEVENT'
    );
  }

  // Reminders
  for (const r of reminders) {
    const [hh, mm] = r.time.split(':');
    const remDate = new Date();
    remDate.setHours(Number(hh) || 9, Number(mm) || 0, 0, 0);

    ics.push(
      'BEGIN:VEVENT',
      `UID:${r.id}@planr.lifestyle`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(remDate)}`,
      `SUMMARY:Reminder: ${r.title}`,
      `DESCRIPTION:${r.description || 'Alert'} (${r.period})`,
      'END:VEVENT'
    );
  }

  ics.push('END:VCALENDAR');
  return ics.join('\r\n');
}

/**
 * Trigger browser file download
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportWorkspaceAsJSON(): Promise<void> {
  const backup = await dbExportJSON();
  const dateStr = getTodayDateString();
  downloadFile(JSON.stringify(backup, null, 2), `planr-backup-${dateStr}.json`, 'application/json');
}

export function exportTasksAsMarkdown(tasks: Task[]): void {
  const md = exportToMarkdown({
    tasks,
    reminders: [],
    focusSessions: [],
    user: { name: 'User', email: '', isLoggedIn: true, tagline: '', title: '' },
    settings: {
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
    },
    intention: 'Focus on what matters'
  });
  const dateStr = getTodayDateString();
  downloadFile(md, `planr-tasks-${dateStr}.md`, 'text/markdown');
}

export function exportTasksAsCSV(tasks: Task[]): void {
  const csv = exportToCSV(tasks);
  const dateStr = getTodayDateString();
  downloadFile(csv, `planr-tasks-${dateStr}.csv`, 'text/csv');
}
