import { create } from 'zustand';
import { Task, Subtask, TaskFilterType, TaskSortType } from '../types';
import { supabase } from '../lib/supabase/client';
import { insertTaskDb, updateTaskDb, deleteTaskDb } from '../lib/supabase/tasks';
import { audioManager } from '../utils/audio';
import { generateUUID } from '../utils/id';

interface TaskState {
  tasks: Task[];
  filter: TaskFilterType;
  sort: TaskSortType;
  searchQuery: string;
  setTasks: (tasks: Task[]) => void;
  setFilter: (filter: TaskFilterType) => void;
  setSort: (sort: TaskSortType) => void;
  setSearchQuery: (query: string) => void;
  addTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'completed' | 'completedPomodoros'>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<Task | null>;
  toggleTask: (id: string) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  deleteTask: (id: string) => Promise<Task | null>;
  restoreTask: (task: Task) => Promise<void>;
  reorderTasks: (startIndex: number, endIndex: number) => void;
}

const getUserId = async (): Promise<string | null> => {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id || null;
  } catch {
    return null;
  }
};

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  filter: 'all',
  sort: 'dueDate',
  searchQuery: '',

  setTasks: (tasks) => set({ tasks }),
  setFilter: (filter) => set({ filter }),
  setSort: (sort) => set({ sort }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  addTask: async (taskData) => {
    const newTask: Task = {
      ...taskData,
      id: generateUUID('task'),
      completed: false,
      completedPomodoros: 0,
      revision: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    set((state) => ({ tasks: [newTask, ...state.tasks] }));

    const userId = await getUserId();
    if (userId) {
      insertTaskDb(newTask, userId).catch((err) =>
        console.error('Failed to sync task creation to Supabase:', err)
      );
    }
    return newTask;
  },

  updateTask: async (id, updates) => {
    let updatedTask: Task | null = null;
    set((state) => {
      const idx = state.tasks.findIndex((t) => t.id === id);
      if (idx === -1) return state;
      const current = state.tasks[idx];
      updatedTask = {
        ...current,
        ...updates,
        revision: (current.revision ?? 0) + 1,
        updatedAt: new Date().toISOString()
      };
      const next = [...state.tasks];
      next[idx] = updatedTask;
      return { tasks: next };
    });

    if (updatedTask) {
      const userId = await getUserId();
      if (userId) {
        updateTaskDb(updatedTask, userId).catch((err) =>
          console.error('Failed to sync task update to Supabase:', err)
        );
      }
    }
    return updatedTask;
  },

  toggleTask: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    audioManager.playTick();
    const nextCompleted = !task.completed;
    const updated: Task = {
      ...task,
      completed: nextCompleted,
      completedAt: nextCompleted ? new Date().toISOString() : undefined,
      revision: (task.revision ?? 0) + 1,
      updatedAt: new Date().toISOString()
    };

    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? updated : t))
    }));

    const userId = await getUserId();
    if (userId) {
      updateTaskDb(updated, userId).catch((err) =>
        console.error('Failed to sync task toggle to Supabase:', err)
      );
    }
  },

  toggleSubtask: async (taskId, subtaskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    audioManager.playTick();
    const updatedSubtasks: Subtask[] = task.subtasks.map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    const updated: Task = {
      ...task,
      subtasks: updatedSubtasks,
      revision: (task.revision ?? 0) + 1,
      updatedAt: new Date().toISOString()
    };

    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? updated : t))
    }));

    const userId = await getUserId();
    if (userId) {
      updateTaskDb(updated, userId).catch((err) =>
        console.error('Failed to sync subtask toggle to Supabase:', err)
      );
    }
  },

  deleteTask: async (id) => {
    const target = get().tasks.find((t) => t.id === id) || null;
    if (!target) return null;

    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id)
    }));

    const userId = await getUserId();
    if (userId) {
      deleteTaskDb(id, userId).catch((err) =>
        console.error('Failed to sync task deletion to Supabase:', err)
      );
    }
    return target;
  },

  restoreTask: async (task) => {
    const restored: Task = {
      ...task,
      revision: (task.revision ?? 0) + 1,
      updatedAt: new Date().toISOString()
    };
    set((state) => ({
      tasks: [restored, ...state.tasks]
    }));

    const userId = await getUserId();
    if (userId) {
      insertTaskDb(restored, userId).catch((err) =>
        console.error('Failed to restore task in Supabase:', err)
      );
    }
  },

  reorderTasks: (startIndex, endIndex) => {
    set((state) => {
      const result = Array.from(state.tasks);
      const [removed] = result.splice(startIndex, 1);
      if (removed) {
        result.splice(endIndex, 0, removed);
      }
      return { tasks: result };
    });
  }
}));
