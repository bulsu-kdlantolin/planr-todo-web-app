import React, { useDeferredValue, useMemo } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { useTimerStore } from '../store/useTimerStore';
import { useUIStore } from '../store/useUIStore';
import { TaskCard } from '../components/tasks/TaskCard';
import { QuickAddBar } from '../components/tasks/QuickAddBar';
import { Select, SelectOption } from '../components/common/Select';
import { TaskFilterType, TaskSortType } from '../types';
import { filterTasks, sortTasks, getTaskMetrics } from '../utils/tasks';
import { getTodayDateString } from '../utils/date';
import {
  Plus,
  Search,
  CheckSquare
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

  const handleFocusTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setActiveView('focus');
  };

  const handlePlanForToday = async (taskId: string) => {
    const today = getTodayDateString();
    await updateTask(taskId, { dueDate: today });
    showToast('Task scheduled for Today ☀️');
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
            <span className="text-xs font-semibold text-secondary uppercase tracking-widest">
              Task List
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-surface-low border border-outline-subtle text-secondary font-medium">
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
          className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary-container hover:bg-primary text-on-primary-container text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm self-start sm:self-auto active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>New Task</span>
        </button>
      </div>

      {/* Inline Quick-Add Input Bar */}
      <QuickAddBar />

      {/* Search & Sort Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
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
        <div className="flex items-center gap-2 min-w-[170px]">
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
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              filter === tab.id
                ? 'bg-surface-low text-on-surface font-semibold shadow-card border border-outline-variant'
                : 'text-secondary hover:text-on-surface hover:bg-surface-low/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Task List Grid */}
      {sortedTasks.length === 0 ? (
        <div className="bg-surface-low border border-dashed border-outline-variant rounded-lg p-12 text-center space-y-3">
          <CheckSquare className="w-8 h-8 text-secondary mx-auto opacity-50" aria-hidden="true" />
          <h3 className="font-serif text-lg font-medium text-on-surface">Clear slate. Clear mind.</h3>
          <p className="text-xs text-secondary max-w-sm mx-auto font-sans">
            {searchQuery
              ? `No tasks matching "${searchQuery}". Clear your search to see other tasks.`
              : 'You have zero pending tasks in this view. Ready to schedule something meaningful?'}
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-3.5 py-2 bg-surface-lowest border border-outline-variant text-secondary hover:text-on-surface text-xs font-semibold rounded-md transition-colors shadow-sm"
              >
                Clear Search
              </button>
            )}
            <button
              type="button"
              onClick={() => openTaskModal()}
              className="px-4 py-2 bg-primary-container text-on-primary-container hover:bg-primary text-xs font-semibold uppercase tracking-wider rounded-md transition-colors shadow-sm"
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
  );
};
