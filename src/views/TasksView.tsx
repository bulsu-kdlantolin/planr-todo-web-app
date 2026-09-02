import React, { useDeferredValue, useMemo } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { useTimerStore } from '../store/useTimerStore';
import { useUIStore } from '../store/useUIStore';
import { TaskCard } from '../components/tasks/TaskCard';
import { QuickAddBar } from '../components/tasks/QuickAddBar';
import { Select, SelectOption } from '../components/common/Select';
import { TaskFilterType, TaskSortType, TaskCategory } from '../types';
import { filterTasks, sortTasks, getTaskMetrics } from '../utils/tasks';
import { getTodayDateString } from '../utils/date';
import {
  Plus,
  Search,
  CheckSquare,
  Clock,
  PieChart,
  Tag,
  Flame,
  Sparkles,
  Command,
  CheckCircle2
} from 'lucide-react';

export const TasksView: React.FC = () => {
  const tasks = useTaskStore((state) => state.tasks);
  const toggleTask = useTaskStore((state) => state.toggleTask);
  const toggleSubtask = useTaskStore((state) => state.toggleSubtask);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const updateTask = useTaskStore((state) => state.updateTask);
  const filter = useTaskStore((state) => state.filter);
  const setFilter = useTaskStore((state) => state.setFilter);
  const sort = useTaskStore((state) => state.sort);
  const setSort = useTaskStore((state) => state.setSort);
  const searchQuery = useTaskStore((state) => state.searchQuery);
  const setSearchQuery = useTaskStore((state) => state.setSearchQuery);

  const setSelectedTaskId = useTimerStore((state) => state.setSelectedTaskId);
  const openTaskModal = useUIStore((state) => state.openTaskModal);
  const setActiveView = useUIStore((state) => state.setActiveView);
  const showToast = useUIStore((state) => state.showToast);

  const deferredSearch = useDeferredValue(searchQuery);

  // Filter and Sort using centralized domain utilities
  const filteredTasks = useMemo(() => {
    return filterTasks(tasks, filter, deferredSearch);
  }, [tasks, filter, deferredSearch]);

  const sortedTasks = useMemo(() => {
    return sortTasks(filteredTasks, sort);
  }, [filteredTasks, sort]);

  const { total, completed, pending } = useMemo(() => getTaskMetrics(tasks), [tasks]);
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const totalEstimatedMins = useMemo(() => {
    return tasks
      .filter((t) => !t.completed)
      .reduce((acc, t) => acc + (t.estimatedPomodoros || 1) * 25, 0);
  }, [tasks]);

  const categoryCounts = useMemo(() => {
    const list: TaskCategory[] = ['Work', 'Design', 'Personal', 'Mindful', 'Health'];
    return list.map((cat) => ({
      category: cat,
      pending: tasks.filter((t) => !t.completed && t.category === cat).length,
      total: tasks.filter((t) => t.category === cat).length
    }));
  }, [tasks]);

  const priorityCounts = useMemo(() => {
    return {
      urgent: tasks.filter((t) => !t.completed && t.priority === 'urgent').length,
      high: tasks.filter((t) => !t.completed && t.priority === 'high').length,
      medium: tasks.filter((t) => !t.completed && t.priority === 'medium').length,
      low: tasks.filter((t) => !t.completed && t.priority === 'low').length
    };
  }, [tasks]);

  const handleFocusTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setActiveView('focus');
  };

  const handlePlanForToday = async (taskId: string) => {
    const today = getTodayDateString();
    await updateTask(taskId, { dueDate: today });
    showToast('Task scheduled for Today ☀️', 'success');
  };

  const handleDeleteTaskWithToast = async (id: string) => {
    const deleted = await deleteTask(id);
    if (deleted) {
      showToast(`Task "${deleted.title}" deleted`, 'info', 'Undo', () => {
        useTaskStore.getState().restoreTask(deleted);
      });
    }
  };

  const filterTabs: { id: TaskFilterType; label: string }[] = [
    { id: 'all', label: 'All Tasks' },
    { id: 'today', label: 'Today' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'high', label: 'High Priority' },
    { id: 'work', label: 'Work' },
    { id: 'personal', label: 'Personal' },
    { id: 'mindful', label: 'Mindful' },
    { id: 'completed', label: 'Completed' }
  ];

  const sortOptions: SelectOption<TaskSortType>[] = [
    { value: 'dueDate', label: 'Due Date' },
    { value: 'priority', label: 'Priority' },
    { value: 'created', label: 'Recently Added' },
    { value: 'title', label: 'Alphabetical' }
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-fade-in space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-outline-subtle gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-secondary uppercase tracking-widest font-sans">
              Task List
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface-low border border-outline-subtle text-secondary font-medium">
              {pending} active • {completed} completed
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-on-surface">
            Tasks
          </h1>
        </div>

        <button
          type="button"
          onClick={() => openTaskModal()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary-container hover:bg-primary text-on-primary-container text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm self-start sm:self-auto active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>New Task</span>
        </button>
      </div>

      {/* Inline Quick-Add Input Bar */}
      <QuickAddBar />

      {/* 2-Column Responsive Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* Main Task Column (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Search & Sort Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks, tags, notes..."
                aria-label="Search tasks"
                className="w-full pl-10 pr-4 py-2.5 bg-surface-low border border-outline-variant rounded-md text-xs text-on-surface focus:border-primary-container focus:outline-none placeholder:text-secondary shadow-card"
              />
            </div>

            {/* Custom Animated Sort Select */}
            <div className="flex items-center gap-2 min-w-[160px]">
              <span className="text-xs text-secondary font-medium whitespace-nowrap">
                Sort:
              </span>
              <div className="flex-1">
                <Select<TaskSortType>
                  value={sort}
                  onChange={(val) => setSort(val)}
                  options={sortOptions}
                  ariaLabel="Sort tasks by"
                />
              </div>
            </div>
          </div>

          {/* Filter Navigation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-outline-subtle scrollbar-none" role="tablist" aria-label="Task filters">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={filter === tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  filter === tab.id
                    ? 'bg-surface-low text-on-surface font-semibold shadow-card border border-outline-variant'
                    : 'text-secondary hover:text-on-surface hover:bg-surface-low/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Task List Items */}
          {sortedTasks.length === 0 ? (
            <div className="bg-surface-low border border-dashed border-outline-variant rounded-xl p-12 text-center space-y-3 shadow-xs">
              <CheckSquare className="w-8 h-8 text-secondary mx-auto opacity-50" aria-hidden="true" />
              <h3 className="font-serif text-lg font-medium text-on-surface">No tasks found</h3>
              <p className="text-xs text-secondary max-w-sm mx-auto font-sans leading-relaxed">
                {searchQuery
                  ? `No tasks matching "${searchQuery}". Clear your search to see all tasks.`
                  : 'You have no pending tasks in this view. Add a new task above to get started.'}
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="px-3.5 py-2 bg-surface-lowest border border-outline-variant text-secondary hover:text-on-surface text-xs font-semibold rounded-md transition-colors shadow-sm cursor-pointer"
                  >
                    Clear Search
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openTaskModal()}
                  className="px-4 py-2 bg-primary-container text-on-primary-container hover:bg-primary text-xs font-semibold uppercase tracking-wider rounded-md transition-colors shadow-sm cursor-pointer"
                >
                  Create Task
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={toggleTask}
                  onToggleSubtask={toggleSubtask}
                  onEdit={(t) => openTaskModal(t)}
                  onDelete={handleDeleteTaskWithToast}
                  onFocus={handleFocusTask}
                  onPlanToday={handlePlanForToday}
                />
              ))}
            </div>
          )}
        </div>

        {/* Companion Sidebar Column (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Workload & Completion Gauge Card */}
          <div className="bg-surface-lowest border border-outline-variant rounded-xl p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-outline-subtle pb-3">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-tertiary" aria-hidden="true" />
                <h3 className="font-serif text-sm font-semibold text-on-surface">Progress Summary</h3>
              </div>
              <span className="text-xs font-bold text-primary font-sans">{completionRate}% Done</span>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-container rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-secondary font-sans">
                <span>{completed} Completed</span>
                <span>{pending} Active</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-outline-subtle">
              <div className="p-3 bg-surface-low rounded-lg">
                <span className="text-[10px] uppercase font-bold tracking-wider text-secondary block font-sans">
                  Est. Focus
                </span>
                <span className="font-serif text-lg font-bold text-on-surface">
                  {totalEstimatedMins >= 60
                    ? `${Math.floor(totalEstimatedMins / 60)}h ${totalEstimatedMins % 60}m`
                    : `${totalEstimatedMins}m`}
                </span>
              </div>
              <div className="p-3 bg-surface-low rounded-lg">
                <span className="text-[10px] uppercase font-bold tracking-wider text-secondary block font-sans">
                  Urgent & High
                </span>
                <span className="font-serif text-lg font-bold text-red-600 dark:text-red-400">
                  {priorityCounts.urgent + priorityCounts.high}
                </span>
              </div>
            </div>
          </div>

          {/* Categories Filter Pills Card */}
          <div className="bg-surface-lowest border border-outline-variant rounded-xl p-5 shadow-card space-y-3.5">
            <div className="flex items-center gap-2 border-b border-outline-subtle pb-2.5">
              <Tag className="w-4 h-4 text-tertiary" aria-hidden="true" />
              <h3 className="font-serif text-sm font-semibold text-on-surface">Categories</h3>
            </div>

            <div className="space-y-1.5">
              {categoryCounts.map(({ category, pending: catPending, total: catTotal }) => {
                const isActive = filter === category.toLowerCase();
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setFilter(isActive ? 'all' : (category.toLowerCase() as TaskFilterType))}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'bg-primary-container text-on-primary-container font-semibold shadow-xs'
                        : 'bg-surface-low hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    <span className="font-medium">{category}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-sans ${
                        isActive
                          ? 'bg-primary/20 text-on-primary-container'
                          : 'bg-surface-container text-secondary'
                      }`}
                    >
                      {catPending} active
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority Highlights Card */}
          <div className="bg-surface-lowest border border-outline-variant rounded-xl p-5 shadow-card space-y-3">
            <div className="flex items-center gap-2 border-b border-outline-subtle pb-2.5">
              <Flame className="w-4 h-4 text-orange-500" aria-hidden="true" />
              <h3 className="font-serif text-sm font-semibold text-on-surface">Priority Breakdown</h3>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-900/30 flex items-center justify-between">
                <span className="text-red-700 dark:text-red-300 font-medium">Urgent</span>
                <span className="font-bold text-red-800 dark:text-red-200">{priorityCounts.urgent}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/30 flex items-center justify-between">
                <span className="text-amber-700 dark:text-amber-300 font-medium">High</span>
                <span className="font-bold text-amber-800 dark:text-amber-200">{priorityCounts.high}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/30 flex items-center justify-between">
                <span className="text-blue-700 dark:text-blue-300 font-medium">Medium</span>
                <span className="font-bold text-blue-800 dark:text-blue-200">{priorityCounts.medium}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-stone-100 dark:bg-stone-900/40 border border-outline-subtle flex items-center justify-between">
                <span className="text-secondary font-medium">Low</span>
                <span className="font-bold text-on-surface">{priorityCounts.low}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
