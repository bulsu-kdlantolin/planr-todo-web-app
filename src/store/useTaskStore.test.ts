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

  it('schedules next recurrence when a recurring task is completed', async () => {
    const today = new Date().toISOString().split('T')[0];
    const task = await useTaskStore.getState().addTask({
      title: 'Daily Standup',
      category: 'Work',
      priority: 'high',
      dueDate: today,
      repeat: 'Daily',
      estimatedPomodoros: 1,
      subtasks: [{ id: 'sub-1', title: 'Share blocker', completed: true }]
    });

    await useTaskStore.getState().toggleTask(task.id);

    const allTasks = useTaskStore.getState().tasks;
    expect(allTasks.length).toBe(2);

    const completed = allTasks.find((t) => t.id === task.id);
    expect(completed?.completed).toBe(true);

    const nextTask = allTasks.find((t) => t.id !== task.id);
    expect(nextTask?.completed).toBe(false);
    expect(nextTask?.repeat).toBe('Daily');
    expect(nextTask?.subtasks[0].completed).toBe(false);
  });

  it('removes spawned recurrence on uncheck and prevents duplicates on repeated toggle', async () => {
    const today = new Date().toISOString().split('T')[0];
    const task = await useTaskStore.getState().addTask({
      title: 'Morning Yoga',
      category: 'Health',
      priority: 'medium',
      dueDate: today,
      repeat: 'Daily',
      estimatedPomodoros: 1,
      subtasks: []
    });

    // 1. Mark complete: should spawn 1 new task (total: 2)
    await useTaskStore.getState().toggleTask(task.id);
    let tasks = useTaskStore.getState().tasks;
    expect(tasks.length).toBe(2);

    // 2. Uncheck: should clean up the spawned task (total: 1)
    await useTaskStore.getState().toggleTask(task.id);
    tasks = useTaskStore.getState().tasks;
    expect(tasks.length).toBe(1);
    expect(tasks[0].id).toBe(task.id);
    expect(tasks[0].completed).toBe(false);

    // 3. Mark complete again: should spawn exactly 1 new task (total: 2, NO duplicates!)
    await useTaskStore.getState().toggleTask(task.id);
    tasks = useTaskStore.getState().tasks;
    expect(tasks.length).toBe(2);

    // 4. Uncheck and re-check again: should never exceed 2 tasks
    await useTaskStore.getState().toggleTask(task.id);
    await useTaskStore.getState().toggleTask(task.id);
    tasks = useTaskStore.getState().tasks;
    expect(tasks.length).toBe(2);
  });

  it('deletes all tasks in a recurring series via deleteTaskSeries', async () => {
    const today = new Date().toISOString().split('T')[0];
    const task = await useTaskStore.getState().addTask({
      title: 'Weekly Sync',
      category: 'Work',
      priority: 'high',
      dueDate: today,
      repeat: 'Weekly',
      estimatedPomodoros: 1,
      subtasks: []
    });

    // Toggle to generate next instance in series
    await useTaskStore.getState().toggleTask(task.id);
    let tasks = useTaskStore.getState().tasks;
    expect(tasks.length).toBe(2);

    const seriesId = tasks[0].recurringSeriesId!;
    expect(seriesId).toBeDefined();

    // Delete entire series
    const deleted = await useTaskStore.getState().deleteTaskSeries(seriesId);
    expect(deleted.length).toBe(2);
    expect(useTaskStore.getState().tasks.length).toBe(0);
  });

  it('stops recurrence on a task without deleting it', async () => {
    const task = await useTaskStore.getState().addTask({
      title: 'Reading Book',
      category: 'Personal',
      priority: 'low',
      repeat: 'Daily',
      estimatedPomodoros: 1,
      subtasks: []
    });

    const stopped = await useTaskStore.getState().stopTaskRecurrence(task.id);
    expect(stopped?.repeat).toBe('Once');
    expect(useTaskStore.getState().tasks.find((t) => t.id === task.id)?.repeat).toBe('Once');
  });
});


