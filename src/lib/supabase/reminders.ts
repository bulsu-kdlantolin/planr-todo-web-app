import { supabase, isSupabaseConfigured } from './client';
import { Reminder } from '../../types';

export interface DbReminderRow {
  id: string;
  user_id: string;
  title: string;
  time: string;
  period: string;
  repeat: string;
  scheduled_date: string | null;
  sound: boolean;
  active: boolean;
  completed: boolean;
  description: string;
  revision: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export function mapDbRowToReminder(row: DbReminderRow): Reminder {
  return {
    id: row.id,
    title: row.title,
    time: row.time,
    period: (row.period || 'Morning') as any,
    repeat: (row.repeat || 'Daily') as any,
    scheduledDate: row.scheduled_date || undefined,
    sound: Boolean(row.sound),
    active: Boolean(row.active),
    completed: Boolean(row.completed),
    description: row.description || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at || null,
    revision: row.revision || 1
  };
}

export function mapReminderToDbRow(reminder: Reminder, userId: string): Partial<DbReminderRow> {
  return {
    id: reminder.id,
    user_id: userId,
    title: reminder.title,
    time: reminder.time,
    period: reminder.period,
    repeat: reminder.repeat,
    scheduled_date: reminder.scheduledDate || null,
    sound: reminder.sound,
    active: reminder.active,
    completed: reminder.completed,
    description: reminder.description || '',
    revision: (reminder.revision || 0) + 1,
    created_at: reminder.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: reminder.deletedAt || null
  };
}

export async function fetchUserReminders(userId: string): Promise<Reminder[]> {
  if (!isSupabaseConfigured() || !userId) return [];

  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('time', { ascending: true });

  if (error) {
    console.error('Error fetching reminders from Supabase:', error);
    return [];
  }

  return (data || []).map(mapDbRowToReminder);
}

export async function insertReminderDb(reminder: Reminder, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !userId) return true;

  const row = mapReminderToDbRow(reminder, userId);
  const { error } = await supabase.from('reminders').upsert(row);

  if (error) {
    console.error('Error inserting reminder to Supabase:', error);
    return false;
  }
  return true;
}

export async function updateReminderDb(reminder: Reminder, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !userId) return true;

  const row = mapReminderToDbRow(reminder, userId);
  const { error } = await supabase
    .from('reminders')
    .update(row)
    .eq('id', reminder.id)
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating reminder in Supabase:', error);
    return false;
  }
  return true;
}

export async function deleteReminderDb(reminderId: string, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !userId) return true;

  const { error } = await supabase
    .from('reminders')
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', reminderId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting reminder in Supabase:', error);
    return false;
  }
  return true;
}
