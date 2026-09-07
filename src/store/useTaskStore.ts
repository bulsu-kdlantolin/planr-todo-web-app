import { create } from 'zustand';
import { Task, Subtask, TaskFilterType, TaskSortType } from '../types';
import { supabase } from '../lib/supabase/client';
import { insertTaskDb, updateTaskDb, deleteTaskDb } from '../lib/supabase/tasks';
import { audioManager } from '../utils/audio';
import { generateUUID } from '../utils/id';
import { calculateNextRecurrenceDate } from '../utils/date';
import { useReminderStore } from './useReminderStore';

export interface TaskTombstone {
  id: string;
  deletedAt: string;
}

interface TaskState {
  tasks: Task[];
  tombstones: TaskTombstone[];
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
  deleteTaskSeries: (seriesId: string) => Promise<Task[]>;
  stopTaskRecurrence: (taskId: string) => Promise<Task | null>;
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
  tombstones: [],
  filter: 'all',
  sort: 'dueDate',
  searchQuery: '',

  setTasks: (tasks) => {
    const tombstoneIds = new Set(get().tombstones.map((ts) => ts.id));
    const validTasks = tasks.filter((t) => !tombstoneIds.has(t.id));
    set({ tasks: validTasks });
  },
  setFilter: (filter) => set({ filter }),
  setSort: (sort) => set({ sort }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  addTask: async (taskData) => {
    const seriesId =
      taskData.repeat && taskData.repeat !== 'Once'
        ? taskData.recurringSeriesId || generateUUID('series')
        : undefined;

    const newTask: Task = {
      ...taskData,
      id: generateUUID('task'),
      recurringSeriesId: seriesId,
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
      let seriesId = current.recurringSeriesId;
      if (updates.repeat && updates.repeat !== 'Once' && !seriesId) {
        seriesId = generateUUID('series');
      } else if (updates.repeat === 'Once') {
        seriesId = undefined;
      }

      updatedTask = {
        ...current,
        ...updates,
        recurringSeriesId: seriesId !== undefined ? seriesId : current.recurringSeriesId,
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
    const seriesId = task.recurringSeriesId || task.id;

    let nextRecurringTask: Task | null = null;
    let taskToRemoveId: string | null = null;
    let nextSpawnedId = task.spawnedNextTaskId;

    if (nextCompleted && task.repeat && task.repeat !== 'Once') {
      // Guard against duplication: check if an uncompleted future task for this series already exists
      const existingPending = get().tasks.find(
        (t) => (t.recurringSeriesId === seriesId || t.id === seriesId) && !t.completed && t.id !== id
      );

      if (!existingPending) {
        const nextDueDate = calculateNextRecurrenceDate(
          task.dueDate,
          task.repeat,
          task.recurrenceConfig
        );
        if (nextDueDate) {
          nextRecurringTask = {
            ...task,
            id: generateUUID('task'),
            recurringSeriesId: seriesId,
            repeat: task.repeat,
            recurrenceConfig: task.recurrenceConfig,
            completed: false,
            completedAt: undefined,
            dueDate: nextDueDate,
            subtasks: (task.subtasks || []).map((s) => ({ ...s, completed: false })),
            revision: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          nextSpawnedId = nextRecurringTask.id;
        }
      } else {
        nextSpawnedId = existingPending.id;
      }
    } else if (!nextCompleted && task.repeat && task.repeat !== 'Once') {
      // Unchecking: clean up the uncompleted downstream task generated by this occurrence to avoid orphans/duplicates
      if (task.spawnedNextTaskId) {
        const spawned = get().tasks.find((t) => t.id === task.spawnedNextTaskId);
        if (spawned && !spawned.completed) {
          taskToRemoveId = spawned.id;
        }
      } else {
        const pendingInSeries = get().tasks.find(
          (t) => (t.recurringSeriesId === seriesId || t.id === seriesId) && !t.completed && t.id !== id
        );
        if (pendingInSeries) {
          taskToRemoveId = pendingInSeries.id;
        }
      }
      nextSpawnedId = undefined;
    }

    const updated: Task = {
      ...task,
      completed: nextCompleted,
      completedAt: nextCompleted ? new Date().toISOString() : undefined,
      recurringSeriesId: task.repeat && task.repeat !== 'Once' ? seriesId : task.recurringSeriesId,
      spawnedNextTaskId: nextSpawnedId,
      revision: (task.revision ?? 0) + 1,
      updatedAt: new Date().toISOString()
    };

    set((state) => {
      let nextTasks = state.tasks.map((t) => (t.id === id ? updated : t));
      if (taskToRemoveId) {
        nextTasks = nextTasks.filter((t) => t.id !== taskToRemoveId);
      }
      if (nextRecurringTask) {
        nextTasks = [nextRecurringTask, ...nextTasks];
      }
      return { tasks: nextTasks };
    });

    // Bidirectional Reminder Connection:
    // When marked as done (or undone) in tasks, keep any attached reminder synchronized
    try {
      useReminderStore.getState().setReminderCompletedByTaskId(id, nextCompleted, task.title).catch((err) =>
        console.error('Failed to sync linked reminder completion:', err)
      );
    } catch (err) {
      console.error('Failed to call setReminderCompletedByTaskId:', err);
    }

    const userId = await getUserId();
    if (userId) {
      updateTaskDb(updated, userId).catch((err) =>
        console.error('Failed to sync task toggle to Supabase:', err)
      );
      if (nextRecurringTask) {
        insertTaskDb(nextRecurringTask, userId).catch((err) =>
          console.error('Failed to sync next recurring task to Supabase:', err)
        );
      }
      if (taskToRemoveId) {
        deleteTaskDb(taskToRemoveId, userId).catch((err) =>
          console.error('Failed to remove uncompleted recurring task from Supabase:', err)
        );
      }
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
      tasks: state.tasks.filter((t) => t.id !== id),
      tombstones: [...state.tombstones, { id, deletedAt: new Date().toISOString() }]
    }));

    // Cascade deletion to associated reminder(s)
    useReminderStore.getState().deleteRemindersByTaskId(id, target.title).catch((err) =>
      console.error('Failed to cascade reminder deletion for task:', err)
    );

    const userId = await getUserId();
    if (userId) {
      deleteTaskDb(id, userId).catch((err) =>
        console.error('Failed to sync task deletion to Supabase:', err)
      );
    }
    return target;
  },

  deleteTaskSeries: async (seriesId: string) => {
    const targets = get().tasks.filter(
      (t) => t.recurringSeriesId === seriesId || t.id === seriesId
    );
    if (targets.length === 0) return [];

    const targetIds = new Set(targets.map((t) => t.id));
    const nowIso = new Date().toISOString();

    set((state) => ({
      tasks: state.tasks.filter((t) => !targetIds.has(t.id)),
      tombstones: [
        ...state.tombstones,
        ...targets.map((t) => ({ id: t.id, deletedAt: nowIso }))
      ]
    }));

    // Cascade deletion to associated series reminder(s)
    useReminderStore.getState().deleteRemindersByTaskIds(Array.from(targetIds)).catch((err) =>
      console.error('Failed to cascade series reminder deletion:', err)
    );

    const userId = await getUserId();
    if (userId) {
      for (const t of targets) {
        deleteTaskDb(t.id, userId).catch((err) =>
          console.error(`Failed to sync series task deletion ${t.id} to Supabase:`, err)
        );
      }
    }
    return targets;
  },

  stopTaskRecurrence: async (taskId: string) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return null;

    const updated: Task = {
      ...task,
      repeat: 'Once',
      recurrenceConfig: undefined,
      spawnedNextTaskId: undefined,
      revision: (task.revision ?? 0) + 1,
      updatedAt: new Date().toISOString()
    };

    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? updated : t))
    }));

    const userId = await getUserId();
    if (userId) {
      updateTaskDb(updated, userId).catch((err) =>
        console.error('Failed to sync stopTaskRecurrence to Supabase:', err)
      );
    }
    return updated;
  },

  restoreTask: async (task) => {
    const restored: Task = {
      ...task,
      revision: (task.revision ?? 0) + 1,
      updatedAt: new Date().toISOString()
    };
    set((state) => ({
      tasks: [restored, ...state.tasks],
      tombstones: state.tombstones.filter((ts) => ts.id !== task.id)
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
