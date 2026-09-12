import React from 'react';
import { Award, Timer, Bell } from 'lucide-react';
import { Task, Reminder, FocusSession } from '../../types';

interface DailyMetricsCardsProps {
  percentage: number;
  completedCount: number;
  totalTrackedToday: number;
  isAllDone: boolean;
  todayActiveTasks: Task[];
  focusMinutesToday: number;
  todaySessions: FocusSession[];
  todayReminders: Reminder[];
  isWeekday: boolean;
}

export const DailyMetricsCards: React.FC<DailyMetricsCardsProps> = ({
  percentage,
  completedCount,
  totalTrackedToday,
  isAllDone,
  todayActiveTasks,
  focusMinutesToday,
  todaySessions,
  todayReminders,
  isWeekday
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Metric 1: Tasks Progress Ring */}
      <div className="bg-surface-low border border-outline-subtle rounded-lg p-6 flex items-center justify-between shadow-card hover:-translate-y-0.5 transition-transform">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider block font-sans">
              Tasks Completed
            </span>
            {isAllDone && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                <Award className="w-3 h-3" /> All Done
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-on-surface">
              {percentage}%
            </span>
            <span className="text-xs text-secondary">
              ({completedCount}/{totalTrackedToday})
            </span>
          </div>
          <p className="text-xs text-secondary pt-1 font-sans">
            {isAllDone ? '✨ All clear — enjoy your evening' : `${todayActiveTasks.length} tasks remaining for today`}
          </p>
        </div>

        {/* SVG Circular Balance Meter with Celebration Glow Ring */}
        <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
          {isAllDone && (
            <div className="absolute inset-0 rounded-full border-2 border-emerald-500/50 animate-ping pointer-events-none" />
          )}
          <svg className="w-14 h-14 -rotate-90 transform" role="img" aria-label={`Completion: ${percentage}%`}>
            <circle
              cx="28"
              cy="28"
              r="22"
              stroke="currentColor"
              strokeWidth="4"
              className="text-surface-high"
              fill="transparent"
            />
            <circle
              cx="28"
              cy="28"
              r="22"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={2 * Math.PI * 22}
              strokeDashoffset={2 * Math.PI * 22 - (percentage / 100) * (2 * Math.PI * 22)}
              strokeLinecap="round"
              className={`transition-all duration-700 ease-gentle ${
                isAllDone ? 'text-emerald-600' : 'text-tertiary'
              }`}
              fill="transparent"
            />
          </svg>
        </div>
      </div>

      {/* Metric 2: Focus Minutes */}
      <div className="bg-surface-low border border-outline-subtle rounded-lg p-6 flex items-center justify-between shadow-card hover:-translate-y-0.5 transition-transform">
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider block font-sans">
            Focus Time Today
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-on-surface">
              {focusMinutesToday}
            </span>
            <span className="text-xs text-secondary">minutes</span>
          </div>
          <p className="text-xs text-secondary pt-1">
            {todaySessions.length} completed focus {todaySessions.length === 1 ? 'session' : 'sessions'}
          </p>
        </div>

        <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-primary-container flex-shrink-0">
          <Timer className="w-6 h-6 text-tertiary" aria-hidden="true" />
        </div>
      </div>

      {/* Metric 3: Reminders for Today */}
      <div className="bg-surface-low border border-outline-subtle rounded-lg p-6 flex items-center justify-between shadow-card hover:-translate-y-0.5 transition-transform">
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider block font-sans">
            Today's Reminders
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-on-surface">
              {todayReminders.length}
            </span>
            <span className="text-xs text-secondary">scheduled</span>
          </div>
          <p className="text-xs text-secondary pt-1">
            Alerts active for {isWeekday ? 'today (weekday)' : 'today (weekend)'}
          </p>
        </div>

        <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-primary-container flex-shrink-0">
          <Bell className="w-6 h-6 text-tertiary" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
};
