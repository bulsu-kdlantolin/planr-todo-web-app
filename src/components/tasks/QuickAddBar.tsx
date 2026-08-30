import React, { useState } from 'react';
import { useTaskStore } from '../../store/useTaskStore';
import { useUIStore } from '../../store/useUIStore';
import { PriorityLevel } from '../../types';
import { Plus, CornerDownLeft } from 'lucide-react';

import { getTodayDateString } from '../../utils/date';

export const QuickAddBar: React.FC = () => {
  const addTask = useTaskStore((state) => state.addTask);
  const showToast = useUIStore((state) => state.showToast);
  const [text, setText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    let title = text.trim();
    let priority: PriorityLevel = 'medium';
    let category = 'Work';

    // Parse inline @priority tags
    if (/@urgent\b/i.test(title)) {
      priority = 'urgent';
      title = title.replace(/@urgent\b/gi, '').trim();
    } else if (/@high\b/i.test(title)) {
      priority = 'high';
      title = title.replace(/@high\b/gi, '').trim();
    } else if (/@low\b/i.test(title)) {
      priority = 'low';
      title = title.replace(/@low\b/gi, '').trim();
    }

    // Parse inline #category tags
    const catMatch = title.match(/#(\w+)/);
    if (catMatch && catMatch[1]) {
      category = catMatch[1].charAt(0).toUpperCase() + catMatch[1].slice(1);
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
    showToast(`Quick task added: "${title}"`, 'success');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface-lowest border border-outline-variant rounded-lg p-2 flex items-center gap-2 shadow-sm focus-within:border-primary-container focus-within:ring-2 focus-within:ring-primary-container/20 transition-all"
    >
      <div className="w-8 h-8 rounded-md bg-surface-low text-primary flex items-center justify-center flex-shrink-0">
        <Plus className="w-4 h-4" aria-hidden="true" />
      </div>

      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Quick add intention or task (e.g. 'Draft editorial @urgent #design'). Press Enter..."
        aria-label="Quick add task"
        className="flex-1 px-2 py-1 bg-transparent text-sm text-on-surface placeholder:text-secondary focus:outline-none"
      />

      <button
        type="submit"
        aria-label="Submit quick task"
        className="px-3 py-1.5 bg-surface-low hover:bg-surface-container text-on-surface text-xs font-semibold rounded-md border border-outline-subtle transition-colors flex items-center gap-1 flex-shrink-0"
      >
        <span>Add</span>
        <CornerDownLeft className="w-3.5 h-3.5 text-secondary" aria-hidden="true" />
      </button>
    </form>
  );
};
