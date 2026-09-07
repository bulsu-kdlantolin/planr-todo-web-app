import React, { useState } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { useTaskStore } from '../../store/useTaskStore';
import { Modal } from '../common/Modal';
import { Logo } from '../common/Logo';
import { ConfirmModal } from '../common/ConfirmModal';
import { getPriorityMeta } from '../../utils/priority';
import { getDateStatus, formatDateLong } from '../../utils/date';
import {
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  Repeat,
  Slash,
  Edit2,
  Trash2,
  CheckSquare,
  ListTodo
} from 'lucide-react';

export const TaskViewModal: React.FC = () => {
  const isOpen = useUIStore((state) => state.taskViewModalOpen);
  const viewingTask = useUIStore((state) => state.viewingTask);
  const closeViewTaskModal = useUIStore((state) => state.closeViewTaskModal);
  const openTaskModal = useUIStore((state) => state.openTaskModal);
  const showToast = useUIStore((state) => state.showToast);

  const tasks = useTaskStore((state) => state.tasks);
  const toggleTask = useTaskStore((state) => state.toggleTask);
  const toggleSubtask = useTaskStore((state) => state.toggleSubtask);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const deleteTaskSeries = useTaskStore((state) => state.deleteTaskSeries);
  const stopTaskRecurrence = useTaskStore((state) => state.stopTaskRecurrence);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'single' | 'series'>('single');

  if (!isOpen || !viewingTask) return null;

  // Always bind to live task in store if available
  const task = tasks.find((t) => t.id === viewingTask.id) || viewingTask;
  const priorityMeta = getPriorityMeta(task.priority);
  const { isToday, isOverdue } = getDateStatus(task.dueDate);

  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.completed).length;
  const isRecurring = !!task.repeat && task.repeat !== 'Once';

  const handleToggle = () => {
    toggleTask(task.id);
  };

  const handleEdit = () => {
    closeViewTaskModal();
    openTaskModal(task);
  };

  const handleStopRecurrence = async () => {
    await stopTaskRecurrence(task.id);
    showToast('Recurrence stopped for this task', 'info');
  };

  const handleDeleteSingle = async () => {
    setShowDeleteConfirm(false);
    closeViewTaskModal();
    const deleted = await deleteTask(task.id);
    if (deleted) {
      showToast(`Task "${deleted.title}" deleted`, 'info', 'Undo', () => {
        useTaskStore.getState().restoreTask(deleted);
      });
    }
  };

  const handleDeleteSeries = async () => {
    setShowDeleteConfirm(false);
    closeViewTaskModal();
    const seriesId = task.recurringSeriesId || task.id;
    const deletedList = await deleteTaskSeries(seriesId);
    showToast(`Deleted ${deletedList.length} tasks in recurring series`, 'info');
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
    <>
      <Modal
        isOpen={isOpen}
        onClose={closeViewTaskModal}
        title="Task Details"
        titleId="task-view-modal-title"
        maxWidthClass="max-w-lg"
        icon={<Logo size="sm" showWordmark={false} />}
      >
        <div className="space-y-5 my-1">
          {/* Header Card: Completion Status & Title */}
          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-surface-low border border-outline-subtle shadow-xs">
            <button
              type="button"
              role="checkbox"
              aria-checked={task.completed}
              aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'completed'}`}
              onClick={handleToggle}
              className="mt-0.5 text-secondary hover:text-tertiary flex-shrink-0 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-container rounded cursor-pointer"
            >
              {task.completed ? (
                <CheckCircle2 className="w-5 h-5 text-tertiary" aria-hidden="true" />
              ) : (
                <Circle className="w-5 h-5 hover:text-primary-container" aria-hidden="true" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded inline-flex items-center gap-1 ${priorityMeta.badgeClass}`}
                >
                  <span aria-hidden="true" className="text-[8px]">{priorityMeta.iconSymbol}</span>
                  <span>{priorityMeta.label} Priority</span>
                </span>

                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-surface-lowest text-secondary border border-outline-subtle font-medium font-sans">
                  {task.category}
                </span>

                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium font-sans border ${
                    task.completed
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                      : isOverdue
                      ? 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30'
                      : 'bg-primary-container/15 text-on-primary-container border-primary-container/30'
                  }`}
                >
                  {task.completed ? 'Completed' : isOverdue ? 'Overdue' : 'In Progress'}
                </span>
              </div>

              <h2
                className={`font-serif text-lg sm:text-xl font-semibold text-on-surface leading-snug break-words ${
                  task.completed ? 'line-through text-secondary' : ''
                }`}
              >
                {task.title}
              </h2>
            </div>
          </div>

          {/* Schedule & Recurrence Bar */}
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
            <div className="p-3 bg-surface-low border border-outline-subtle rounded-lg flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
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
                </div>
              </div>

              {isRecurring && (
                <button
                  type="button"
                  onClick={handleStopRecurrence}
                  className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-secondary hover:text-red-600 dark:hover:text-red-400 hover:bg-surface-lowest rounded border border-outline-subtle transition-colors cursor-pointer flex-shrink-0"
                  title="Stop repeating this task"
                >
                  Stop Repeating
                </button>
              )}
            </div>
          </div>

          {/* Notes / Description */}
          {task.description && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary block font-sans">
                Notes & Details
              </span>
              <div className="p-3.5 bg-surface-low border border-outline-subtle rounded-lg text-xs text-on-surface whitespace-pre-wrap leading-relaxed font-sans">
                {task.description}
              </div>
            </div>
          )}

          {/* Subtasks Checklist */}
          {subtasks.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary font-sans flex items-center gap-1.5">
                  <ListTodo className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Subtasks</span>
                </span>
                <span className="text-xs font-semibold text-secondary font-sans">
                  {completedSubtasks} of {subtasks.length} completed
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-container transition-all duration-300"
                  style={{ width: `${(completedSubtasks / subtasks.length) * 100}%` }}
                />
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {subtasks.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => toggleSubtask(task.id, sub.id)}
                    className="flex items-center gap-2.5 p-2 rounded-md bg-surface-low hover:bg-surface-lowest border border-outline-subtle text-xs cursor-pointer select-none transition-colors group"
                  >
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={sub.completed}
                      aria-label={`Mark subtask "${sub.title}" as ${sub.completed ? 'incomplete' : 'completed'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSubtask(task.id, sub.id);
                      }}
                      className="text-secondary group-hover:text-tertiary focus:outline-none"
                    >
                      {sub.completed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-tertiary" aria-hidden="true" />
                      ) : (
                        <Circle className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                    </button>
                    <span
                      className={`truncate ${
                        sub.completed ? 'line-through text-secondary' : 'text-on-surface'
                      }`}
                    >
                      {sub.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Time & Session Estimate Badge */}
          <div className="flex items-center gap-4 text-xs text-secondary pt-1 font-sans border-t border-outline-subtle">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                Estimated focus: ~{(task.estimatedPomodoros || 1) * 25}m ({task.estimatedPomodoros || 1} focus session
                {(task.estimatedPomodoros || 1) > 1 ? 's' : ''})
              </span>
            </span>
          </div>

          {/* Action Buttons Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-outline-subtle gap-2">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-secondary hover:text-red-600 dark:hover:text-red-400 bg-surface-low hover:bg-surface-high border border-outline-subtle rounded-md transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Delete</span>
            </button>

            <div className="flex items-center gap-2">
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
        </div>
      </Modal>

      {/* Delete Confirmation Modal for Single or Recurring Series */}
      {showDeleteConfirm && (
        <Modal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title={isRecurring ? 'Delete Repeating Task' : 'Delete Task'}
          titleId="delete-task-confirm-title"
          maxWidthClass="max-w-md"
          icon={<Logo size="sm" showWordmark={false} />}
        >
          <div className="space-y-4 my-2">
            <p className="text-xs text-secondary leading-relaxed font-sans">
              {isRecurring
                ? `"${task.title}" is a repeating task. Would you like to delete only this occurrence or remove all tasks in the series?`
                : `Are you sure you want to delete "${task.title}"? You can undo this immediately from the toast notification.`}
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-4 border-t border-outline-subtle">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-medium text-secondary hover:text-on-surface bg-surface-low hover:bg-surface-high border border-outline-subtle rounded-md transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>

              {isRecurring && (
                <button
                  type="button"
                  onClick={handleDeleteSeries}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-400 border border-red-500/30 rounded-md transition-all active:scale-[0.98] cursor-pointer text-center"
                >
                  Delete Entire Series
                </button>
              )}

              <button
                type="button"
                onClick={handleDeleteSingle}
                className="px-5 py-2 text-xs font-semibold uppercase tracking-wider bg-primary-container hover:bg-primary text-on-primary-container rounded-md shadow-sm transition-all active:scale-[0.98] cursor-pointer text-center"
              >
                {isRecurring ? 'Delete Only This' : 'Delete Task'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default TaskViewModal;
