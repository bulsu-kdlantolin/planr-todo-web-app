import React, { useState, useEffect } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { useReminderStore } from '../../store/useReminderStore';
import { useMetaStore } from '../../store/useMetaStore';
import { DaySegment, Recurrence } from '../../types';
import { Modal } from '../common/Modal';
import { Select, SelectOption } from '../common/Select';
import { TimePicker } from '../common/TimePicker';
import { DatePicker } from '../common/DatePicker';
import { ToggleSwitch } from '../common/ToggleSwitch';
import { ModalFooter } from '../common/ModalFooter';
import { Logo } from '../common/Logo';
import { AlertCircle } from 'lucide-react';
import { triggerHapticFeedback, getFieldValidationClass } from '../../utils/validation';

export const ReminderModal: React.FC = () => {
  const reminderModalOpen = useUIStore((state) => state.reminderModalOpen);
  const editingReminder = useUIStore((state) => state.editingReminder);
  const closeReminderModal = useUIStore((state) => state.closeReminderModal);
  const showToast = useUIStore((state) => state.showToast);

  const addReminder = useReminderStore((state) => state.addReminder);
  const updateReminder = useReminderStore((state) => state.updateReminder);
  const timeFormat = useMetaStore((state) => state.settings.timeFormat || '12h');

  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState<string | null>(null);
  const [time, setTime] = useState('14:00');
  const [period, setPeriod] = useState<DaySegment>('Afternoon');
  const [repeat, setRepeat] = useState<Recurrence>('Daily');
  const [scheduledDate, setScheduledDate] = useState('');
  const [sound, setSound] = useState(true);
  const [description, setDescription] = useState('');
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  useEffect(() => {
    setTitleError(null);
    setShowDiscardConfirm(false);
    if (editingReminder) {
      setTitle(editingReminder.title);
      setTime(editingReminder.time);
      setPeriod(editingReminder.period);
      setRepeat(editingReminder.repeat);
      setScheduledDate(editingReminder.scheduledDate || '');
      setSound(editingReminder.sound !== false);
      setDescription(editingReminder.description || '');
    } else {
      setTitle('');
      setTime('14:00');
      setPeriod('Afternoon');
      setRepeat('Daily');
      setScheduledDate('');
      setSound(true);
      setDescription('');
    }
  }, [reminderModalOpen, editingReminder]);

  const isDirty = editingReminder
    ? title !== editingReminder.title ||
      description !== (editingReminder.description || '') ||
      time !== editingReminder.time ||
      repeat !== editingReminder.repeat ||
      scheduledDate !== (editingReminder.scheduledDate || '') ||
      sound !== (editingReminder.sound !== false)
    : title.trim() !== '' || description.trim() !== '';

  const handleRequestClose = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      closeReminderModal();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      triggerHapticFeedback();
      setTitleError('Please enter a reminder title');
      return;
    }

    if (editingReminder) {
      updateReminder(editingReminder.id, {
        title: title.trim(),
        time,
        period,
        repeat,
        scheduledDate: repeat === 'Once' ? scheduledDate : undefined,
        sound,
        description: description.trim() || undefined
      });
      showToast(`Reminder updated: "${title.trim()}"`, 'success');
    } else {
      addReminder({
        title: title.trim(),
        time,
        period,
        repeat,
        scheduledDate: repeat === 'Once' ? scheduledDate : undefined,
        sound,
        description: description.trim() || undefined
      });
      showToast(`Reminder scheduled: "${title.trim()}"`, 'success');
    }

    setTitle('');
    setDescription('');
    setScheduledDate('');
    closeReminderModal();
  };

  const periods: DaySegment[] = ['Morning', 'Afternoon', 'Evening', 'Night'];
  const periodOptions: SelectOption<DaySegment>[] = periods.map((p) => ({
    value: p,
    label: p
  }));

  const recurrences: Recurrence[] = ['Daily', 'Weekdays', 'Weekly', 'Once'];
  const recurrenceOptions: SelectOption<Recurrence>[] = recurrences.map((r) => ({
    value: r,
    label: r
  }));

  return (
    <Modal
      isOpen={reminderModalOpen}
      onClose={handleRequestClose}
      title={editingReminder ? 'Edit Reminder' : 'Schedule Reminder'}
      titleId="reminder-modal-title"
      maxWidthClass="max-w-md"
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
                closeReminderModal();
              }}
              className="px-2.5 py-1 bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-400 rounded text-[11px] font-semibold transition-colors"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      <form noValidate onSubmit={handleSubmit} className="space-y-4 my-2">
        <div>
          <label htmlFor="reminder-title-input" className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5 font-sans">
            Reminder Title <span className="text-red-500">*</span>
          </label>
          <input
            id="reminder-title-input"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (titleError) setTitleError(null);
            }}
            placeholder="e.g. Stretch and drink water..."
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

        <div className="grid grid-cols-2 gap-4">
          <TimePicker
            label="Time"
            value={time}
            onChange={(val) => setTime(val)}
            timeFormat={timeFormat}
          />

          <Select<DaySegment>
            label="Day Period"
            value={period}
            onChange={(val) => setPeriod(val)}
            options={periodOptions}
            ariaLabel="Select day period"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 items-end">
          <Select<Recurrence>
            label="Repeat"
            value={repeat}
            onChange={(val) => setRepeat(val)}
            options={recurrenceOptions}
            ariaLabel="Select recurrence"
          />

          <div className="flex items-center justify-between pb-2 px-1">
            <ToggleSwitch
              label="Audio Chime"
              checked={sound}
              onChange={(checked) => setSound(checked)}
              ariaLabel="Toggle audio chime"
            />
          </div>
        </div>

        {repeat === 'Once' && (
          <div className="animate-fade-in">
            <DatePicker
              label="Scheduled Date"
              value={scheduledDate}
              onChange={(val) => setScheduledDate(val)}
              placeholder="Pick scheduled day..."
            />
          </div>
        )}

        <div>
          <label htmlFor="reminder-notes-input" className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5 font-sans">
            Notes
          </label>
          <textarea
            id="reminder-notes-input"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional context or instructions..."
            className="w-full px-3.5 py-2 bg-surface-low border border-outline-variant rounded-md text-xs text-on-surface focus:border-primary-container focus:outline-none shadow-card"
          />
        </div>

        <ModalFooter
          onCancel={handleRequestClose}
          submitText={editingReminder ? 'Save Changes' : 'Save Reminder'}
        />
      </form>
    </Modal>
  );
};

export default ReminderModal;
