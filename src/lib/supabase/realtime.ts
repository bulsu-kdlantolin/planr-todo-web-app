import { supabase, isSupabaseConfigured } from './client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useTaskStore } from '../../store/useTaskStore';
import { useReminderStore } from '../../store/useReminderStore';
import { mapDbRowToTask, DbTaskRow } from './tasks';
import { mapDbRowToReminder, DbReminderRow } from './reminders';

let activeChannel: RealtimeChannel | null = null;

export function subscribeToUserRealtime(userId: string) {
  if (!isSupabaseConfigured() || !userId) return;

  if (activeChannel) {
    supabase.removeChannel(activeChannel);
    activeChannel = null;
  }

  activeChannel = supabase
    .channel(`user-sync-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        const { eventType, new: newRow, old: oldRow } = payload;
        const taskStore = useTaskStore.getState();

        if (eventType === 'INSERT') {
          const mapped = mapDbRowToTask(newRow as DbTaskRow);
          if (!taskStore.tasks.some((t) => t.id === mapped.id)) {
            taskStore.setTasks([mapped, ...taskStore.tasks]);
          }
        } else if (eventType === 'UPDATE') {
          const mapped = mapDbRowToTask(newRow as DbTaskRow);
          if (mapped.deletedAt) {
            taskStore.setTasks(taskStore.tasks.filter((t) => t.id !== mapped.id));
          } else {
            taskStore.setTasks(
              taskStore.tasks.map((t) => (t.id === mapped.id ? mapped : t))
            );
          }
        } else if (eventType === 'DELETE') {
          taskStore.setTasks(taskStore.tasks.filter((t) => t.id !== (oldRow as any).id));
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reminders',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        const { eventType, new: newRow, old: oldRow } = payload;
        const reminderStore = useReminderStore.getState();

        if (eventType === 'INSERT') {
          const mapped = mapDbRowToReminder(newRow as DbReminderRow);
          if (!reminderStore.reminders.some((r) => r.id === mapped.id)) {
            reminderStore.setReminders([...reminderStore.reminders, mapped]);
          }
        } else if (eventType === 'UPDATE') {
          const mapped = mapDbRowToReminder(newRow as DbReminderRow);
          if (mapped.deletedAt) {
            reminderStore.setReminders(
              reminderStore.reminders.filter((r) => r.id !== mapped.id)
            );
          } else {
            reminderStore.setReminders(
              reminderStore.reminders.map((r) => (r.id === mapped.id ? mapped : r))
            );
          }
        } else if (eventType === 'DELETE') {
          reminderStore.setReminders(
            reminderStore.reminders.filter((r) => r.id !== (oldRow as any).id)
          );
        }
      }
    )
    .subscribe();
}

export function unsubscribeFromUserRealtime() {
  if (activeChannel) {
    supabase.removeChannel(activeChannel);
    activeChannel = null;
  }
}
