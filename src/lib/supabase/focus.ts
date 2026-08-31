import { supabase, isSupabaseConfigured } from './client';
import { FocusSession } from '../../types';

export interface DbFocusSessionRow {
  id: string;
  user_id: string;
  task_id: string | null;
  task_title: string;
  duration_minutes: number;
  completed_at: string;
  type: string;
  break_preset: string | null;
  created_at: string;
  deleted_at: string | null;
}

export function mapDbRowToSession(row: DbFocusSessionRow): FocusSession {
  return {
    id: row.id,
    taskId: row.task_id || undefined,
    taskTitle: row.task_title || 'Deep Focus Session',
    durationMinutes: row.duration_minutes || 25,
    completedAt: row.completed_at,
    type: (row.type as any) || 'focus',
    breakPreset: (row.break_preset as any) || undefined
  };
}

export function mapSessionToDbRow(session: FocusSession, userId: string): Partial<DbFocusSessionRow> {
  return {
    id: session.id,
    user_id: userId,
    task_id: session.taskId || null,
    task_title: session.taskTitle,
    duration_minutes: session.durationMinutes,
    completed_at: session.completedAt || new Date().toISOString(),
    type: session.type,
    break_preset: session.breakPreset || null,
    created_at: session.completedAt || new Date().toISOString(),
    deleted_at: null
  };
}

export async function fetchUserFocusSessions(userId: string): Promise<FocusSession[]> {
  if (!isSupabaseConfigured() || !userId) return [];

  const { data, error } = await supabase
    .from('focus_sessions')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('completed_at', { ascending: false });

  if (error) {
    console.error('Error fetching focus sessions from Supabase:', error);
    return [];
  }

  return (data || []).map(mapDbRowToSession);
}

export async function insertFocusSessionDb(session: FocusSession, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !userId) return true;

  const row = mapSessionToDbRow(session, userId);
  const { error } = await supabase.from('focus_sessions').upsert(row);

  if (error) {
    console.error('Error inserting focus session to Supabase:', error);
    return false;
  }
  return true;
}
