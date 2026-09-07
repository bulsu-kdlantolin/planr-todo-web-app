import React, { useState, memo } from 'react';
import { Task } from '../../types';
import { getPriorityMeta } from '../../utils/priority';
import { getDateStatus } from '../../utils/date';
import {
  CheckCircle2,
  Circle,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Repeat
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (id: string) => void;
  onView?: (task: Task) => void;
  compact?: boolean;
}

const TaskCardComponent: React.FC<TaskCardProps> = ({
  task,
  onToggle,
  onToggleSubtask,
  onEdit,
  onDelete,
  onView,
  compact = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [justToggled, setJustToggled] = useState(false);
  const priorityMeta = getPriorityMeta(task.priority);

  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.completed).length;

  const { isToday, isOverdue } = getDateStatus(task.dueDate);

  const handleToggleClick = () => {
    setJustToggled(true);
    onToggle(task.id);
    setTimeout(() => setJustToggled(false), 400);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && onEdit) {
      e.preventDefault();
      onEdit(task);
    }
  };

  return (
    <div
      className={`bg-surface-lowest border rounded-md p-4 shadow-card hover:-translate-y-0.5 transition-all ${
        task.completed
          ? 'border-outline-subtle opacity-65 bg-surface-low/50'
          : 'border-outline-subtle hover:border-outline-variant hover:shadow-ambient'
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Custom Accessible Checkbox with Spring Bounce */}
        <button
          type="button"
          role="checkbox"
          aria-checked={task.completed}
          aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'completed'}`}
          onClick={handleToggleClick}
          className={`mt-0.5 text-secondary hover:text-tertiary flex-shrink-0 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-container rounded ${
            justToggled ? 'animate-spring-bounce' : ''
          }`}
        >
          {task.completed ? (
            <CheckCircle2 className="w-5 h-5 text-tertiary" aria-hidden="true" />
          ) : (
            <Circle className="w-5 h-5 hover:text-primary-container" aria-hidden="true" />
          )}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-xs ${priorityMeta.badgeClass}`}
              aria-label={priorityMeta.ariaLabel}
              title={`${priorityMeta.label} Priority - ${priorityMeta.description}`}
            >
              <span aria-hidden="true" className="text-[9px] leading-none">{priorityMeta.iconSymbol}</span>
              <span>{priorityMeta.label}</span>
            </span>

            <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-low text-secondary border border-outline-subtle font-medium">
              {task.category}
            </span>

            {task.dueDate && (
              <span
                className={`inline-flex items-center gap-1 text-xs ${
                  isOverdue
                    ? 'text-error font-medium'
                    : isToday
                    ? 'text-tertiary-dark font-medium'
                    : 'text-secondary'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isToday ? 'Today' : task.dueDate}</span>
              </span>
            )}

            {task.repeat && task.repeat !== 'Once' && (
              <span
                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary-container/20 text-on-primary-container font-medium"
                title={`Repeats ${task.repeat}`}
                aria-label={`Repeats ${task.repeat}`}
              >
                <Repeat className="w-3 h-3" aria-hidden="true" />
                <span>{task.repeat}</span>
              </span>
            )}
          </div>

          <h3
            role={onEdit ? 'button' : undefined}
            tabIndex={onEdit ? 0 : undefined}
            onClick={() => onEdit?.(task)}
            onKeyDown={handleTitleKeyDown}
            aria-label={onEdit ? `Edit task "${task.title}"` : undefined}
            className={`font-serif text-base text-on-surface font-medium leading-snug transition-all ${
              onEdit ? 'cursor-pointer hover:text-primary' : ''
            } ${task.completed ? 'line-through text-secondary' : ''}`}
          >
            {task.title}
          </h3>

          {task.description && (
            <p className="text-xs text-secondary mt-1.5 leading-relaxed font-sans line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Subtasks Progress / Expander */}
          {subtasks.length > 0 && !compact && (
            <div className="mt-3 pt-2.5 border-t border-outline-subtle">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
                className="flex items-center gap-2 text-xs font-semibold text-secondary hover:text-on-surface transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>
                  Subtasks ({completedSubtasks}/{subtasks.length})
                </span>
              </button>

              {isExpanded && (
                <div className="space-y-1.5 mt-2.5 pl-1">
                  {subtasks.map((sub) => (
                    <div
                      key={sub.id}
                      onClick={() => onToggleSubtask?.(task.id, sub.id)}
                      className="flex items-center gap-2.5 text-xs text-on-surface cursor-pointer select-none group"
                    >
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={sub.completed}
                        aria-label={`Mark subtask "${sub.title}" as ${sub.completed ? 'incomplete' : 'completed'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSubtask?.(task.id, sub.id);
                        }}
                        className="text-secondary group-hover:text-tertiary focus:outline-none"
                      >
                        {sub.completed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-tertiary" aria-hidden="true" />
                        ) : (
                          <Circle className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                      </button>
                      <span className={`group-hover:text-on-surface ${sub.completed ? 'line-through text-secondary' : ''}`}>
                        {sub.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 flex-shrink-0 self-start">
          {onView && (
            <button
              type="button"
              onClick={() => onView(task)}
              aria-label={`View details for ${task.title}`}
              className="p-1.5 text-secondary hover:text-on-surface rounded hover:bg-surface-low transition-colors"
              title="View Task Details"
            >
              <Eye className="w-4 h-4" aria-hidden="true" />
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(task)}
              aria-label={`Edit task ${task.title}`}
              className="p-1.5 text-secondary hover:text-on-surface rounded hover:bg-surface-low transition-colors"
              title="Edit Task"
            >
              <Edit2 className="w-4 h-4" aria-hidden="true" />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              aria-label={`Delete task ${task.title}`}
              className="p-1.5 text-secondary hover:text-error rounded hover:bg-surface-low transition-colors"
              title="Delete Task"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const TaskCard = memo(TaskCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.task === nextProps.task &&
    prevProps.compact === nextProps.compact
  );
});

export default TaskCard;
