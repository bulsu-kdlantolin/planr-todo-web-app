import React, { useState, useMemo } from 'react';
import { Task } from '../../types';
import { getTodayDateString, formatDateLong } from '../../utils/date';
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
  CheckSquare
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

  // Index tasks by dueDate for O(1) lookups
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (task.dueDate) {
        const list = map.get(task.dueDate) || [];
        list.push(task);
        map.set(task.dueDate, list);
      }
    }
    return map;
  }, [tasks]);

  // Monthly summary metrics
  const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const monthTasks = useMemo(() => {
    return tasks.filter((t) => t.dueDate && t.dueDate.startsWith(monthPrefix));
  }, [tasks, monthPrefix]);

  const monthTotal = monthTasks.length;
  const monthCompleted = monthTasks.filter((t) => t.completed).length;

  // Selected date tasks
  const selectedDateTasks = useMemo(() => {
    return tasksByDate.get(selectedDate) || [];
  }, [tasksByDate, selectedDate]);

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

        <div className="flex items-center gap-2 self-start sm:self-auto">
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

      {/* Calendar Grid Card */}
      <div className="bg-surface-lowest border border-outline-subtle rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
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

            {/* 7-Column Day Cells */}
            <div className="grid grid-cols-7 divide-x divide-y divide-outline-subtle/70">
              {calendarDays.map(({ day, monthOffset, dateString }) => {
                const dayTasks = tasksByDate.get(dateString) || [];
                const isToday = dateString === todayStr;
                const isSelected = dateString === selectedDate;
                const isCurrentMonth = monthOffset === 0;
                const isPast = dateString < todayStr;

                return (
                  <div
                    key={dateString}
                    onClick={() => setSelectedDate(dateString)}
                    className={`min-h-[105px] sm:min-h-[115px] lg:min-h-[125px] p-2 sm:p-2.5 flex flex-col justify-between transition-all cursor-pointer group relative ${
                      !isCurrentMonth
                        ? 'bg-surface-low/30 opacity-40'
                        : isPast
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
                            : isPast
                            ? 'font-medium text-secondary/60'
                            : 'font-medium text-secondary'
                        }`}
                      >
                        {day}
                      </span>

                      {!isPast && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddTaskForDate(dateString);
                          }}
                          aria-label={`Add task for ${dateString}`}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-surface-high text-secondary hover:text-on-surface rounded transition-opacity cursor-pointer"
                          title="Add task for this day"
                        >
                          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                    {/* Middle: Task Chips / Pills with Sliding Actions */}
                    <div className="space-y-1 my-1 flex-1 overflow-hidden">
                      {dayTasks.slice(0, 2).map((task) => {
                        const isActionActive = activeChipTaskId === task.id;

                        return (
                          <div
                            key={task.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveChipTaskId(isActionActive ? null : task.id);
                            }}
                            title={task.title}
                            className={`rounded text-[11px] font-sans transition-all relative overflow-hidden border ${
                              isActionActive
                                ? 'bg-surface-lowest ring-1 ring-primary-container shadow-xs p-0.5'
                                : task.completed
                                ? 'px-2 py-0.5 bg-surface-low text-secondary line-through border-outline-subtle opacity-70 cursor-pointer'
                                : 'px-2 py-0.5 bg-surface-low hover:bg-surface-high text-on-surface border-outline-subtle cursor-pointer'
                            }`}
                          >
                            {isActionActive ? (
                              <div className="flex items-center justify-between gap-1 w-full animate-slide-in">
                                <span className="truncate text-[10px] font-medium text-on-surface pl-1 max-w-[45px] sm:max-w-[65px]">
                                  {task.title}
                                </span>
                                <div className="flex items-center gap-0.5 bg-surface-low rounded p-0.5 flex-shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveChipTaskId(null);
                                      if (onViewTask) {
                                        onViewTask(task);
                                      } else {
                                        onEditTask(task);
                                      }
                                    }}
                                    className="p-1 hover:bg-surface-high text-secondary hover:text-on-surface rounded transition-colors"
                                    title="View task details"
                                    aria-label={`View details for ${task.title}`}
                                  >
                                    <Eye className="w-3 h-3" aria-hidden="true" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveChipTaskId(null);
                                      onEditTask(task);
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
                                      onDeleteTask(task.id);
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
              return (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-lg border flex items-center justify-between gap-3 transition-colors ${
                    task.completed
                      ? 'bg-surface-low/50 border-outline-subtle opacity-70'
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
                      <div className="flex items-center gap-2 mb-0.5">
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
                      onClick={() => onEditTask(task)}
                      aria-label={`Edit task ${task.title}`}
                      className="p-1.5 text-secondary hover:text-on-surface rounded hover:bg-surface-low transition-colors cursor-pointer"
                      title="Edit task"
                    >
                      <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteTask(task.id)}
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
