import React, { useState, useMemo } from 'react';
import { useTaskStore } from '../../store/useTaskStore';
import { useReminderStore } from '../../store/useReminderStore';
import { useUIStore } from '../../store/useUIStore';
import { parseNaturalLanguageTask, getTimeDaySegment } from '../../utils/dateParsing';
import { Plus, CornerDownLeft, Calendar, Clock, RotateCw, Sparkles } from 'lucide-react';
import { triggerHapticFeedback } from '../../utils/validation';

export const QuickAddBar: React.FC = () => {
  const [text, setText] = useState('');
  const [hasError, setHasError] = useState(false);
  const addTask = useTaskStore((state) => state.addTask);
  const addReminder = useReminderStore((state) => state.addReminder);
  const showToast = useUIStore((state) => state.showToast);

  const parsed = useMemo(() => {
    if (!text.trim()) return null;
    return parseNaturalLanguageTask(text);
  }, [text]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      triggerHapticFeedback();
      setHasError(true);
      setTimeout(() => setHasError(false), 500);
      return;
    }

    const result = parseNaturalLanguageTask(text);

    const newTask = await addTask({
      title: result.title,
      category: result.category,
      priority: result.priority,
      dueDate: result.dueDate,
      repeat: result.repeat,
      estimatedPomodoros: 1,
      subtasks: []
    });

    if (result.dueTime && newTask) {
      await addReminder({
        title: result.title,
        time: result.dueTime,
        period: getTimeDaySegment(result.dueTime),
        sound: true,
        soundOption: 'chime',
        repeat: result.repeat,
        taskId: newTask.id,
        scheduledDate: result.dueDate
      });
    }

    setText('');
    setHasError(false);
    showToast(
      result.dueTime
        ? `Task added with reminder for ${result.tokens.timeLabel || result.dueTime} ⏰`
        : `Quick task added: "${result.title}"`,
      'success'
    );
  };

  const hasTokens =
    parsed &&
    (parsed.tokens.dateLabel ||
      parsed.tokens.timeLabel ||
      parsed.tokens.repeatLabel ||
      parsed.tokens.priorityLabel ||
      parsed.tokens.categoryLabel);

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className={`bg-surface-lowest border rounded-lg p-2.5 flex flex-col gap-2 shadow-sm transition-all ${
        hasError
          ? '!border-red-500 !ring-2 !ring-red-500/25 animate-shake'
          : 'border-outline-variant focus-within:border-primary-container focus-within:ring-2 focus-within:ring-primary-container/20'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-md bg-surface-low text-primary flex items-center justify-center flex-shrink-0">
          <Plus className="w-4 h-4" aria-hidden="true" />
        </div>

        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (hasError) setHasError(false);
          }}
          placeholder="Quick add with natural language (e.g. 'Team sync tomorrow at 3pm @urgent #work'). Press Enter..."
          aria-label="Quick add task"
          className="flex-1 px-2 py-1 bg-transparent text-sm text-on-surface placeholder:text-secondary focus:outline-none"
        />

        <button
          type="submit"
          aria-label="Submit quick task"
          className="px-3 py-1.5 bg-surface-low hover:bg-surface-container text-on-surface text-xs font-semibold rounded-md border border-outline-subtle transition-colors flex items-center gap-1 flex-shrink-0 cursor-pointer"
        >
          <span>Add</span>
          <CornerDownLeft className="w-3.5 h-3.5 text-secondary" aria-hidden="true" />
        </button>
      </div>

      {hasTokens && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1.5 px-1 border-t border-outline-subtle text-[11px] animate-fade-in">
          <span className="text-[10px] uppercase font-bold tracking-wider text-secondary flex items-center gap-1 mr-1">
            <Sparkles className="w-3 h-3 text-primary" />
            Detected:
          </span>
          {parsed.tokens.dateLabel && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container text-on-surface font-medium border border-outline-subtle">
              <Calendar className="w-3 h-3 text-secondary" />
              <span>{parsed.tokens.dateLabel}</span>
            </span>
          )}
          {parsed.tokens.timeLabel && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-container/15 text-primary font-medium border border-primary-container/30">
              <Clock className="w-3 h-3 text-primary" />
              <span>{parsed.tokens.timeLabel}</span>
            </span>
          )}
          {parsed.tokens.repeatLabel && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-medium border border-indigo-500/30">
              <RotateCw className="w-3 h-3 text-indigo-500" />
              <span>{parsed.tokens.repeatLabel}</span>
            </span>
          )}
          {parsed.tokens.priorityLabel && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium border ${
                parsed.priority === 'urgent'
                  ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                  : parsed.priority === 'high'
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                  : parsed.priority === 'low'
                  ? 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30'
                  : 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30'
              }`}
            >
              <span>{parsed.priority === 'urgent' ? '⚡ Urgent' : parsed.priority === 'high' ? '▲ High' : parsed.priority === 'low' ? '▼ Low' : '◆ Medium'}</span>
            </span>
          )}
          {parsed.tokens.categoryLabel && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-high text-secondary font-medium border border-outline-subtle">
              <span>#{parsed.tokens.categoryLabel}</span>
            </span>
          )}
        </div>
      )}
    </form>
  );
};
