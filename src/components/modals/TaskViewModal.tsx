import React from 'react';
import { useUIStore } from '../../store/useUIStore';
import { useTaskStore } from '../../store/useTaskStore';
import { useReminderStore } from '../../store/useReminderStore';
import { useMetaStore } from '../../store/useMetaStore';
import { Modal } from '../common/Modal';
import { Logo } from '../common/Logo';
import { getPriorityMeta } from '../../utils/priority';
import { getDateStatus, formatDateLong, formatDateTimeLong, formatTimeDisplay } from '../../utils/date';
import { audioManager } from '../../utils/audio';
import {
  Calendar,
  Clock,
  Repeat,
  Edit2,
  ListTodo,
  Bell,
  Volume2,
  CheckCircle2,
  Circle,
  FileText,
  AlertTriangle,
  Info
} from 'lucide-react';

export const TaskViewModal: React.FC = () => {
  const isOpen = useUIStore((state) => state.taskViewModalOpen);
  const viewingTask = useUIStore((state) => state.viewingTask);
  const closeViewTaskModal = useUIStore((state) => state.closeViewTaskModal);
  const openTaskModal = useUIStore((state) => state.openTaskModal);

  const tasks = useTaskStore((state) => state.tasks);
  const reminders = useReminderStore((state) => state.reminders);
  const timeFormat = useMetaStore((state) => state.settings.timeFormat || '12h');

  if (!isOpen || !viewingTask) return null;

  // Bind to live task from store if available to keep presentation up to date
  const task = tasks.find((t) => t.id === viewingTask.id) || viewingTask;
  const priorityMeta = getPriorityMeta(task.priority);
  const { isToday, isOverdue } = getDateStatus(task.dueDate);

  // Check for any attached reminder
  const linkedReminder = reminders.find(
    (r) => r.taskId === task.id || (!r.taskId && r.title.trim().toLowerCase() === task.title.trim().toLowerCase())
  );

  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.completed).length;
  const isRecurring = !!task.repeat && task.repeat !== 'Once';

  const handleEdit = () => {
    closeViewTaskModal();
    openTaskModal(task);
  };

  // Human-readable recurrence summary
  const getRecurrenceText = () => {
    if (!task.repeat || task.repeat === 'Once') return null;
    const config = task.recurrenceConfig;
    if (task.repeat === 'Daily') {
      return config?.interval && config.interval > 1
        ? `Every ${config.interval} days`
        : 'Every day';
    }
    if (task.repeat === 'Weekdays') {
      return 'Every weekday (Mon–Fri)';
    }
    if (task.repeat === 'Weekly') {
      if (config?.weekdays && config.weekdays.length > 0) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const list = config.weekdays.map((d) => dayNames[d]).join(', ');
        return `Weekly on ${list}`;
      }
      return config?.interval && config.interval > 1
        ? `Every ${config.interval} weeks`
        : 'Every week';
    }
    if (task.repeat === 'Monthly') {
      return config?.interval && config.interval > 1
        ? `Every ${config.interval} months`
        : 'Every month';
    }
    if (task.repeat === 'Custom') {
      return `Custom (every ${config?.interval || 1} ${config?.intervalUnit || 'days'})`;
    }
    return `Repeats ${task.repeat}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeViewTaskModal}
      title="Task Details"
      titleId="task-view-modal-title"
      maxWidthClass="max-w-lg"
      icon={<Logo size="sm" showWordmark={false} />}
    >
      <div className="space-y-5 my-1">
        {/* Header Presentation: Status, Category, Priority & Title */}
        <div className="p-4 rounded-xl bg-surface-low border border-outline-subtle shadow-xs space-y-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Expressive Priority Badge */}
            <span
              className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 shadow-xs ${priorityMeta.badgeClass}`}
              title={`${priorityMeta.label} Priority - ${priorityMeta.description}`}
            >
              <span aria-hidden="true" className="text-[10px] leading-none">{priorityMeta.iconSymbol}</span>
              <span>{priorityMeta.label} Priority</span>
            </span>

            {/* Category Badge */}
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-surface-lowest text-secondary border border-outline-subtle font-medium font-sans">
              {task.category}
            </span>

            {/* Status Badge */}
            <span
              className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium font-sans border inline-flex items-center gap-1 ${
                task.completed
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                  : isOverdue
                  ? 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30'
                  : 'bg-primary-container/15 text-on-primary-container border-primary-container/30'
              }`}
            >
              {task.completed ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" aria-hidden="true" />
                  <span>Completed</span>
                </>
              ) : isOverdue ? (
                <>
                  <AlertTriangle className="w-3 h-3 text-red-500" aria-hidden="true" />
                  <span>Overdue</span>
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3 text-primary-container" aria-hidden="true" />
                  <span>In Progress</span>
                </>
              )}
            </span>
          </div>

          <div>
            <h2
              className={`font-serif text-lg sm:text-xl font-semibold text-on-surface leading-snug break-words ${
                task.completed ? 'line-through text-secondary' : ''
              }`}
            >
              {task.title}
            </h2>

            {task.completed && task.completedAt && (
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-sans flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                <span>Finished on {formatDateTimeLong(task.completedAt)}</span>
              </p>
            )}
          </div>
        </div>

        {/* 4-Card Overview: Due Date, Recurrence, Reminder, Focus Estimate */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Due Date Info */}
          <div className="p-3 bg-surface-low border border-outline-subtle rounded-lg flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-secondary flex-shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-secondary block font-sans tracking-wider">
                Due Date
              </span>
              <span
                className={`text-xs font-semibold font-sans truncate block ${
                  isOverdue && !task.completed
                    ? 'text-red-600 dark:text-red-400'
                    : isToday
                    ? 'text-primary-container'
                    : 'text-on-surface'
                }`}
              >
                {task.dueDate
                  ? isToday
                    ? `Today (${formatDateLong(task.dueDate)})`
                    : formatDateLong(task.dueDate)
                  : 'No due date set'}
              </span>
            </div>
          </div>

          {/* Recurrence Info */}
          <div className="p-3 bg-surface-low border border-outline-subtle rounded-lg flex items-center gap-2.5">
            <Repeat
              className={`w-4 h-4 flex-shrink-0 ${isRecurring ? 'text-primary-container' : 'text-secondary'}`}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-secondary block font-sans tracking-wider">
                Recurrence
              </span>
              <span className="text-xs font-semibold font-sans text-on-surface truncate block">
                {getRecurrenceText() || 'Does not repeat'}
              </span>
              {task.recurrenceConfig?.endDate && (
                <span className="text-[10px] text-secondary font-sans truncate block">
                  Until {formatDateLong(task.recurrenceConfig.endDate)}
                </span>
              )}
            </div>
          </div>

          {/* Reminder Notification Info */}
          <div className="p-3 bg-surface-low border border-outline-subtle rounded-lg flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <Bell
                className={`w-4 h-4 flex-shrink-0 ${linkedReminder ? 'text-amber-500' : 'text-secondary'}`}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-secondary block font-sans tracking-wider">
                  Reminder Alert
                </span>
                <span className="text-xs font-semibold font-sans text-on-surface truncate block">
                  {linkedReminder
                    ? `${formatTimeDisplay(linkedReminder.time, timeFormat)} (${linkedReminder.period})`
                    : 'None attached (optional)'}
                </span>
              </div>
            </div>

            {linkedReminder && linkedReminder.sound !== false && (
              <button
                type="button"
                onClick={() => audioManager.playReminderSound(linkedReminder.soundOption || 'chime')}
                title={`Audition ${linkedReminder.soundOption || 'chime'} sound`}
                aria-label={`Audition sound for ${linkedReminder.title}`}
                className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary-container/15 hover:bg-primary-container/25 text-primary-container border border-primary-container/30 font-sans font-medium transition-colors cursor-pointer flex-shrink-0"
              >
                <Volume2 className="w-3 h-3" aria-hidden="true" />
                <span className="capitalize">{linkedReminder.soundOption || 'chime'}</span>
              </button>
            )}
          </div>

          {/* Focus Estimate Info */}
          <div className="p-3 bg-surface-low border border-outline-subtle rounded-lg flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-secondary flex-shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-secondary block font-sans tracking-wider">
                Focus Estimate
              </span>
              <span className="text-xs font-semibold font-sans text-on-surface truncate block">
                ~{(task.estimatedPomodoros || 1) * 25}m ({task.estimatedPomodoros || 1} session
                {(task.estimatedPomodoros || 1) > 1 ? 's' : ''})
              </span>
              {task.completedPomodoros > 0 && (
                <span className="text-[10px] text-secondary font-sans truncate block">
                  {task.completedPomodoros} session{task.completedPomodoros > 1 ? 's' : ''} completed
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Notes / Description */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary flex items-center gap-1.5 font-sans">
            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Notes & Details</span>
          </span>
          {task.description ? (
            <div className="p-3.5 bg-surface-low border border-outline-subtle rounded-lg text-xs text-on-surface whitespace-pre-wrap leading-relaxed font-sans">
              {task.description}
            </div>
          ) : (
            <div className="p-3 bg-surface-low/50 border border-dashed border-outline-subtle rounded-lg text-xs text-secondary italic font-sans">
              No additional notes or description provided for this task.
            </div>
          )}
        </div>

        {/* Subtasks Progress & Read-only Presentation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary font-sans flex items-center gap-1.5">
              <ListTodo className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Subtasks</span>
            </span>
            <span className="text-xs font-semibold text-secondary font-sans">
              {subtasks.length > 0 ? (
                `${completedSubtasks} of ${subtasks.length} completed (${Math.round(
                  (completedSubtasks / subtasks.length) * 100
                )}%)`
              ) : (
                'None'
              )}
            </span>
          </div>

          {subtasks.length > 0 ? (
            <>
              {/* Progress bar */}
              <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-container transition-all duration-300"
                  style={{ width: `${(completedSubtasks / subtasks.length) * 100}%` }}
                />
              </div>

              {/* Subtasks read-only list */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {subtasks.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center gap-2.5 p-2 rounded-md bg-surface-low border border-outline-subtle text-xs"
                  >
                    {sub.completed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" aria-hidden="true" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-secondary/60 flex-shrink-0" aria-hidden="true" />
                    )}
                    <span
                      className={`truncate ${
                        sub.completed ? 'line-through text-secondary' : 'text-on-surface font-medium'
                      }`}
                    >
                      {sub.title}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-3 bg-surface-low/50 border border-dashed border-outline-subtle rounded-lg text-xs text-secondary italic font-sans">
              No subtasks created for this task.
            </div>
          )}
        </div>

        {/* Timestamps & Audit Metadata */}
        <div className="flex items-center justify-between text-[11px] text-secondary/80 pt-2 font-sans border-t border-outline-subtle flex-wrap gap-2">
          <span>Created: {formatDateTimeLong(task.createdAt)}</span>
          {task.updatedAt && task.updatedAt !== task.createdAt && (
            <span>Updated: {formatDateTimeLong(task.updatedAt)}</span>
          )}
        </div>

        {/* Action Buttons Footer: Close & Edit */}
        <div className="flex items-center justify-end pt-3 border-t border-outline-subtle gap-2">
          <button
            type="button"
            onClick={closeViewTaskModal}
            className="px-4 py-2 text-xs font-medium text-secondary hover:text-on-surface bg-surface-low hover:bg-surface-high border border-outline-subtle rounded-md transition-colors cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleEdit}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold uppercase tracking-wider bg-primary-container hover:bg-primary text-on-primary-container rounded-md shadow-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Edit Task</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default TaskViewModal;

