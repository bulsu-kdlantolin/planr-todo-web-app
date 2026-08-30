import React from 'react';
import { useTaskStore } from '../../store/useTaskStore';
import { useTimerStore } from '../../store/useTimerStore';
import { Task, FocusSession } from '../../types';
import { Flame, TrendingUp, Calendar } from 'lucide-react';

interface WeeklyAnalyticsProps {
  focusSessions?: FocusSession[];
  tasks?: Task[];
}

export const WeeklyAnalytics: React.FC<WeeklyAnalyticsProps> = ({
  focusSessions: propSessions,
  tasks: propTasks
}) => {
  const storeTasks = useTaskStore((state) => state.tasks);
  const storeSessions = useTimerStore((state) => state.focusSessions);

  const tasks = propTasks || storeTasks;
  const focusSessions = propSessions || storeSessions;

  // Compute 7 days of focus data
  const days: { label: string; dateStr: string; focusMins: number; completedTasks: number }[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en-US', { weekday: 'narrow' });

    const daySessions = focusSessions.filter((s) => s.completedAt && s.completedAt.split('T')[0] === dateStr);
    const focusMins = daySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

    const completedTasks = tasks.filter((t) => t.completed && t.dueDate === dateStr).length;

    days.push({ label, dateStr, focusMins, completedTasks });
  }

  const maxMins = Math.max(60, ...days.map((d) => d.focusMins));
  const totalWeeklyFocus = days.reduce((acc, d) => acc + d.focusMins, 0);
  const totalWeeklyCompleted = tasks.filter((t) => t.completed).length;

  return (
    <div className="bg-surface-lowest border border-outline-subtle rounded-lg p-6 shadow-card space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-outline-subtle">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-tertiary" aria-hidden="true" />
          <div>
            <h3 className="font-serif text-lg font-semibold text-on-surface">Weekly Flow & Reflection</h3>
            <p className="text-xs text-secondary">7-day focus distribution and intentional habit velocity</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-on-surface">
            <span className="w-2.5 h-2.5 rounded-full bg-tertiary" aria-hidden="true" />
            <span>{totalWeeklyFocus} mins deep focus</span>
          </div>
          <div className="flex items-center gap-1.5 font-semibold text-secondary">
            <span className="w-2.5 h-2.5 rounded-full bg-primary-container" aria-hidden="true" />
            <span>{totalWeeklyCompleted} tasks completed</span>
          </div>
        </div>
      </div>

      {/* 7-Day Focus Distribution Bar Chart */}
      <div className="grid grid-cols-7 gap-2 pt-2 items-end h-32">
        {days.map((day, idx) => {
          const heightPercent = Math.min(100, Math.round((day.focusMins / maxMins) * 100));
          const isToday = idx === 6;

          return (
            <div key={day.dateStr} className="flex flex-col items-center gap-2 h-full justify-end group">
              <div className="text-[10px] font-semibold text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                {day.focusMins}m
              </div>
              <div className="w-full max-w-[28px] bg-surface-low rounded-t flex flex-col justify-end overflow-hidden h-20">
                <div
                  style={{ height: `${Math.max(8, heightPercent)}%` }}
                  className={`w-full rounded-t transition-all duration-500 ${
                    isToday ? 'bg-tertiary' : 'bg-tertiary/70 group-hover:bg-tertiary'
                  }`}
                  title={`${day.dateStr}: ${day.focusMins} mins (${day.completedTasks} tasks)`}
                />
              </div>
              <span className={`text-[11px] font-semibold uppercase ${isToday ? 'text-tertiary' : 'text-secondary'}`}>
                {day.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
