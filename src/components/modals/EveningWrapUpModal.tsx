import React, { useState } from 'react';
import { useTaskStore } from '../../store/useTaskStore';
import { useTimerStore } from '../../store/useTimerStore';
import { useUIStore } from '../../store/useUIStore';
import { Modal } from '../common/Modal';
import { getTodayDateString } from '../../utils/date';
import { audioManager } from '../../utils/audio';
import {
  Moon,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Calendar,
  Smile,
  Check
} from 'lucide-react';

export const EveningWrapUpModal: React.FC = () => {
  const isOpen = useUIStore((state) => state.eveningWrapUpModalOpen);
  const onClose = useUIStore((state) => state.closeEveningWrapUpModal);
  const showToast = useUIStore((state) => state.showToast);

  const tasks = useTaskStore((state) => state.tasks);
  const toggleTask = useTaskStore((state) => state.toggleTask);
  const updateTask = useTaskStore((state) => state.updateTask);
  const focusSessions = useTimerStore((state) => state.focusSessions);

  const todayStr = getTodayDateString();

  // Tasks completed today
  const completedTodayTasks = tasks.filter(
    (t) => t.completed && (t.completedAt ? t.completedAt.split('T')[0] === todayStr : t.dueDate === todayStr)
  );

  // Remaining incomplete tasks due today or overdue
  const remainingTodayTasks = tasks.filter(
    (t) => !t.completed && t.dueDate && t.dueDate <= todayStr
  );

  // Focus time today
  const todaySessions = focusSessions.filter(
    (s) => s.completedAt && s.completedAt.split('T')[0] === todayStr
  );
  const focusMinutesToday = todaySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

  const [reflection, setReflection] = useState(() => {
    try {
      return localStorage.getItem(`planr_reflection_${todayStr}`) || '';
    } catch {
      return '';
    }
  });

  const [migrated, setMigrated] = useState(false);

  // Calculate tomorrow's date string
  const getTomorrowStr = () => {
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    const y = tmrw.getFullYear();
    const m = String(tmrw.getMonth() + 1).padStart(2, '0');
    const d = String(tmrw.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleMigrateRemaining = async () => {
    const tomorrowStr = getTomorrowStr();
    const tasksToMigrate = remainingTodayTasks;

    for (const task of tasksToMigrate) {
      await updateTask(task.id, { dueDate: tomorrowStr });
    }

    setMigrated(true);
    showToast(`Moved ${tasksToMigrate.length} tasks to tomorrow 🌅`, 'info');
  };

  const handleCompleteWrapUp = () => {
    if (reflection.trim()) {
      try {
        localStorage.setItem(`planr_reflection_${todayStr}`, reflection.trim());
      } catch {}
    }

    audioManager.playReminderSound('bell');
    showToast('Day wrapped up peacefully 🌿 Sleep well!', 'success');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Evening Wrap-Up & Reflection"
      titleId="evening-wrapup-title"
      maxWidthClass="max-w-lg"
      icon={
        <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <Moon className="w-4 h-4" aria-hidden="true" />
        </div>
      }
    >
      <div className="space-y-5 my-2">
        {/* Intro */}
        <p className="text-xs text-secondary leading-relaxed font-sans">
          Take a quiet moment to celebrate today&apos;s wins, clear pending tasks off your mind, and wind down peacefully.
        </p>

        {/* 1. Today's Accomplishments Card */}
        <div className="p-4 bg-surface-low border border-outline-subtle rounded-xl space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">
              Today&apos;s Wins
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-surface-lowest border border-outline-subtle rounded-lg flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-lg font-bold text-on-surface leading-none">{completedTodayTasks.length}</p>
                <p className="text-[11px] text-secondary mt-0.5">Tasks Completed</p>
              </div>
            </div>

            <div className="p-3 bg-surface-lowest border border-outline-subtle rounded-lg flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-lg font-bold text-on-surface leading-none">{focusMinutesToday}m</p>
                <p className="text-[11px] text-secondary mt-0.5">Focus Time Logged</p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Remaining Tasks Section */}
        <div className="p-4 bg-surface-low border border-outline-subtle rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
              <Calendar className="w-4 h-4 text-secondary" aria-hidden="true" />
              <span>Incomplete Tasks ({remainingTodayTasks.length})</span>
            </h3>
            {remainingTodayTasks.length > 0 && !migrated && (
              <button
                type="button"
                onClick={handleMigrateRemaining}
                className="text-[11px] font-semibold text-primary hover:text-primary-container flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Move all to Tomorrow</span>
                <ArrowRight className="w-3 h-3" aria-hidden="true" />
              </button>
            )}
          </div>

          {remainingTodayTasks.length === 0 ? (
            <div className="p-4 text-center text-xs text-secondary bg-surface-lowest rounded-lg border border-dashed border-outline-subtle flex flex-col items-center gap-1.5">
              <Smile className="w-5 h-5 text-emerald-500" aria-hidden="true" />
              <p className="font-medium text-on-surface">Your plate is completely clean!</p>
              <p className="text-[11px]">Nothing left over from today.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {remainingTodayTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-2.5 bg-surface-lowest border border-outline-subtle rounded-lg flex items-center justify-between gap-2 text-xs text-on-surface"
                >
                  <span className="truncate flex-1 font-medium">{t.title}</span>
                  <button
                    type="button"
                    onClick={() => toggleTask(t.id)}
                    aria-label={`Mark ${t.title} done`}
                    className="p-1 text-secondary hover:text-emerald-500 rounded transition-colors flex items-center gap-1 text-[11px]"
                  >
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Done</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Reflection Note */}
        <div>
          <label htmlFor="evening-reflection-textarea" className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
            Closing Thought or Gratitude (Optional)
          </label>
          <textarea
            id="evening-reflection-textarea"
            rows={2}
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="What went well today? What's your intention for tomorrow?"
            className="w-full px-3 py-2 bg-surface-lowest border border-outline-variant rounded-lg text-xs text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container resize-none"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-subtle">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-secondary hover:text-on-surface bg-surface-low hover:bg-surface-high border border-outline-subtle rounded-md transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCompleteWrapUp}
            className="px-5 py-2 text-xs font-semibold uppercase tracking-wider bg-primary-container hover:bg-primary text-on-primary-container rounded-md shadow-sm transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
          >
            <span>Close the Day</span>
            <Moon className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </Modal>
  );
};
