import { Task, PriorityLevel, TaskFilterType, TaskSortType } from '../types';
import { getPriorityWeight } from './priority';
import { getTodayDateString } from './date';

/**
 * Filter tasks according to selected view filter criteria
 */
export function filterTasks(tasks: Task[], filter: TaskFilterType, searchQuery = ''): Task[] {
  const todayStr = getTodayDateString();
  const query = searchQuery.trim().toLowerCase();

  return tasks.filter((task) => {
    // Search query match
    if (query) {
      const matchTitle = task.title.toLowerCase().includes(query);
      const matchDesc = task.description?.toLowerCase().includes(query);
      const matchCategory = task.category.toLowerCase().includes(query);
      if (!matchTitle && !matchDesc && !matchCategory) return false;
    }

    // Category and status filters
    if (filter === 'today') {
      return task.dueDate === todayStr;
    }
    if (filter === 'upcoming') {
      return !task.completed && (!task.dueDate || task.dueDate >= todayStr);
    }
    if (filter === 'high') {
      return task.priority === 'urgent' || task.priority === 'high';
    }
    if (filter === 'completed') {
      return task.completed;
    }
    if (filter === 'work') {
      return task.category.toLowerCase() === 'work';
    }
    if (filter === 'personal') {
      return task.category.toLowerCase() === 'personal';
    }
    if (filter === 'mindful') {
      return task.category.toLowerCase() === 'mindful' || task.category.toLowerCase() === 'health';
    }

    return true;
  });
}

/**
 * Sort tasks according to chosen criteria
 */
export function sortTasks(tasks: Task[], sort: TaskSortType): Task[] {
  return [...tasks].sort((a, b) => {
    // Always put completed tasks at the bottom
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    if (sort === 'priority') {
      return getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
    }
    if (sort === 'dueDate') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    }
    if (sort === 'created') {
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    }
    if (sort === 'title') {
      return a.title.localeCompare(b.title);
    }

    return 0;
  });
}

/**
 * Calculate completion metrics for an array of tasks
 */
export function getTaskMetrics(tasks: Task[]) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const pending = total - completed;

  return { total, completed, pending, percent };
}
