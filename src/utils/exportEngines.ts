import { Task, Reminder, FocusSession, UserProfile, AppSettings } from '../types';
import { useTaskStore } from '../store/useTaskStore';
import { useReminderStore } from '../store/useReminderStore';
import { useTimerStore } from '../store/useTimerStore';
import { useMetaStore } from '../store/useMetaStore';
import { supabase } from '../lib/supabase/client';
import { insertTaskDb } from '../lib/supabase/tasks';
import { insertReminderDb } from '../lib/supabase/reminders';
import { insertFocusSessionDb } from '../lib/supabase/focus';
import { upsertUserProfileDb } from '../lib/supabase/profiles';
import { getTodayDateString } from './date';

export interface ExportBundle {
  version: number;
  exportedAt: string;
  tasks: Task[];
  reminders: Reminder[];
  focusSessions: FocusSession[];
  meta: {
    user: UserProfile;
    settings: AppSettings;
    intention: string;
  };
}

/**
 * Export tasks and sessions to Markdown format (Obsidian Vault friendly)
 */
export function exportToMarkdown(bundle: {
  tasks: Task[];
  reminders: Reminder[];
  focusSessions: FocusSession[];
  intention: string;
  user: UserProfile;
  settings?: AppSettings;
}): string {
  const { tasks, reminders, focusSessions, intention, user } = bundle;
  const dateStr = getTodayDateString();

  let md = `---
title: Planr Workspace Export - ${dateStr}
author: ${user.name || 'User'}
intention: "${intention || ''}"
exported_at: ${new Date().toISOString()}
total_tasks: ${tasks.length}
completed_tasks: ${tasks.filter((t) => t.completed).length}
---

# 🌿 Planr Workspace Export

> *"Daily Focus Goal: ${intention || "Focus on today's main task."}"*

## 📋 Tasks & Milestones

`;

  const categories = Array.from(new Set(tasks.map((t) => t.category || 'General')));
  for (const cat of categories) {
    md += `### ${cat}\n`;
    const catTasks = tasks.filter((t) => (t.category || 'General') === cat);
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
  md += `Total Focus Sessions: **${focusSessions.length}** | Total Focus Time: **${focusSessions.reduce(
    (acc, s) => acc + s.durationMinutes,
    0
  )} minutes**\n\n`;
  for (const s of focusSessions.slice(0, 10)) {
    md += `- ${s.completedAt.split('T')[0]}: **${s.taskTitle}** (${s.durationMinutes}m focus)\n`;
  }

  return md;
}

/**
 * Sanitize cell values against CSV formula injection (CWE-1236)
 */
function sanitizeCSVField(value: string | number | boolean | undefined | null): string {
  if (value === undefined || value === null) return '""';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  let str = String(value);
  const formulaTriggers = ['=', '+', '-', '@', '\t', '\r'];
  if (str.length > 0 && formulaTriggers.includes(str.charAt(0))) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Export tasks to CSV format with formula injection protection
 */
export function exportToCSV(tasks: Task[]): string {
  const headers = [
    'ID',
    'Title',
    'Description',
    'Category',
    'Priority',
    'Due Date',
    'Completed',
    'Pomodoros Estimated',
    'Pomodoros Completed',
    'Created At'
  ];
  const rows = tasks.map((t) => [
    sanitizeCSVField(t.id),
    sanitizeCSVField(t.title),
    sanitizeCSVField(t.description),
    sanitizeCSVField(t.category),
    sanitizeCSVField(t.priority),
    sanitizeCSVField(t.dueDate),
    sanitizeCSVField(t.completed ? 'YES' : 'NO'),
    t.estimatedPomodoros || 1,
    t.completedPomodoros || 0,
    sanitizeCSVField(t.createdAt)
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Export tasks and reminders to iCalendar (.ics) format
 */
export function exportToICalendar(tasks: Task[], reminders: Reminder[]): string {
  const formatICSDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Planr Lifestyle//Planr Calendar Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  for (const t of tasks) {
    if (!t.dueDate) continue;

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

export function exportWorkspaceAsJSON(): void {
  const bundle: ExportBundle = {
    version: 1,
    exportedAt: new Date().toISOString(),
    tasks: useTaskStore.getState().tasks,
    reminders: useReminderStore.getState().reminders,
    focusSessions: useTimerStore.getState().focusSessions,
    meta: {
      user: useMetaStore.getState().user,
      settings: useMetaStore.getState().settings,
      intention: useMetaStore.getState().intention
    }
  };

  const dateStr = getTodayDateString();
  downloadFile(
    JSON.stringify(bundle, null, 2),
    `planr-backup-${dateStr}.json`,
    'application/json'
  );
}

export async function restoreWorkspaceFromJSON(backupData: any): Promise<boolean> {
  if (!backupData || typeof backupData !== 'object') return false;

  try {
    const tasks: Task[] = Array.isArray(backupData.tasks) ? backupData.tasks : [];
    const reminders: Reminder[] = Array.isArray(backupData.reminders) ? backupData.reminders : [];
    const focusSessions: FocusSession[] = Array.isArray(backupData.focusSessions)
      ? backupData.focusSessions
      : [];

    useTaskStore.getState().setTasks(tasks);
    useReminderStore.getState().setReminders(reminders);
    useTimerStore.getState().setFocusSessions(focusSessions);

    if (backupData.meta?.user) {
      useMetaStore.getState().setUser(backupData.meta.user);
    }
    if (backupData.meta?.settings) {
      useMetaStore.getState().setSettings(backupData.meta.settings);
    }
    if (backupData.meta?.intention) {
      useMetaStore.getState().setIntention(backupData.meta.intention);
    }

    const {
      data: { session }
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (userId) {
      await Promise.all([
        ...tasks.map((t) => insertTaskDb(t, userId)),
        ...reminders.map((r) => insertReminderDb(r, userId)),
        ...focusSessions.map((f) => insertFocusSessionDb(f, userId)),
        upsertUserProfileDb(
          userId,
          backupData.meta?.user,
          backupData.meta?.settings,
          backupData.meta?.intention
        )
      ]);
    }
    return true;
  } catch (err) {
    console.error('Failed to restore backup data:', err);
    return false;
  }
}

export function exportTasksAsMarkdown(tasks: Task[]): void {
  const meta = useMetaStore.getState();
  const md = exportToMarkdown({
    tasks,
    reminders: useReminderStore.getState().reminders,
    focusSessions: useTimerStore.getState().focusSessions,
    user: meta.user,
    intention: meta.intention
  });
  const dateStr = getTodayDateString();
  downloadFile(md, `planr-tasks-${dateStr}.md`, 'text/markdown');
}

export function exportTasksAsCSV(tasks: Task[]): void {
  const csv = exportToCSV(tasks);
  const dateStr = getTodayDateString();
  downloadFile(csv, `planr-tasks-${dateStr}.csv`, 'text/csv');
}
