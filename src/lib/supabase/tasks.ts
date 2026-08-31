import { supabase, isSupabaseConfigured } from './client';
import { Task } from '../../types';
import { getPriorityWeight, weightToPriority } from '../../utils/priority';

export interface DbTaskRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  due_date: string | null;
  priority: number;
  duration_minutes: number;
  estimated_pomodoros: number;
  revision: number;
  is_completed: boolean;
  completed_at: string | null;
  subtasks: any[];
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export function mapDbRowToTask(row: DbTaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    category: (row.category || 'Work') as any,
    priority: weightToPriority(row.priority),
    dueDate: row.due_date || undefined,
    completed: Boolean(row.is_completed),
    completedAt: row.completed_at || undefined,
    estimatedPomodoros: row.estimated_pomodoros || 1,
    completedPomodoros: 0,
    subtasks: Array.isArray(row.subtasks) ? row.subtasks : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at || null,
    revision: row.revision || 1
  };
}

export function mapTaskToDbRow(task: Task, userId: string): Partial<DbTaskRow> {
  return {
    id: task.id,
    user_id: userId,
    title: task.title,
    description: task.description || '',
    category: task.category,
    priority: getPriorityWeight(task.priority),
    due_date: task.dueDate || null,
    is_completed: task.completed,
    completed_at: task.completedAt || null,
    estimated_pomodoros: task.estimatedPomodoros || 1,
    subtasks: task.subtasks || [],
    revision: (task.revision || 0) + 1,
    created_at: task.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: task.deletedAt || null
  };
}

export async function fetchUserTasks(userId: string): Promise<Task[]> {
  if (!isSupabaseConfigured() || !userId) return [];

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tasks from Supabase:', error);
    return [];
  }

  return (data || []).map(mapDbRowToTask);
}

export async function insertTaskDb(task: Task, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !userId) return true;

  const row = mapTaskToDbRow(task, userId);
  const { error } = await supabase.from('tasks').upsert(row);

  if (error) {
    console.error('Error inserting task to Supabase:', error);
    return false;
  }
  return true;
}

export async function updateTaskDb(task: Task, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !userId) return true;

  const row = mapTaskToDbRow(task, userId);
  const { error } = await supabase
    .from('tasks')
    .update(row)
    .eq('id', task.id)
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating task in Supabase:', error);
    return false;
  }
  return true;
}

export async function deleteTaskDb(taskId: string, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !userId) return true;

  // Soft delete
  const { error } = await supabase
    .from('tasks')
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', taskId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error soft-deleting task in Supabase:', error);
    return false;
  }
  return true;
}
