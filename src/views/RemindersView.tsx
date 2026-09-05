import React, { useState, useMemo } from 'react';
import { useReminderStore } from '../store/useReminderStore';
import { useMetaStore } from '../store/useMetaStore';
import { useUIStore } from '../store/useUIStore';
import { formatTimeDisplay } from '../utils/date';
import { DaySegment, Recurrence, Reminder } from '../types';
import { ConfirmModal } from '../components/common/ConfirmModal';
import {
  Plus,
  Clock,
  Check,
  Undo2,
  Trash2,
  Edit2,
  BellOff,
  Sun,
  Sunset,
  Moon,
  Sunrise,
  Calendar,
  Sparkles,
  Volume2
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

  const filteredReminders = useMemo(() => {
    return reminders.filter((r) => {
      if (filter === 'active') return !r.completed;
      if (filter === 'completed') return r.completed;
      return true;
    });
  }, [reminders, filter]);

  // Rhythm distribution by day period
  const periodDistribution = useMemo(() => {
    const periods: DaySegment[] = ['Morning', 'Afternoon', 'Evening', 'Night'];
    return periods.map((period) => ({
      period,
      count: reminders.filter((r) => !r.completed && r.period === period).length
    }));
  }, [reminders]);

  // Recurrence breakdown
  const recurrenceDistribution = useMemo(() => {
    const types: Recurrence[] = ['Daily', 'Weekdays', 'Weekly', 'Once'];
    return types.map((repeat) => ({
      repeat,
      count: reminders.filter((r) => !r.completed && r.repeat === repeat).length
    }));
  }, [reminders]);

  // Next upcoming active reminder
  const nextReminder = useMemo(() => {
    const active = reminders.filter((r) => !r.completed);
    if (active.length === 0) return null;
    return [...active].sort((a, b) => a.time.localeCompare(b.time))[0];
  }, [reminders]);

  const activeCount = reminders.filter((r) => !r.completed).length;
  const completedCount = reminders.filter((r) => r.completed).length;
  const [reminderToDelete, setReminderToDelete] = useState<Reminder | null>(null);

  const handleDeleteWithUndo = async (id: string) => {
    const deleted = await deleteReminder(id);
    if (deleted) {
      showToast(`Reminder "${deleted.title}" deleted`, 'info', 'Undo', () => {
        restoreReminder(deleted);
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!reminderToDelete) return;
    const target = reminderToDelete;
    setReminderToDelete(null);
    await handleDeleteWithUndo(target.id);
  };

  const getPeriodIcon = (period: DaySegment) => {
    switch (period) {
      case 'Morning':
        return <Sunrise className="w-4 h-4 text-amber-500" />;
      case 'Afternoon':
        return <Sun className="w-4 h-4 text-orange-500" />;
      case 'Evening':
        return <Sunset className="w-4 h-4 text-rose-500" />;
      case 'Night':
        return <Moon className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="max-w-[1500px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-outline-subtle gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-secondary uppercase tracking-widest font-sans">
              Schedule & Alerts
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface-low border border-outline-subtle text-secondary font-medium">
              {activeCount} scheduled • {completedCount} completed
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-on-surface">
            Reminders
          </h1>
        </div>

        <button
          type="button"
          onClick={() => openReminderModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-container text-on-primary-container hover:bg-primary rounded-md text-xs font-semibold uppercase tracking-wider shadow-sm transition-all focus:ring-2 focus:ring-primary-container focus:outline-none active:scale-[0.98] cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>New Reminder</span>
        </button>
      </div>

      {/* 2-Column Responsive Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* Main Reminders Column (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Standardized Filter Tabs */}
          <div className="flex items-center gap-1.5 border-b border-outline-subtle pb-1" role="tablist" aria-label="Reminder filters">
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'active'}
              onClick={() => setFilter('active')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filter === 'active'
                  ? 'bg-surface-low text-on-surface font-semibold shadow-card border border-outline-variant'
                  : 'text-secondary hover:text-on-surface hover:bg-surface-low/50'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'completed'}
              onClick={() => setFilter('completed')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filter === 'completed'
                  ? 'bg-surface-low text-on-surface font-semibold shadow-card border border-outline-variant'
                  : 'text-secondary hover:text-on-surface hover:bg-surface-low/50'
              }`}
            >
              Completed ({completedCount})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'all'}
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
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
            <div className="bg-surface-low border border-dashed border-outline-variant rounded-xl p-12 text-center space-y-3 shadow-xs">
              <BellOff className="w-8 h-8 text-secondary mx-auto opacity-50" aria-hidden="true" />
              <h3 className="font-serif text-lg font-medium text-on-surface">No reminders found</h3>
              <p className="text-xs text-secondary max-w-sm mx-auto font-sans leading-relaxed">
                {filter === 'active'
                  ? 'You have completed all active reminders.'
                  : 'No reminders in this view.'}
              </p>
              <button
                type="button"
                onClick={() => openReminderModal()}
                className="px-4 py-2 bg-primary-container text-on-primary-container hover:bg-primary text-xs font-semibold uppercase tracking-wider rounded-md transition-colors shadow-sm cursor-pointer"
              >
                Create Reminder
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReminders.map((reminder) => {
                const formattedTime = formatTimeDisplay(reminder.time, timeFormat);
                return (
                  <div
                    key={reminder.id}
                    className={`p-5 rounded-xl border transition-all shadow-card hover:-translate-y-0.5 ${
                      reminder.completed
                        ? 'bg-surface-low/50 border-outline-subtle opacity-70'
                        : 'bg-surface-lowest border-outline-subtle hover:border-outline-variant hover:shadow-ambient'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span className="font-sans text-[11px] font-bold text-tertiary uppercase tracking-wider flex items-center gap-1.5">
                          {getPeriodIcon(reminder.period)}
                          <span>{formattedTime} • {reminder.period}</span>
                        </span>
                        <h3
                          className={`font-serif text-base font-medium text-on-surface mt-1 ${
                            reminder.completed ? 'line-through text-secondary' : ''
                          }`}
                        >
                          {reminder.title}
                        </h3>
                      </div>

                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-surface-low text-secondary border border-outline-subtle flex-shrink-0 font-sans font-medium">
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
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                            reminder.completed
                              ? 'bg-surface-low hover:bg-surface-container text-secondary'
                              : 'bg-primary-container hover:bg-primary text-on-primary-container shadow-xs'
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
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-surface-low hover:bg-surface-container text-secondary hover:text-on-surface border border-outline-subtle transition-colors cursor-pointer"
                          >
                            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>+15m</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openReminderModal(reminder)}
                          aria-label={`Edit reminder ${reminder.title}`}
                          className="p-1.5 text-secondary hover:text-on-surface rounded-md hover:bg-surface-low transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setReminderToDelete(reminder)}
                          aria-label={`Delete reminder ${reminder.title}`}
                          className="p-1.5 text-secondary hover:text-red-500 rounded-md hover:bg-surface-low transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Companion Sidebar Column (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Next Reminder Highlight Card */}
          {nextReminder && (
            <div className="bg-surface-lowest border border-primary-container/30 rounded-xl p-5 shadow-card space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-outline-subtle pb-2.5 gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Clock className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
                  <h3 className="font-serif text-sm font-semibold text-on-surface truncate">Next Reminder</h3>
                </div>
                <span className="text-xs font-bold text-primary-container font-sans flex-shrink-0">
                  {formatTimeDisplay(nextReminder.time, timeFormat)}
                </span>
              </div>

              <div>
                <h4 className="font-serif text-base font-semibold text-on-surface break-words">{nextReminder.title}</h4>
                {nextReminder.description && (
                  <p className="text-xs text-secondary mt-1 line-clamp-2">{nextReminder.description}</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] text-secondary font-sans">
                <span>{nextReminder.period}</span>
                <span>{nextReminder.repeat}</span>
              </div>
            </div>
          )}

          {/* Daily Schedule Timeline Card */}
          <div className="bg-surface-lowest border border-outline-variant rounded-xl p-5 shadow-card space-y-3.5">
            <div className="flex items-center gap-2 border-b border-outline-subtle pb-2.5">
              <Sparkles className="w-4 h-4 text-tertiary" aria-hidden="true" />
              <h3 className="font-serif text-sm font-semibold text-on-surface">By Time of Day</h3>
            </div>

            <div className="space-y-2">
              {periodDistribution.map(({ period, count }) => (
                <div
                  key={period}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-low border border-outline-subtle text-xs"
                >
                  <div className="flex items-center gap-2">
                    {getPeriodIcon(period)}
                    <span className="font-medium text-on-surface">{period}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-secondary font-sans">
                    {count} {count === 1 ? 'alert' : 'alerts'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Habit Cadence Breakdown Card */}
          <div className="bg-surface-lowest border border-outline-variant rounded-xl p-5 shadow-card space-y-3">
            <div className="flex items-center gap-2 border-b border-outline-subtle pb-2.5">
              <Calendar className="w-4 h-4 text-tertiary" aria-hidden="true" />
              <h3 className="font-serif text-sm font-semibold text-on-surface">Repeat Frequency</h3>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-sans">
              {recurrenceDistribution.map(({ repeat, count }) => (
                <div key={repeat} className="p-2.5 bg-surface-low rounded-lg border border-outline-subtle">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-secondary block">
                    {repeat}
                  </span>
                  <span className="font-serif text-base font-bold text-on-surface">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!reminderToDelete}
        onClose={() => setReminderToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Reminder"
        description={`Are you sure you want to delete "${reminderToDelete?.title}"? This action can still be undone from the notification banner.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive
      />
    </div>
  );
};
