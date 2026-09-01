import React, { useState, useEffect } from 'react';
import { useTaskStore } from '../../store/useTaskStore';
import { useUIStore } from '../../store/useUIStore';
import { TaskCategory, PriorityLevel, Subtask } from '../../types';
import { Modal } from '../common/Modal';
import { Select, SelectOption } from '../common/Select';
import { DatePicker } from '../common/DatePicker';
import { NumberStepper } from '../common/NumberStepper';
import { ModalFooter } from '../common/ModalFooter';
import { getPriorityLabel } from '../../utils/priority';
import { generateUUID } from '../../utils/id';
import { getTodayDateString } from '../../utils/date';
import { Logo } from '../common/Logo';
import {
  CheckCircle2,
  Trash2,
  Plus,
  Clock,
  AlertCircle
} from 'lucide-react';
import { triggerHapticFeedback, getFieldValidationClass } from '../../utils/validation';

export const TaskModal: React.FC = () => {
  const taskModalOpen = useUIStore((state) => state.taskModalOpen);
  const editingTask = useUIStore((state) => state.editingTask);
  const closeTaskModal = useUIStore((state) => state.closeTaskModal);
  const showToast = useUIStore((state) => state.showToast);

  const addTask = useTaskStore((state) => state.addTask);
  const updateTask = useTaskStore((state) => state.updateTask);

  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Work');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [dueDate, setDueDate] = useState<string>('');
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(1);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  useEffect(() => {
    setTitleError(null);
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setCategory(editingTask.category);
      setPriority(editingTask.priority);
      setDueDate(editingTask.dueDate || '');
      setEstimatedPomodoros(editingTask.estimatedPomodoros || 1);
      setSubtasks(editingTask.subtasks ? [...editingTask.subtasks] : []);
    } else {
      setTitle('');
      setDescription('');
      setCategory('Work');
      setPriority('medium');
      setDueDate(getTodayDateString());
      setEstimatedPomodoros(1);
      setSubtasks([]);
    }
  }, [editingTask, taskModalOpen]);

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSub: Subtask = {
      id: generateUUID(),
      title: newSubtaskTitle.trim(),
      completed: false
    };
    setSubtasks([...subtasks, newSub]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      triggerHapticFeedback();
      setTitleError('Please enter a task title');
      return;
    }

    if (editingTask) {
      updateTask(editingTask.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        priority,
        dueDate: dueDate || undefined,
        estimatedPomodoros,
        subtasks
      });
      showToast('Task updated', 'success');
    } else {
      addTask({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        priority,
        dueDate: dueDate || undefined,
        estimatedPomodoros,
        subtasks
      });
      showToast('Task added', 'success');
    }
    closeTaskModal();
  };

  const categories: TaskCategory[] = ['Work', 'Design', 'Personal', 'Mindful', 'Health'];
  const categoryOptions: SelectOption<TaskCategory>[] = categories.map((cat) => ({
    value: cat,
    label: cat
  }));

  const priorities: PriorityLevel[] = ['urgent', 'high', 'medium', 'low'];
  const priorityOptions: SelectOption<PriorityLevel>[] = priorities.map((p) => ({
    value: p,
    label: getPriorityLabel(p)
  }));

  return (
    <Modal
      isOpen={taskModalOpen}
      onClose={closeTaskModal}
      title={editingTask ? 'Edit Task' : 'New Task'}
      titleId="task-modal-title"
      maxWidthClass="max-w-lg"
      icon={<Logo size="sm" showWordmark={false} />}
    >
      <form noValidate onSubmit={handleSubmit} className="space-y-4 my-2">
        {/* Title Input */}
        <div>
          <label htmlFor="task-title-input" className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1 font-sans">
            Task Title <span className="text-red-500">*</span>
          </label>
          <input
            id="task-title-input"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (titleError) setTitleError(null);
            }}
            placeholder="e.g. Write design documentation..."
            className={`w-full px-3.5 py-2.5 bg-surface-low border rounded-md text-xs text-on-surface transition-all shadow-card focus:outline-none ${getFieldValidationClass(
              !!titleError
            )}`}
          />
          {titleError && (
            <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1 animate-fade-in font-medium" role="alert">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{titleError}</span>
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="task-description-input" className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1 font-sans">
            Notes & Details
          </label>
          <textarea
            id="task-description-input"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add context, links, or notes..."
            className="w-full px-3.5 py-2 bg-surface-low border border-outline-variant rounded-md text-xs text-on-surface focus:border-primary-container focus:outline-none transition-colors shadow-card"
          />
        </div>

        {/* Category & Priority Grid with Custom Animated Selects */}
        <div className="grid grid-cols-2 gap-4">
          <Select<TaskCategory>
            label="Category"
            value={category}
            onChange={(val) => setCategory(val)}
            options={categoryOptions}
            ariaLabel="Task category"
          />

          <Select<PriorityLevel>
            label="Priority"
            value={priority}
            onChange={(val) => setPriority(val)}
            options={priorityOptions}
            ariaLabel="Task priority"
          />
        </div>

        {/* Due Date & Pomodoros with Custom Crafted Components */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DatePicker
            label="Due Date"
            value={dueDate}
            onChange={(val) => setDueDate(val)}
            placeholder="Pick due date..."
          />

          <NumberStepper
            label="Focus Blocks"
            value={estimatedPomodoros}
            onChange={(val) => setEstimatedPomodoros(val)}
            min={1}
            max={12}
            unitLabel="blocks (25m)"
          />
        </div>

        {/* Subtasks Checklist Section */}
        <div className="pt-2 border-t border-outline-subtle">
          <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-2 font-sans">
            Subtasks Checklist ({subtasks.filter((s) => s.completed).length}/{subtasks.length})
          </label>

          {/* Subtasks List */}
          {subtasks.length > 0 && (
            <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
              {subtasks.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-2 rounded-md bg-surface-low border border-outline-subtle text-xs"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={sub.completed}
                      aria-label={`Mark subtask "${sub.title}" as ${sub.completed ? 'incomplete' : 'completed'}`}
                      onClick={() =>
                        setSubtasks(
                          subtasks.map((s) => (s.id === sub.id ? { ...s, completed: !s.completed } : s))
                        )
                      }
                      className="text-secondary hover:text-tertiary focus:outline-none flex-shrink-0"
                    >
                      <CheckCircle2
                        className={`w-4 h-4 ${sub.completed ? 'text-tertiary' : 'text-outline-variant'}`}
                        aria-hidden="true"
                      />
                    </button>
                    <span className={`truncate ${sub.completed ? 'line-through text-secondary' : 'text-on-surface'}`}>
                      {sub.title}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(sub.id)}
                    aria-label={`Remove subtask "${sub.title}"`}
                    className="text-secondary hover:text-error p-1 rounded hover:bg-surface-container"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Subtask Input (Fixed Enter key trap) */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault(); // Prevents accidental modal submission
                  handleAddSubtask();
                }
              }}
              placeholder="Add checklist item... (Press Enter)"
              aria-label="New subtask title"
              className="flex-1 px-3 py-1.5 bg-surface-low border border-outline-variant rounded-md text-xs text-on-surface focus:border-primary-container focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddSubtask}
              className="px-3 py-1.5 bg-surface-low hover:bg-surface-container text-on-surface rounded-md text-xs font-medium border border-outline-variant transition-colors"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <ModalFooter
          onCancel={closeTaskModal}
          submitText={editingTask ? 'Save Changes' : 'Create Task'}
        />
      </form>
    </Modal>
  );
};

export default TaskModal;
