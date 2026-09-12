import React, { useState, useEffect } from 'react';
import { useTaskStore } from '../../store/useTaskStore';
import { useReminderStore } from '../../store/useReminderStore';
import { useMetaStore } from '../../store/useMetaStore';
import { useUIStore } from '../../store/useUIStore';
import { TaskCategory, PriorityLevel, Subtask, Recurrence, RecurrenceConfig, ReminderSound, DaySegment } from '../../types';
import { Modal } from '../common/Modal';
import { Select, SelectOption } from '../common/Select';
import { DatePicker } from '../common/DatePicker';
import { TimePicker } from '../common/TimePicker';
import { ToggleSwitch } from '../common/ToggleSwitch';
import { ModalFooter } from '../common/ModalFooter';
import { getPriorityLabel, getPriorityMeta } from '../../utils/priority';
import { generateUUID } from '../../utils/id';
import { getTodayDateString } from '../../utils/date';
import { audioManager } from '../../utils/audio';
import { Logo } from '../common/Logo';
import {
  CheckCircle2,
  Trash2,
  Plus,
  Clock,
  AlertCircle,
  Repeat,
  Slash,
  Bell,
  Volume2
} from 'lucide-react';
import { triggerHapticFeedback, getFieldValidationClass } from '../../utils/validation';

export const TaskModal: React.FC = () => {
  const taskModalOpen = useUIStore((state) => state.taskModalOpen);
  const editingTask = useUIStore((state) => state.editingTask);
  const initialTaskDueDate = useUIStore((state) => state.initialTaskDueDate);
  const closeTaskModal = useUIStore((state) => state.closeTaskModal);
  const showToast = useUIStore((state) => state.showToast);
  const timeFormat = useMetaStore((state) => state.settings.timeFormat || '12h');

  const addTask = useTaskStore((state) => state.addTask);
  const updateTask = useTaskStore((state) => state.updateTask);

  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Work');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [dueDate, setDueDate] = useState<string>('');
  const [repeat, setRepeat] = useState<Recurrence>('Once');
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [recurrenceUnit, setRecurrenceUnit] = useState<'days' | 'weeks' | 'months'>('days');
  const [recurrenceWeekdays, setRecurrenceWeekdays] = useState<number[]>([]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>('');
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(1);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Add to Reminders Option State
  const [addToReminders, setAddToReminders] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [reminderSound, setReminderSound] = useState<ReminderSound>('chime');

  useEffect(() => {
    setTitleError(null);
    setShowDiscardConfirm(false);
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setCategory(editingTask.category);
      setPriority(editingTask.priority);
      setDueDate(editingTask.dueDate || '');
      setRepeat(editingTask.repeat || 'Once');
      setRecurrenceInterval(editingTask.recurrenceConfig?.interval || 1);
      setRecurrenceUnit(editingTask.recurrenceConfig?.intervalUnit || 'days');
      setRecurrenceWeekdays(editingTask.recurrenceConfig?.weekdays || []);
      setRecurrenceEndDate(editingTask.recurrenceConfig?.endDate || '');
      setEstimatedPomodoros(editingTask.estimatedPomodoros || 1);
      setSubtasks(editingTask.subtasks ? [...editingTask.subtasks] : []);

      const existingRem = useReminderStore.getState().reminders.find(
        (r) => r.taskId === editingTask.id || (!r.taskId && r.title.trim().toLowerCase() === editingTask.title.trim().toLowerCase())
      );
      if (existingRem) {
        setAddToReminders(true);
        setReminderTime(existingRem.time);
        setReminderSound(existingRem.soundOption || 'chime');
      } else {
        setAddToReminders(false);
        setReminderTime('09:00');
        setReminderSound('chime');
      }
    } else {
      setTitle('');
      setDescription('');
      setCategory('Work');
      setPriority('medium');
      setDueDate(initialTaskDueDate || getTodayDateString());
      setRepeat('Once');
      setRecurrenceInterval(1);
      setRecurrenceUnit('days');
      setRecurrenceWeekdays([]);
      setRecurrenceEndDate('');
      setEstimatedPomodoros(1);
      setSubtasks([]);
      setAddToReminders(false);
      setReminderTime('09:00');
      setReminderSound('chime');
    }
  }, [editingTask, taskModalOpen, initialTaskDueDate]);

  const isDirty = editingTask
    ? title !== editingTask.title ||
      description !== (editingTask.description || '') ||
      category !== editingTask.category ||
      priority !== editingTask.priority ||
      dueDate !== (editingTask.dueDate || '') ||
      repeat !== (editingTask.repeat || 'Once') ||
      subtasks.length !== (editingTask.subtasks?.length || 0) ||
      addToReminders
    : title.trim() !== '' || description.trim() !== '' || subtasks.length > 0 || addToReminders;

  const handleRequestClose = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      closeTaskModal();
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      triggerHapticFeedback();
      setTitleError('Please enter a task title');
      return;
    }

    const todayStr = getTodayDateString();
    if (dueDate && dueDate < todayStr) {
      triggerHapticFeedback();
      showToast('Due date cannot be in the past', 'error');
      return;
    }

    const recurrenceConfig: RecurrenceConfig | undefined =
      repeat !== 'Once'
        ? {
            frequency: repeat,
            interval: recurrenceInterval > 1 || repeat === 'Custom' ? recurrenceInterval : 1,
            intervalUnit: repeat === 'Custom' ? recurrenceUnit : undefined,
            weekdays:
              (repeat === 'Weekly' || (repeat === 'Custom' && recurrenceUnit === 'weeks')) &&
              recurrenceWeekdays.length > 0
                ? recurrenceWeekdays
                : undefined,
            endDate: recurrenceEndDate || undefined
          }
        : undefined;

    let targetTaskId = editingTask ? editingTask.id : '';

    if (editingTask) {
      await updateTask(editingTask.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        priority,
        dueDate: dueDate || undefined,
        estimatedPomodoros,
        subtasks,
        repeat,
        recurrenceConfig
      });
      showToast(addToReminders ? 'Task updated & reminder scheduled ⏰' : 'Task updated', 'success');
    } else {
      const created = await addTask({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        priority,
        dueDate: dueDate || undefined,
        estimatedPomodoros,
        subtasks,
        repeat,
        recurrenceConfig
      });
      targetTaskId = created.id;
      showToast(
        addToReminders
          ? `Task created & reminder set for ${reminderTime} ⏰`
          : 'Task added',
        'success'
      );
    }

    if (addToReminders && targetTaskId) {
      const hours = parseInt(reminderTime.split(':')[0], 10) || 9;
      const period: DaySegment =
        hours < 12 ? 'Morning' : hours < 17 ? 'Afternoon' : hours < 21 ? 'Evening' : 'Night';

      const existingRem = useReminderStore.getState().reminders.find(
        (r) => r.taskId === targetTaskId || (!r.taskId && r.title.trim().toLowerCase() === title.trim().toLowerCase())
      );

      if (existingRem) {
        await useReminderStore.getState().updateReminder(existingRem.id, {
          taskId: targetTaskId,
          title: title.trim(),
          time: reminderTime,
          period,
          repeat: repeat === 'Once' ? 'Once' : repeat,
          scheduledDate: dueDate || undefined,
          sound: true,
          soundOption: reminderSound,
          description: description.trim() || undefined
        });
      } else {
        await useReminderStore.getState().addReminder({
          taskId: targetTaskId,
          title: title.trim(),
          time: reminderTime,
          period,
          repeat: repeat === 'Once' ? 'Once' : repeat,
          scheduledDate: dueDate || undefined,
          sound: true,
          soundOption: reminderSound,
          description: description.trim() || undefined
        });
      }
    } else if (!addToReminders && editingTask) {
      const existingRem = useReminderStore.getState().reminders.find(
        (r) => r.taskId === editingTask.id
      );
      if (existingRem) {
        await useReminderStore.getState().deleteReminder(existingRem.id);
      }
    }

    closeTaskModal();
  };

  const soundOptions: SelectOption<ReminderSound>[] = [
    { value: 'chime', label: '🔔 Gentle Chime' },
    { value: 'bell', label: '🧘 Zen Bell' },
    { value: 'marimba', label: '🪵 Warm Marimba' },
    { value: 'beep', label: '📟 Digital Beep' },
    { value: 'harp', label: '🎵 Soft Harp' }
  ];

  const categories: TaskCategory[] = ['Work', 'Design', 'Personal', 'Mindful', 'Health'];
  const categoryOptions: SelectOption<TaskCategory>[] = categories.map((cat) => ({
    value: cat,
    label: cat
  }));

  const priorities: PriorityLevel[] = ['urgent', 'high', 'medium', 'low'];
  const priorityOptions: SelectOption<PriorityLevel>[] = priorities.map((p) => {
    const meta = getPriorityMeta(p);
    return {
      value: p,
      label: `${meta.iconSymbol} ${meta.label}`
    };
  });

  const daysOfWeek = [
    { day: 1, label: 'M' },
    { day: 2, label: 'T' },
    { day: 3, label: 'W' },
    { day: 4, label: 'T' },
    { day: 5, label: 'F' },
    { day: 6, label: 'S' },
    { day: 0, label: 'S' }
  ];

  const toggleWeekday = (day: number) => {
    if (recurrenceWeekdays.includes(day)) {
      setRecurrenceWeekdays(recurrenceWeekdays.filter((d) => d !== day));
    } else {
      setRecurrenceWeekdays([...recurrenceWeekdays, day].sort());
    }
  };

  const handleStopRepeating = () => {
    setRepeat('Once');
    setRecurrenceInterval(1);
    setRecurrenceUnit('days');
    setRecurrenceWeekdays([]);
    setRecurrenceEndDate('');
  };

  return (
    <Modal
      isOpen={taskModalOpen}
      onClose={handleRequestClose}
      title={editingTask ? 'Edit Task' : 'New Task'}
      titleId="task-modal-title"
      maxWidthClass="max-w-lg"
      icon={<Logo size="sm" showWordmark={false} />}
    >
      {/* Accidental Dismissal Protection Confirmation */}
      {showDiscardConfirm && (
        <div className="p-3 mb-3 bg-amber-500/10 border border-amber-500/30 rounded-md flex items-center justify-between text-xs text-on-surface animate-fade-in">
          <span className="font-medium text-amber-700 dark:text-amber-300">Discard unsaved changes?</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDiscardConfirm(false)}
              className="px-2.5 py-1 bg-surface-low hover:bg-surface-container rounded text-secondary hover:text-on-surface text-[11px] font-semibold transition-colors"
            >
              Keep Editing
            </button>
            <button
              type="button"
              onClick={() => {
                setShowDiscardConfirm(false);
                closeTaskModal();
              }}
              className="px-2.5 py-1 bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-400 rounded text-[11px] font-semibold transition-colors"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      <form noValidate onSubmit={handleSubmit} className="space-y-4 my-2">
        {/* Repeating Task Active Indicator with Stop Repeating Option */}
        {editingTask && editingTask.repeat && editingTask.repeat !== 'Once' && (
          <div className="p-3 bg-primary-container/10 border border-primary-container/25 rounded-md flex items-center justify-between text-xs animate-fade-in">
            <div className="flex items-center gap-2 text-on-surface">
              <Repeat className="w-3.5 h-3.5 text-primary-container flex-shrink-0" />
              <span>
                Repeats <strong className="font-semibold">{editingTask.repeat}</strong>
              </span>
            </div>
            {repeat !== 'Once' ? (
              <button
                type="button"
                onClick={handleStopRepeating}
                className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-secondary hover:text-red-600 dark:hover:text-red-400 bg-surface-low hover:bg-surface-lowest border border-outline-subtle rounded transition-colors cursor-pointer"
              >
                Stop Repeating
              </button>
            ) : (
              <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                Will not repeat after saving
              </span>
            )}
          </div>
        )}

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
            aria-required="true"
            aria-invalid={!!titleError}
            aria-describedby={titleError ? 'task-title-error' : undefined}
            placeholder="e.g. Write design documentation..."
            className={`w-full px-3.5 py-2.5 bg-surface-low border rounded-md text-xs text-on-surface transition-all shadow-card focus:outline-none ${getFieldValidationClass(
              !!titleError
            )}`}
          />
          {titleError && (
            <p id="task-title-error" className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1 animate-fade-in font-medium" role="alert">
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

        {/* Category & Priority Grid */}
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

        {/* Due Date */}
        <div>
          <DatePicker
            label="Due Date"
            value={dueDate}
            onChange={(val) => setDueDate(val)}
            minDate={getTodayDateString()}
            placeholder="Pick due date..."
          />
        </div>

        {/* Repeat Recurrence Selector (Spacious, full width, never squeezed) */}
        <div className="space-y-3 relative z-30">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5 font-sans">
              Repeat
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 p-1.5 bg-surface-low border border-outline-variant rounded-lg">
              {(['Once', 'Daily', 'Weekdays', 'Weekly', 'Monthly', 'Custom'] as Recurrence[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={repeat === r}
                  onClick={() => setRepeat(r)}
                  className={`py-2.5 px-1 min-h-[40px] text-xs font-medium rounded-md transition-all text-center cursor-pointer ${
                    repeat === r
                      ? 'bg-primary-container text-on-primary-container font-semibold shadow-xs'
                      : 'text-secondary hover:text-on-surface hover:bg-surface-lowest'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Recurrence Options Panel */}
          {repeat !== 'Once' && (
            <div className="p-3 bg-surface-low border border-outline-subtle rounded-lg space-y-3 relative z-30 animate-fade-in">
              {/* Custom Interval and Unit */}
              {repeat === 'Custom' && (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-secondary font-medium font-sans">Every</span>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={recurrenceInterval}
                    onChange={(e) => setRecurrenceInterval(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    aria-label="Repeat interval"
                    className="w-16 px-2.5 py-1.5 bg-surface-lowest border border-outline-variant rounded-md text-xs text-on-surface text-center focus:border-primary-container focus:outline-none no-spinners"
                  />
                  <div className="flex items-center gap-1 bg-surface-lowest border border-outline-variant rounded-md p-0.5">
                    {(['days', 'weeks', 'months'] as const).map((unit) => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => setRecurrenceUnit(unit)}
                        className={`px-2.5 py-1 text-[11px] rounded font-medium capitalize transition-colors ${
                          recurrenceUnit === unit
                            ? 'bg-primary-container text-on-primary-container font-semibold'
                            : 'text-secondary hover:text-on-surface'
                        }`}
                      >
                        {unit}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Day of week toggles for Weekly or Custom (weeks) */}
              {(repeat === 'Weekly' || (repeat === 'Custom' && recurrenceUnit === 'weeks')) && (
                <div>
                  <span className="block text-[11px] font-semibold text-secondary mb-1.5 font-sans">
                    Repeat on days of the week:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {daysOfWeek.map(({ day, label }, idx) => {
                      const isSelected = recurrenceWeekdays.includes(day);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => toggleWeekday(day)}
                          aria-label={`Toggle day ${label}`}
                          className={`w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-primary-container text-on-primary-container shadow-xs scale-105'
                              : 'bg-surface-lowest text-secondary hover:text-on-surface border border-outline-subtle'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Optional End Date */}
              <div className="max-w-xs relative z-40">
                <DatePicker
                  label="End repeat on (optional)"
                  value={recurrenceEndDate}
                  onChange={(val) => setRecurrenceEndDate(val)}
                  minDate={dueDate || getTodayDateString()}
                  placeholder="Never (repeat indefinitely)"
                />
              </div>
            </div>
          )}
        </div>

        {/* Add to Reminders Section */}
        <div className="p-3 bg-surface-low border border-outline-variant rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-primary-container/15 text-primary-container">
                <Bell className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <span className="text-xs font-semibold text-on-surface">Add to Reminders</span>
                <p className="text-[11px] text-secondary">Schedule an audio alert and reminder notification for this task</p>
              </div>
            </div>
            <ToggleSwitch
              checked={addToReminders}
              onChange={setAddToReminders}
              ariaLabel="Toggle add to reminders"
            />
          </div>

          {addToReminders && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t border-outline-subtle animate-fade-in items-end">
              <TimePicker
                label="Reminder Time"
                value={reminderTime}
                onChange={setReminderTime}
                timeFormat={timeFormat}
              />

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Select<ReminderSound>
                    id="task-reminder-sound-select"
                    label="Reminder Sound"
                    value={reminderSound}
                    onChange={(chosen) => {
                      setReminderSound(chosen);
                      audioManager.playReminderSound(chosen);
                    }}
                    options={soundOptions}
                    ariaLabel="Select reminder sound"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => audioManager.playReminderSound(reminderSound)}
                  className="px-2.5 py-2.5 bg-surface-lowest hover:bg-surface-container border border-outline-variant rounded-md text-secondary hover:text-on-surface text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 flex-shrink-0"
                  title="Play Sound Preview"
                  aria-label="Preview reminder sound"
                >
                  <Volume2 className="w-3.5 h-3.5 text-primary-container" />
                </button>
              </div>
            </div>
          )}
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
          onCancel={handleRequestClose}
          submitText={editingTask ? 'Save Changes' : 'Create Task'}
        />
      </form>
    </Modal>
  );
};

export default TaskModal;
