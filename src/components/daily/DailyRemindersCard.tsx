import React from 'react';
import { Bell, ArrowRight } from 'lucide-react';
import { Reminder } from '../../types';
import { formatTimeDisplay } from '../../utils/date';

interface DailyRemindersCardProps {
  todayReminders: Reminder[];
  timeFormat: '12h' | '24h';
  onNavigateReminders: () => void;
  onToggleReminder: (id: string) => void;
}

export const DailyRemindersCard: React.FC<DailyRemindersCardProps> = ({
  todayReminders,
  timeFormat,
  onNavigateReminders,
  onToggleReminder
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-tertiary" aria-hidden="true" />
          <h2 className="font-serif text-xl font-semibold text-on-surface">
            Today's Reminders
          </h2>
        </div>
        <button
          type="button"
          onClick={onNavigateReminders}
          className="text-xs font-semibold text-primary hover:text-primary-container flex items-center gap-1 transition-colors uppercase tracking-wider"
        >
          <span>Manage</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      <div className="bg-surface-low border border-outline-subtle rounded-lg p-4 space-y-3 shadow-card">
        {todayReminders.length === 0 ? (
          <p className="text-xs text-secondary text-center py-4">No reminders scheduled for today.</p>
        ) : (
          todayReminders.slice(0, 4).map((reminder) => (
            <div
              key={reminder.id}
              className={`p-3 rounded-md border text-xs transition-all ${
                reminder.completed
                  ? 'bg-surface-high/40 border-outline-subtle/50 text-secondary'
                  : 'bg-surface-lowest border-outline-subtle text-on-surface'
              }`}
            >
              <div className="flex items-center justify-between font-semibold mb-1">
                <span className={reminder.completed ? 'line-through' : ''}>
                  {reminder.title}
                </span>
                <span className="font-mono text-secondary">
                  {formatTimeDisplay(reminder.time, timeFormat)}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-secondary">
                <span>{reminder.repeat}</span>
                <button
                  type="button"
                  onClick={() => onToggleReminder(reminder.id)}
                  className="text-primary hover:underline"
                >
                  {reminder.completed ? 'Mark active' : 'Mark done'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
