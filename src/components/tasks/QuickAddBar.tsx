import React, { useState } from 'react';
import { useTaskStore } from '../../store/useTaskStore';
import { useUIStore } from '../../store/useUIStore';
import { TaskCategory, PriorityLevel } from '../../types';
import { getTodayDateString } from '../../utils/date';
import { Plus, CornerDownLeft } from 'lucide-react';
import { triggerHapticFeedback } from '../../utils/validation';

export const QuickAddBar: React.FC = () => {
  const [text, setText] = useState('');
  const [hasError, setHasError] = useState(false);
  const addTask = useTaskStore((state) => state.addTask);
  const showToast = useUIStore((state) => state.showToast);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      triggerHapticFeedback();
      setHasError(true);
      setTimeout(() => setHasError(false), 500);
      return;
    }

    let title = text.trim();
    let priority: PriorityLevel = 'medium';
    let category: TaskCategory = 'Work';

    // Parse inline @priority tags
    if (/@urgent\b/i.test(title)) {
      priority = 'urgent';
      title = title.replace(/@urgent\b/gi, '').trim();
    } else if (/@high\b/i.test(title)) {
      priority = 'high';
      title = title.replace(/@high\b/gi, '').trim();
    } else if (/@medium\b/i.test(title)) {
      priority = 'medium';
      title = title.replace(/@medium\b/gi, '').trim();
    } else if (/@low\b/i.test(title)) {
      priority = 'low';
      title = title.replace(/@low\b/gi, '').trim();
    }

    // Parse inline #category tags
    const catMatch = title.match(/#(\w+)/);
    if (catMatch && catMatch[1]) {
      category = catMatch[1].charAt(0).toUpperCase() + catMatch[1].slice(1) as TaskCategory;
      title = title.replace(/#\w+/g, '').trim();
    }

    const todayStr = getTodayDateString();

    await addTask({
      title,
      category,
      priority,
      dueDate: todayStr,
      estimatedPomodoros: 1,
      subtasks: []
    });

    setText('');
    setHasError(false);
    showToast(`Quick task added: "${title}"`, 'success');
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className={`bg-surface-lowest border rounded-lg p-2 flex items-center gap-2 shadow-sm transition-all ${
        hasError
          ? '!border-red-500 !ring-2 !ring-red-500/25 animate-shake'
          : 'border-outline-variant focus-within:border-primary-container focus-within:ring-2 focus-within:ring-primary-container/20'
      }`}
    >
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
        placeholder="Quick add intention or task (e.g. 'Draft editorial @urgent #design'). Press Enter..."
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
    </form>
  );
};
