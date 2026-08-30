import React, { useState } from 'react';
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

export const ReminderModal: React.FC = () => {
  const reminderModalOpen = useUIStore((state) => state.reminderModalOpen);
  const closeReminderModal = useUIStore((state) => state.closeReminderModal);
  const showToast = useUIStore((state) => state.showToast);

  const addReminder = useReminderStore((state) => state.addReminder);
  const timeFormat = useMetaStore((state) => state.settings.timeFormat || '12h');

  const [title, setTitle] = useState('');
  const [time, setTime] = useState('14:00');
  const [period, setPeriod] = useState<DaySegment>('Afternoon');
  const [repeat, setRepeat] = useState<Recurrence>('Daily');
  const [scheduledDate, setScheduledDate] = useState('');
  const [sound, setSound] = useState(true);
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await addReminder({
      title: title.trim(),
      time,
      period,
      repeat,
      scheduledDate: repeat === 'Once' && scheduledDate ? scheduledDate : undefined,
      sound,
      description: description.trim() || undefined
    });

    showToast(`Reminder scheduled: "${title.trim()}"`);
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
      onClose={closeReminderModal}
      title="Schedule Reminder"
      titleId="reminder-modal-title"
      maxWidthClass="max-w-md"
      icon={<Logo size="sm" showWordmark={false} />}
    >
      <form onSubmit={handleSubmit} className="space-y-4 my-2">
        <div>
          <label htmlFor="reminder-title-input" className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5 font-sans">
            Reminder Title <span className="text-red-500">*</span>
          </label>
          <input
            id="reminder-title-input"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Stretch and drink water..."
            className="w-full px-3.5 py-2.5 bg-surface-low border border-outline-variant rounded-md text-xs text-on-surface focus:border-primary-container focus:outline-none shadow-card"
          />
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
          onCancel={closeReminderModal}
          submitText="Save Reminder"
        />
      </form>
    </Modal>
  );
};

export default ReminderModal;
