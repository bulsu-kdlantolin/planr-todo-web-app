import React, { useState, useMemo } from 'react';
import { Task } from '../../types';
import { getTodayDateString, formatDateLong, doesTaskRecurOnDate } from '../../utils/date';
import { getPriorityMeta } from '../../utils/priority';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Eye,
  Edit2,
  Trash2,
  CheckSquare,
  Repeat
} from 'lucide-react';

interface TaskCalendarViewProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onViewTask?: (task: Task) => void;
  onAddTaskForDate: (dateStr: string) => void;
}

export const TaskCalendarView: React.FC<TaskCalendarViewProps> = ({
  tasks,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onViewTask,
  onAddTaskForDate
}) => {
  const todayStr = getTodayDateString();
  const todayDate = new Date();

  const [viewYear, setViewYear] = useState(todayDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(todayDate.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [activeChipTaskId, setActiveChipTaskId] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'agenda'>('grid');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSelectedDate(todayStr);
  };

  // Build 7-day grid starting on Monday
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
    const adjustedFirstDay = (firstDayOfMonth + 6) % 7; // Mon = 0
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

    const days: Array<{
      day: number;
      monthOffset: number; // -1 = prev, 0 = current, 1 = next
      dateString: string;
    }> = [];

    // Previous month padding
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = viewMonth === 0 ? 11 : viewMonth - 1;
      const y = viewMonth === 0 ? viewYear - 1 : viewYear;
      const dateString = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, monthOffset: -1, dateString });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateString = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, monthOffset: 0, dateString });
    }

    // Next month padding to complete row/grid
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const m = viewMonth === 11 ? 0 : viewMonth + 1;
      const y = viewMonth === 11 ? viewYear + 1 : viewYear;
      const dateString = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, monthOffset: 1, dateString });
    }

    return days;
  }, [viewYear, viewMonth]);

  // Index tasks by dueDate and project recurring task instances across calendar days
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();

    // 1. Index all concrete tasks by their explicit dueDate
    for (const task of tasks) {
      if (task.dueDate) {
        const list = map.get(task.dueDate) || [];
        list.push(task);
        map.set(task.dueDate, list);
      }
    }

    // 2. Group recurring tasks by seriesId
    const recurringSeriesMap = new Map<string, Task[]>();
    for (const task of tasks) {
      if (task.repeat && task.repeat !== 'Once') {
        const seriesId = task.recurringSeriesId || task.id;
        const series = recurringSeriesMap.get(seriesId) || [];
        series.push(task);
        recurringSeriesMap.set(seriesId, series);
      }
    }

    // 3. Project recurring task instances onto visible calendarDays
    for (const [, seriesTasks] of recurringSeriesMap.entries()) {
      const pendingTask = seriesTasks.find((t) => !t.completed);
      const repTask = pendingTask || seriesTasks[seriesTasks.length - 1];
      if (!repTask) continue;

      const baseDate = repTask.dueDate || repTask.createdAt.slice(0, 10);
      const existingDates = new Set(seriesTasks.map((t) => t.dueDate).filter(Boolean));

      for (const day of calendarDays) {
        const dateStr = day.dateString;

        // Skip if a concrete task for this series already exists on this date
        if (existingDates.has(dateStr)) continue;

        // Do not project before the recurring task's start date
        if (dateStr < baseDate) continue;

        if (doesTaskRecurOnDate(baseDate, dateStr, repTask.repeat, repTask.recurrenceConfig)) {
          const projectedTask: Task = {
            ...repTask,
            id: `${repTask.id}_proj_${dateStr}`,
            dueDate: dateStr,
            completed: false,
            completedAt: undefined
          };

          const list = map.get(dateStr) || [];
          list.push(projectedTask);
          map.set(dateStr, list);
        }
      }
    }

    return map;
  }, [tasks, calendarDays]);

  // Monthly summary metrics across current month days
  const currentMonthDays = useMemo(() => {
    return calendarDays.filter((d) => d.monthOffset === 0);
  }, [calendarDays]);

  const monthTasks = useMemo(() => {
    const list: Task[] = [];
    for (const day of currentMonthDays) {
      const dayTasks = tasksByDate.get(day.dateString) || [];
      list.push(...dayTasks);
    }
    return list;
  }, [currentMonthDays, tasksByDate]);

  const monthTotal = monthTasks.length;
  const monthCompleted = monthTasks.filter((t) => t.completed).length;

  // Selected date tasks
  const selectedDateTasks = useMemo(() => {
    return tasksByDate.get(selectedDate) || [];
  }, [tasksByDate, selectedDate]);

  // Mobile Agenda View items
  const agendaDaysWithTasks = useMemo(() => {
    const list: Array<{ dateString: string; tasks: Task[]; isToday: boolean; isSelected: boolean }> = [];
    for (const item of calendarDays) {
      if (item.monthOffset === 0) {
        const dTasks = tasksByDate.get(item.dateString) || [];
        if (dTasks.length > 0 || item.dateString === todayStr || item.dateString === selectedDate) {
          list.push({
            dateString: item.dateString,
            tasks: dTasks,
            isToday: item.dateString === todayStr,
            isSelected: item.dateString === selectedDate
          });
        }
      }
    }
    return list;
  }, [calendarDays, tasksByDate, todayStr, selectedDate]);

  const weekDayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Calendar Navigation & Month Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-lowest border border-outline-subtle rounded-xl p-4 sm:p-5 shadow-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface-low border border-outline-subtle flex items-center justify-center text-primary-container">
            <CalendarIcon className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-on-surface">
              {monthNames[viewMonth]} {viewYear}
            </h2>
            <span className="text-[11px] font-sans text-secondary">
              {monthTotal} scheduled this month • {monthCompleted} completed
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Layout Mode Toggle: Grid vs Agenda */}
          <div className="flex items-center bg-surface-low border border-outline-subtle rounded-md p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setLayoutMode('grid')}
              aria-pressed={layoutMode === 'grid'}
              className={`px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
                layoutMode === 'grid'
                  ? 'bg-surface-lowest text-on-surface shadow-xs font-semibold'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('agenda')}
              aria-pressed={layoutMode === 'agenda'}
              className={`px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
                layoutMode === 'agenda'
                  ? 'bg-surface-lowest text-on-surface shadow-xs font-semibold'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              Agenda
            </button>
          </div>

          <button
            type="button"
            onClick={handleJumpToToday}
            className="px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider bg-surface-low hover:bg-surface-high border border-outline-subtle text-secondary hover:text-on-surface transition-colors cursor-pointer"
          >
            Today
          </button>
          <div className="flex items-center border border-outline-subtle rounded-md bg-surface-low overflow-hidden">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="p-2 hover:bg-surface-high text-secondary hover:text-on-surface transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>
            <div className="w-px h-5 bg-outline-subtle" />
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Next month"
              className="p-2 hover:bg-surface-high text-secondary hover:text-on-surface transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid or Agenda View */}
      {layoutMode === 'grid' ? (
        <div className="bg-surface-lowest border border-outline-subtle rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin [overscroll-behavior-x:contain] [-webkit-overflow-scrolling:touch]">
            <div className="min-w-[700px]">
              {/* Days of Week Row */}
              <div className="grid grid-cols-7 border-b border-outline-subtle bg-surface-low/60 text-center">
                {weekDayLabels.map((lbl) => (
                  <div
                    key={lbl}
                    className="py-2.5 text-[11px] font-semibold uppercase tracking-wider text-secondary font-sans"
                  >
                    {lbl}
                  </div>
                ))}
              </div>

              {/* Day Slots 7x5 or 7x6 */}
              <div className="grid grid-cols-7 divide-x divide-y divide-outline-subtle border-b border-outline-subtle">
                {calendarDays.map((item, idx) => {
                  const { day, monthOffset, dateString } = item;
                  const isSelected = selectedDate === dateString;
                  const isToday = todayStr === dateString;
                  const isPast = dateString < todayStr;
                  const dayTasks = tasksByDate.get(dateString) || [];

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDate(dateString)}
                      className={`min-h-[115px] p-2 flex flex-col justify-between transition-colors relative group select-none ${
                        monthOffset !== 0
                          ? 'bg-surface-lowest/70 hover:bg-surface-low/30'
                          : 'bg-surface-lowest hover:bg-surface-low/40'
                      } ${isSelected ? 'ring-2 ring-primary-container ring-inset z-10' : ''} ${
                        isToday && !isSelected ? 'bg-primary-container/[0.04]' : ''
                      }`}
                      role="button"
                      tabIndex={0}
                      aria-label={`${formatDateLong(dateString)}, ${dayTasks.length} tasks`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedDate(dateString);
                        }
                      }}
                    >
                      {/* Top: Day Number & Quick Add */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex items-center justify-center text-xs font-sans rounded-full ${
                            isToday
                              ? 'w-6 h-6 bg-primary-container text-on-primary-container font-bold shadow-xs'
                              : isSelected
                              ? 'font-bold text-on-surface'
                              : monthOffset !== 0
                              ? 'text-secondary/40'
                              : isPast
                              ? 'text-secondary'
                              : 'text-on-surface'
                          }`}
                        >
                          {day}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddTaskForDate(dateString);
                          }}
                          className="w-5 h-5 rounded hover:bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-all cursor-pointer"
                          title={`Add task for ${formatDateLong(dateString)}`}
                          aria-label={`Add task for ${formatDateLong(dateString)}`}
                        >
                          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>

                      {/* Middle: Task Chips (up to 2 visible, +N more indicator) */}
                      <div className="space-y-1 my-1">
                        {dayTasks.slice(0, 2).map((task) => {
                          const baseTask = (task as any)._baseTask || task;
                          const baseId = (task as any)._baseTaskId || task.id;
                          const isChipActive = activeChipTaskId === task.id;
                          const isRecurring = !!task.repeat && task.repeat !== 'Once';

                          return (
                            <div
                              key={task.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveChipTaskId(isChipActive ? null : task.id);
                              }}
                              className={`text-[11px] leading-tight px-1.5 py-0.5 rounded cursor-pointer transition-colors relative font-sans ${
                                task.completed
                                  ? 'line-through text-secondary/60 bg-surface-low'
                                  : 'text-on-surface bg-surface-low hover:bg-surface-container'
                              } ${isChipActive ? 'ring-1 ring-primary-container' : ''}`}
                            >
                              {/* Active Chip Inline Controls Overlay */}
                              {isChipActive ? (
                                <div className="flex items-center justify-between gap-1 py-0.5">
                                  <span className="truncate font-semibold flex-1">{task.title}</span>
                                  <div className="flex items-center gap-0.5 flex-shrink-0">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleTask(task.id);
                                      }}
                                      className="p-1 hover:bg-surface-high text-secondary hover:text-emerald-600 rounded transition-colors"
                                      title={task.completed ? 'Mark incomplete' : 'Mark completed'}
                                      aria-label={task.completed ? 'Mark incomplete' : 'Mark completed'}
                                    >
                                      <CheckSquare className="w-3 h-3" aria-hidden="true" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveChipTaskId(null);
                                        onEditTask(baseTask);
                                      }}
                                      className="p-1 hover:bg-surface-high text-secondary hover:text-on-surface rounded transition-colors"
                                      title="Edit task"
                                      aria-label={`Edit task ${task.title}`}
                                    >
                                      <Edit2 className="w-3 h-3" aria-hidden="true" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveChipTaskId(null);
                                        onDeleteTask(baseId);
                                      }}
                                      className="p-1 hover:bg-surface-high text-secondary hover:text-red-500 rounded transition-colors"
                                      title="Delete task"
                                      aria-label={`Delete task ${task.title}`}
                                    >
                                      <Trash2 className="w-3 h-3" aria-hidden="true" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 truncate">
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                      task.priority === 'urgent'
                                        ? 'bg-rose-500'
                                        : task.priority === 'high'
                                        ? 'bg-amber-500'
                                        : task.priority === 'medium'
                                        ? 'bg-sky-500'
                                        : 'bg-slate-400'
                                    }`}
                                    aria-hidden="true"
                                  />
                                  {isRecurring && (
                                    <Repeat className="w-2.5 h-2.5 text-secondary flex-shrink-0" aria-label="Recurring" />
                                  )}
                                  <span className="truncate">{task.title}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {dayTasks.length > 2 && (
                          <div className="text-[10px] text-secondary font-medium px-1 font-sans">
                            +{dayTasks.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Mobile-Optimized Agenda View */
        <div className="space-y-4">
          {agendaDaysWithTasks.length === 0 ? (
            <div className="bg-surface-lowest border border-outline-subtle rounded-xl p-8 text-center text-secondary text-xs">
              No tasks scheduled for {monthNames[viewMonth]} {viewYear}.
            </div>
          ) : (
            agendaDaysWithTasks.map((item) => {
              const { dateString, tasks: dTasks, isToday, isSelected } = item;
              return (
                <div
                  key={dateString}
                  className={`bg-surface-lowest border rounded-xl p-4 sm:p-5 shadow-card transition-all ${
                    isSelected ? 'ring-2 ring-primary-container border-transparent' : 'border-outline-subtle'
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-outline-subtle">
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif text-base font-semibold text-on-surface">
                        {formatDateLong(dateString)}
                      </h3>
                      {isToday && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-primary-container/15 text-primary-container font-semibold uppercase tracking-wider font-sans">
                          Today
                        </span>
                      )}
                      <span className="text-[11px] text-secondary font-sans">
                        ({dTasks.length})
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onAddTaskForDate(dateString)}
                      className="min-h-[36px] px-2.5 py-1 text-xs font-semibold text-primary hover:text-primary-container flex items-center gap-1 rounded transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Add</span>
                    </button>
                  </div>

                  {dTasks.length === 0 ? (
                    <p className="text-xs text-secondary py-3 italic">No tasks scheduled for this day.</p>
                  ) : (
                    <div className="divide-y divide-outline-subtle">
                      {dTasks.map((t) => {
                        const priorityMeta = getPriorityMeta(t.priority);
                        return (
                          <div
                            key={t.id}
                            className="py-3 flex items-center justify-between gap-3 group"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <button
                                type="button"
                                onClick={() => onToggleTask(t.id)}
                                aria-label={t.completed ? `Mark ${t.title} incomplete` : `Mark ${t.title} complete`}
                                className="w-6 h-6 flex items-center justify-center text-secondary hover:text-emerald-500 transition-colors flex-shrink-0"
                              >
                                {t.completed ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                ) : (
                                  <Circle className="w-5 h-5 text-outline-subtle hover:text-secondary" />
                                )}
                              </button>

                              <div className="min-w-0 flex-1">
                                <p className={`text-xs font-medium truncate ${t.completed ? 'line-through text-secondary' : 'text-on-surface'}`}>
                                  {t.title}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${priorityMeta.badgeClass}`}>
                                    {priorityMeta.label}
                                  </span>
                                  {t.category && (
                                    <span className="text-[10px] text-secondary">
                                      {t.category}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => onEditTask(t)}
                                aria-label={`Edit task ${t.title}`}
                                className="min-h-[36px] min-w-[36px] p-2 text-secondary hover:text-on-surface rounded transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteTask(t.id)}
                                aria-label={`Delete task ${t.title}`}
                                className="min-h-[36px] min-w-[36px] p-2 text-secondary hover:text-red-500 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Selected Day Inspector Section */}
      <div className="bg-surface-lowest border border-outline-subtle rounded-xl p-5 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-outline-subtle gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-lg font-semibold text-on-surface">
                {formatDateLong(selectedDate)}
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-low border border-outline-subtle text-secondary font-medium font-sans">
                {selectedDateTasks.length} {selectedDateTasks.length === 1 ? 'task' : 'tasks'}
              </span>
              {selectedDate === todayStr && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-primary-container/15 text-primary-container font-semibold uppercase tracking-wider font-sans">
                  Today
                </span>
              )}
            </div>
            <p className="text-xs text-secondary mt-0.5 font-sans">
              Tasks scheduled for this date
            </p>
          </div>

          {selectedDate < todayStr ? (
            <span className="text-xs font-sans text-secondary italic px-3 py-1.5 bg-surface-low rounded-md border border-outline-subtle self-start sm:self-auto">
              Past date (cannot schedule new tasks)
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onAddTaskForDate(selectedDate)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-container text-on-primary-container hover:bg-primary rounded-md text-xs font-semibold uppercase tracking-wider shadow-sm transition-all active:scale-[0.98] cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Add Task For This Day</span>
            </button>
          )}
        </div>

        {/* Selected Day Tasks List */}
        {selectedDateTasks.length === 0 ? (
          <div className="py-8 text-center space-y-2.5">
            <CheckSquare className="w-8 h-8 text-secondary/40 mx-auto" aria-hidden="true" />
            <p className="text-xs text-secondary font-sans">
              {selectedDate < todayStr
                ? 'No tasks were scheduled for this date.'
                : 'No tasks scheduled for this date.'}
            </p>
            {selectedDate >= todayStr && (
              <button
                type="button"
                onClick={() => onAddTaskForDate(selectedDate)}
                className="text-xs font-semibold text-primary-container hover:underline cursor-pointer"
              >
                + Create task for {formatDateLong(selectedDate)}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {selectedDateTasks.map((task) => {
              const priorityMeta = getPriorityMeta(task.priority);
              const isProjected = task.id.includes('_proj_');
              const baseTask = isProjected
                ? tasks.find((t) => t.id === task.id.split('_proj_')[0]) || task
                : task;
              const baseId = isProjected ? task.id.split('_proj_')[0] : task.id;

              return (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-lg border flex items-center justify-between gap-3 transition-colors ${
                    task.completed
                      ? 'bg-surface-low/50 border-outline-subtle opacity-70'
                      : isProjected
                      ? 'bg-surface-lowest border-outline-subtle border-dashed hover:border-outline-variant shadow-xs'
                      : 'bg-surface-lowest border-outline-subtle hover:border-outline-variant shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={task.completed}
                      aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'completed'}`}
                      onClick={() => onToggleTask(task.id)}
                      className="text-secondary hover:text-tertiary flex-shrink-0 transition-colors focus:outline-none cursor-pointer"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-tertiary" aria-hidden="true" />
                      ) : (
                        <Circle className="w-4 h-4 hover:text-primary-container" aria-hidden="true" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span
                          className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 ${priorityMeta.badgeClass}`}
                          title={`${priorityMeta.label} Priority - ${priorityMeta.description}`}
                        >
                          <span aria-hidden="true" className="text-[8px]">{priorityMeta.iconSymbol}</span>
                          <span>{priorityMeta.label}</span>
                        </span>
                        <span className="text-[10px] text-secondary font-medium">
                          {task.category}
                        </span>
                        {task.repeat && task.repeat !== 'Once' && (
                          <span
                            className="text-[9px] text-secondary inline-flex items-center gap-1 font-medium bg-surface-low px-1.5 py-0.5 rounded border border-outline-subtle"
                            title={`Repeats ${task.repeat}`}
                          >
                            <Repeat className="w-2.5 h-2.5 text-tertiary" aria-hidden="true" />
                            <span>{task.repeat}</span>
                          </span>
                        )}
                      </div>
                      <h4
                        className={`text-xs font-medium text-on-surface truncate ${
                          task.completed ? 'line-through text-secondary' : ''
                        }`}
                      >
                        {task.title}
                      </h4>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {onViewTask && (
                      <button
                        type="button"
                        onClick={() => onViewTask(task)}
                        aria-label={`View details for ${task.title}`}
                        className="p-1.5 text-secondary hover:text-on-surface rounded hover:bg-surface-low transition-colors cursor-pointer"
                        title="View task details"
                      >
                        <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onEditTask(baseTask)}
                      aria-label={`Edit task ${task.title}`}
                      className="p-1.5 text-secondary hover:text-on-surface rounded hover:bg-surface-low transition-colors cursor-pointer"
                      title="Edit task"
                    >
                      <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteTask(baseId)}
                      aria-label={`Delete task ${task.title}`}
                      className="p-1.5 text-secondary hover:text-red-500 rounded hover:bg-surface-low transition-colors cursor-pointer"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCalendarView;
