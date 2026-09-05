import React, { useEffect, useState } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { useReminderStore } from '../store/useReminderStore';
import { useTimerStore } from '../store/useTimerStore';
import { useMetaStore } from '../store/useMetaStore';
import { useUIStore } from '../store/useUIStore';
import { TaskCard } from '../components/tasks/TaskCard';
import { WeeklyAnalytics } from '../components/analytics/WeeklyAnalytics';
import { DailyMetricsCards } from '../components/daily/DailyMetricsCards';
import { DailyRemindersCard } from '../components/daily/DailyRemindersCard';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { Task } from '../types';
import { getPriorityWeight } from '../utils/priority';
import { getTodayDateString, formatHeaderDate, getLocalGreeting } from '../utils/date';
import { generateIntentionCardImage } from '../utils/intentionCard';
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Plus,
  Edit2,
  Share2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Inbox
} from 'lucide-react';

export const DailyOverviewView: React.FC = () => {
  const [currentDateStr, setCurrentDateStr] = useState(getTodayDateString());
  const [showAllTasks, setShowAllTasks] = useState(false);

  // Auto-refresh date at midnight or on tab focus
  useEffect(() => {
    const checkDate = () => {
      const fresh = getTodayDateString();
      if (fresh !== currentDateStr) {
        setCurrentDateStr(fresh);
      }
    };

    const interval = setInterval(checkDate, 30000);
    const handleVisibility = () => {
      if (!document.hidden) checkDate();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [currentDateStr]);

  const tasks = useTaskStore((state) => state.tasks);
  const toggleTask = useTaskStore((state) => state.toggleTask);
  const toggleSubtask = useTaskStore((state) => state.toggleSubtask);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const updateTask = useTaskStore((state) => state.updateTask);

  const reminders = useReminderStore((state) => state.reminders);
  const toggleReminder = useReminderStore((state) => state.toggleReminder);
  const focusSessions = useTimerStore((state) => state.focusSessions);
  const setSelectedTaskId = useTimerStore((state) => state.setSelectedTaskId);

  const user = useMetaStore((state) => state.user);
  const intention = useMetaStore((state) => state.intention);
  const timeFormat = useMetaStore((state) => state.settings.timeFormat || '12h');

  const openTaskModal = useUIStore((state) => state.openTaskModal);
  const openIntentionModal = useUIStore((state) => state.openIntentionModal);
  const setActiveView = useUIStore((state) => state.setActiveView);
  const showToast = useUIStore((state) => state.showToast);

  const greeting = getLocalGreeting();
  const dateFormatted = formatHeaderDate();
  const todayStr = currentDateStr;

  // Day of week check (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const currentDayOfWeek = new Date().getDay();
  const isWeekday = currentDayOfWeek >= 1 && currentDayOfWeek <= 5;

  // Date-Aware Tasks Filtering
  const dueTodayTasks = tasks.filter((t) => t.dueDate === todayStr && !t.completed);
  const overdueTasks = tasks.filter((t) => !t.completed && t.dueDate && t.dueDate < todayStr);
  const completedTodayTasks = tasks.filter(
    (t) => t.completed && (t.completedAt ? t.completedAt.split('T')[0] === todayStr : t.dueDate === todayStr)
  );

  const todayActiveTasks = [...overdueTasks, ...dueTodayTasks];
  const totalTrackedToday = todayActiveTasks.length + completedTodayTasks.length;
  const completedCount = completedTodayTasks.length;
  const percentage = totalTrackedToday === 0 ? 0 : Math.round((completedCount / totalTrackedToday) * 100);
  const isAllDone = totalTrackedToday > 0 && percentage === 100;

  const totalEstimatedMinutes = todayActiveTasks.reduce((sum, t) => sum + (t.estimatedPomodoros || 1) * 25, 0);

  // Focus sessions completed today
  const todaySessions = focusSessions.filter((s) => s.completedAt && s.completedAt.split('T')[0] === todayStr);
  const focusMinutesToday = todaySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

  // Reminders scheduled/active for today
  const todayReminders = reminders.filter((r) => {
    if (!r.active) return false;
    if (r.repeat === 'Daily') return true;
    if (r.repeat === 'Weekdays') return isWeekday;
    if (r.repeat === 'Weekly') return true;
    if (r.repeat === 'Once') return !r.scheduledDate || r.scheduledDate === todayStr;
    return true;
  });

  // Priority Sort for Today's Queue
  const priorityTasks = [...todayActiveTasks, ...completedTodayTasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const aOverdue = a.dueDate && a.dueDate < todayStr ? 1 : 0;
    const bOverdue = b.dueDate && b.dueDate < todayStr ? 1 : 0;
    if (aOverdue !== bOverdue) return bOverdue - aOverdue;
    return getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
  });

  const handleFocusOnTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setActiveView('focus');
  };

  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const handlePlanForToday = async (taskId: string) => {
    await updateTask(taskId, { dueDate: todayStr });
    showToast('Task scheduled for Today ☀️');
  };

  const handleRequestDeleteTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      setTaskToDelete(task);
    }
  };

  const handleConfirmDeleteTask = async () => {
    if (!taskToDelete) return;
    const target = taskToDelete;
    setTaskToDelete(null);
    const deleted = await deleteTask(target.id);
    if (deleted) {
      showToast(`Task "${deleted.title}" deleted`, 'info', 'Undo', () => {
        useTaskStore.getState().restoreTask(deleted);
      });
    }
  };

  const handleShareIntention = () => {
    generateIntentionCardImage(intention, user.name, dateFormatted, todayStr);
  };

  return (
    <div className="max-w-[1500px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-8">
      {/* Header & Dynamic Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-outline-subtle gap-4">
        <div>
          <span className="text-xs font-semibold text-secondary uppercase tracking-widest block mb-1 font-sans">
            {dateFormatted}
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-on-surface">
            {greeting}, {user.name.split(' ')[0] || 'Friend'}
          </h1>
        </div>

        {/* Daily Focus Intention Card */}
        <div className="flex items-center gap-3 bg-surface-low border border-outline-subtle rounded-lg px-4 py-3 shadow-card max-w-md w-full justify-between">
          <div className="flex items-start gap-2.5 min-w-0">
            <Sparkles className="w-4 h-4 text-tertiary flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary block font-sans">
                Today's Main Focus
              </span>
              <p className="font-serif text-sm italic text-on-surface truncate">
                "{intention || 'Work on what matters most today.'}"
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={handleShareIntention}
              aria-label="Download focus quote card"
              className="p-1.5 text-secondary hover:text-on-surface rounded hover:bg-surface-container transition-colors"
              title="Download Quote Card"
            >
              <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={openIntentionModal}
              aria-label="Edit daily focus"
              className="p-1.5 text-secondary hover:text-on-surface rounded hover:bg-surface-container transition-colors"
              title="Edit Focus"
            >
              <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Overdue Tasks Alert Banner */}
      {overdueTasks.length > 0 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center justify-between gap-3 text-amber-900 dark:text-amber-200 animate-fade-in shadow-sm">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" aria-hidden="true" />
            <span>
              You have {overdueTasks.length} overdue {overdueTasks.length === 1 ? 'task' : 'tasks'} from previous days.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveView('tasks')}
            className="text-xs font-bold underline hover:text-amber-950 dark:hover:text-amber-100 flex-shrink-0"
          >
            Manage Overdue
          </button>
        </div>
      )}

      {/* Sub-Component: Metric Cards */}
      <DailyMetricsCards
        percentage={percentage}
        completedCount={completedCount}
        totalTrackedToday={totalTrackedToday}
        isAllDone={isAllDone}
        todayActiveTasks={todayActiveTasks}
        focusMinutesToday={focusMinutesToday}
        todaySessions={todaySessions}
        todayReminders={todayReminders}
        isWeekday={isWeekday}
      />

      {/* Weekly Activity Chart */}
      <WeeklyAnalytics focusSessions={focusSessions} tasks={tasks} />

      {/* Priority Tasks & Reminders Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Priority Tasks (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-tertiary" aria-hidden="true" />
              <h2 className="font-serif text-xl font-semibold text-on-surface">
                Today's Tasks
              </h2>
              {todayActiveTasks.length > 0 && (
                <span className="text-[11px] font-medium text-secondary bg-surface-container px-2.5 py-0.5 rounded-full border border-outline-subtle">
                  ~{totalEstimatedMinutes}m focus load
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setActiveView('tasks')}
              className="text-xs font-semibold text-primary hover:text-primary-container flex items-center gap-1 transition-colors uppercase tracking-wider"
            >
              <span>View All ({tasks.length})</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          {priorityTasks.length === 0 ? (
            <div className="bg-surface-low border border-dashed border-outline-variant rounded-xl p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-surface-container mx-auto flex items-center justify-center text-secondary">
                <Inbox className="w-6 h-6 text-tertiary" aria-hidden="true" />
              </div>
              <p className="font-serif text-base text-on-surface">Your workspace is clear and ready.</p>
              <p className="text-xs text-secondary max-w-sm mx-auto">
                What is your main focus today? Add your first task or schedule an item to get started.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => openTaskModal()}
                  className="px-5 py-2.5 bg-primary-container text-on-primary-container hover:bg-primary text-xs font-semibold uppercase tracking-wider rounded-md transition-colors shadow-sm active:scale-[0.98]"
                >
                  Create First Task
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {(showAllTasks ? priorityTasks : priorityTasks.slice(0, 5)).map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={toggleTask}
                  onToggleSubtask={toggleSubtask}
                  onEdit={(t) => openTaskModal(t)}
                  onDelete={handleRequestDeleteTask}
                  onFocus={handleFocusOnTask}
                  onPlanToday={handlePlanForToday}
                />
              ))}
              {priorityTasks.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllTasks(!showAllTasks)}
                  className="w-full py-2.5 px-4 bg-surface-low hover:bg-surface-high border border-outline-subtle text-xs font-semibold uppercase tracking-wider text-secondary hover:text-on-surface rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>
                    {showAllTasks
                      ? 'Show top 5 focus tasks'
                      : `Show all ${priorityTasks.length} tasks for today`}
                  </span>
                  {showAllTasks ? (
                    <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sub-Component: Reminders List for Today (1 Col) */}
        <DailyRemindersCard
          todayReminders={todayReminders}
          timeFormat={timeFormat}
          onNavigateReminders={() => setActiveView('reminders')}
          onToggleReminder={toggleReminder}
        />
      </div>

      <ConfirmModal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleConfirmDeleteTask}
        title="Delete Task"
        description={`Are you sure you want to delete "${taskToDelete?.title}"? This action can still be undone from the notification banner.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive
      />
    </div>
  );
};
