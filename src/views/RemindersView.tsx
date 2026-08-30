import React from 'react';
import { useReminderStore } from '../store/useReminderStore';
import { useMetaStore } from '../store/useMetaStore';
import { useUIStore } from '../store/useUIStore';
import { formatTimeDisplay } from '../utils/date';
import {
  Plus,
  Clock,
  Check,
  Undo2,
  Trash2,
  BellOff
} from 'lucide-react';

export const RemindersView: React.FC = () => {
  const reminders = useReminderStore((state) => state.reminders);
  const filter = useReminderStore((state) => state.filter);
  const setFilter = useReminderStore((state) => state.setFilter);
  const toggleReminder = useReminderStore((state) => state.toggleReminder);
  const snoozeReminder = useReminderStore((state) => state.snoozeReminder);
  const deleteReminder = useReminderStore((state) => state.deleteReminder);
  const restoreReminder = useReminderStore((state) => state.restoreReminder);

  const timeFormat = useMetaStore((state) => state.settings.timeFormat || '12h');

  const openReminderModal = useUIStore((state) => state.openReminderModal);
  const showToast = useUIStore((state) => state.showToast);

  const filteredReminders = reminders.filter((r) => {
    if (filter === 'active') return !r.completed;
    if (filter === 'completed') return r.completed;
    return true;
  });

  const handleDeleteWithUndo = async (id: string) => {
    const deleted = await deleteReminder(id);
    if (deleted) {
      showToast(`Reminder "${deleted.title}" deleted`, 'info', 'Undo', () => {
        restoreReminder(deleted);
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-5 border-b border-outline-subtle gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-on-surface">Reminders</h1>
          <p className="text-sm text-secondary mt-1">
            Gentle alerts and scheduled daily reminders.
          </p>
        </div>

        <button
          type="button"
          onClick={openReminderModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-container text-on-primary-container hover:bg-primary rounded-md text-xs font-semibold uppercase tracking-wider shadow-sm transition-all focus:ring-2 focus:ring-primary-container focus:outline-none active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>New Reminder</span>
        </button>
      </div>

      {/* Standardized Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-outline-subtle pb-1" role="tablist" aria-label="Reminder filters">
        <button
          type="button"
          role="tab"
          aria-selected={filter === 'active'}
          onClick={() => setFilter('active')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
            filter === 'active'
              ? 'bg-surface-low text-on-surface font-semibold shadow-card border border-outline-variant'
              : 'text-secondary hover:text-on-surface hover:bg-surface-low/50'
          }`}
        >
          Active ({reminders.filter((r) => !r.completed).length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filter === 'completed'}
          onClick={() => setFilter('completed')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
            filter === 'completed'
              ? 'bg-surface-low text-on-surface font-semibold shadow-card border border-outline-variant'
              : 'text-secondary hover:text-on-surface hover:bg-surface-low/50'
          }`}
        >
          Completed ({reminders.filter((r) => r.completed).length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filter === 'all'}
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
            filter === 'all'
              ? 'bg-surface-low text-on-surface font-semibold shadow-card border border-outline-variant'
              : 'text-secondary hover:text-on-surface hover:bg-surface-low/50'
          }`}
        >
          All ({reminders.length})
        </button>
      </div>

      {/* Reminders List */}
      {filteredReminders.length === 0 ? (
        <div className="bg-surface-low border border-dashed border-outline-variant rounded-lg p-12 text-center space-y-3">
          <BellOff className="w-8 h-8 text-secondary mx-auto opacity-50" aria-hidden="true" />
          <h3 className="font-serif text-lg font-medium text-on-surface">No reminders found</h3>
          <p className="text-xs text-secondary max-w-sm mx-auto font-sans">
            {filter === 'active'
              ? 'You have completed all active reminders.'
              : 'No reminders in this view.'}
          </p>
          <button
            type="button"
            onClick={openReminderModal}
            className="px-4 py-2 bg-primary-container text-on-primary-container hover:bg-primary text-xs font-semibold uppercase tracking-wider rounded-md transition-colors shadow-sm"
          >
            Create Reminder
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReminders.map((reminder) => {
            const formattedTime = formatTimeDisplay(reminder.time, timeFormat);
            return (
              <div
                key={reminder.id}
                className={`p-5 rounded-lg border transition-all shadow-card hover:-translate-y-0.5 ${
                  reminder.completed
                    ? 'bg-surface-low/50 border-outline-subtle opacity-70'
                    : 'bg-surface-lowest border-outline-subtle hover:border-outline-variant hover:shadow-ambient'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="font-sans text-[11px] font-bold text-tertiary uppercase tracking-wider">
                      {formattedTime} • {reminder.period}
                    </span>
                    <h3
                      className={`font-serif text-base font-medium text-on-surface mt-0.5 ${
                        reminder.completed ? 'line-through text-secondary' : ''
                      }`}
                    >
                      {reminder.title}
                    </h3>
                  </div>

                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-low text-secondary border border-outline-subtle flex-shrink-0">
                    {reminder.repeat}
                  </span>
                </div>

                {reminder.description && (
                  <p className="text-xs text-secondary mb-4 line-clamp-2 leading-relaxed">
                    {reminder.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-outline-subtle">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleReminder(reminder.id)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                        reminder.completed
                          ? 'bg-surface-low hover:bg-surface-container text-secondary'
                          : 'bg-primary-container hover:bg-primary text-on-primary-container shadow-sm'
                      }`}
                    >
                      {reminder.completed ? (
                        <>
                          <Undo2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Reactivate</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Done</span>
                        </>
                      )}
                    </button>

                    {!reminder.completed && (
                      <button
                        type="button"
                        onClick={() => snoozeReminder(reminder.id, 15)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium bg-surface-low hover:bg-surface-container text-secondary hover:text-on-surface border border-outline-subtle transition-colors"
                      >
                        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>+15m</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteWithUndo(reminder.id)}
                    aria-label={`Delete reminder ${reminder.title}`}
                    className="p-1.5 text-secondary hover:text-error rounded hover:bg-surface-low transition-colors"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
