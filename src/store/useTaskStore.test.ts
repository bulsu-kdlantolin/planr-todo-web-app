import { describe, it, expect, beforeEach } from 'vitest';
import { useTaskStore } from './useTaskStore';

describe('useTaskStore', () => {
  beforeEach(() => {
    useTaskStore.getState().setTasks([]);
  });

  it('adds a new task and assigns defaults', async () => {
    const task = await useTaskStore.getState().addTask({
      title: 'Complete Council Audits',
      category: 'Work',
      priority: 'urgent',
      estimatedPomodoros: 2,
      subtasks: []
    });

    expect(task.id).toBeDefined();
    expect(task.title).toBe('Complete Council Audits');
    expect(task.completed).toBe(false);
    expect(useTaskStore.getState().tasks.length).toBe(1);
  });

  it('toggles task completion status', async () => {
    const task = await useTaskStore.getState().addTask({
      title: 'Review PRs',
      category: 'Work',
      priority: 'medium',
      estimatedPomodoros: 1,
      subtasks: []
    });

    await useTaskStore.getState().toggleTask(task.id);
    const updated = useTaskStore.getState().tasks.find((t) => t.id === task.id);
    expect(updated?.completed).toBe(true);

    await useTaskStore.getState().toggleTask(task.id);
    const reverted = useTaskStore.getState().tasks.find((t) => t.id === task.id);
    expect(reverted?.completed).toBe(false);
  });

  it('deletes and restores a task via undo', async () => {
    const task = await useTaskStore.getState().addTask({
      title: 'Temporary Task',
      category: 'Work',
      priority: 'low',
      estimatedPomodoros: 1,
      subtasks: []
    });

    const deleted = await useTaskStore.getState().deleteTask(task.id);
    expect(deleted?.id).toBe(task.id);
    expect(useTaskStore.getState().tasks.length).toBe(0);

    if (deleted) {
      await useTaskStore.getState().restoreTask(deleted);
      expect(useTaskStore.getState().tasks.length).toBe(1);
      expect(useTaskStore.getState().tasks[0].title).toBe('Temporary Task');
    }
  });

  it('updates task properties', async () => {
    const task = await useTaskStore.getState().addTask({
      title: 'Initial Title',
      category: 'Work',
      priority: 'medium',
      estimatedPomodoros: 1,
      subtasks: []
    });

    await useTaskStore.getState().updateTask(task.id, {
      title: 'Updated Title',
      priority: 'high'
    });

    const updated = useTaskStore.getState().tasks.find((t) => t.id === task.id);
    expect(updated?.title).toBe('Updated Title');
    expect(updated?.priority).toBe('high');
  });
});
