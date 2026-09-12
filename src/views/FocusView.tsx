import React, { useState, useEffect, useMemo } from 'react';
import { useTimerStore, AmbientType } from '../store/useTimerStore';
import { useTaskStore } from '../store/useTaskStore';
import { FocusTimerClock } from '../components/focus/FocusTimerClock';
import { Select, SelectOption } from '../components/common/Select';
import { audioManager } from '../utils/audio';
import {
  Play,
  Pause,
  RotateCcw,
  Headphones,
  SlidersHorizontal,
  Target,
  CheckCircle2,
  Flame,
  Clock,
  Sparkles,
  ListTodo
} from 'lucide-react';

export const FocusView: React.FC = () => {
  const currentPreset = useTimerStore((state) => state.currentPreset);
  const durationSec = useTimerStore((state) => state.durationSec);
  const isRunning = useTimerStore((state) => state.isRunning);
  const selectedTaskId = useTimerStore((state) => state.selectedTaskId);
  const ambientType = useTimerStore((state) => state.ambientType);
  const focusSessions = useTimerStore((state) => state.focusSessions);

  const setPreset = useTimerStore((state) => state.setPreset);
  const setCustomDuration = useTimerStore((state) => state.setCustomDuration);
  const setSelectedTaskId = useTimerStore((state) => state.setSelectedTaskId);
  const setAmbientType = useTimerStore((state) => state.setAmbientType);
  const toggleTimer = useTimerStore((state) => state.toggleTimer);
  const resetTimer = useTimerStore((state) => state.resetTimer);

  const [customHours, setCustomHours] = useState(() => {
    if (currentPreset === 'custom' && durationSec > 0) {
      return Math.floor(durationSec / 3600);
    }
    return 0;
  });
  const [customMinutes, setCustomMinutes] = useState(() => {
    if (currentPreset === 'custom' && durationSec > 0) {
      return Math.floor((durationSec % 3600) / 60);
    }
    return 25;
  });
  const [customSeconds, setCustomSeconds] = useState(() => {
    if (currentPreset === 'custom' && durationSec > 0) {
      return durationSec % 60;
    }
    return 0;
  });

  const applyCustomDuration = (h: number, m: number, s: number) => {
    const clampedH = Math.max(0, Math.min(24, isNaN(h) ? 0 : h));
    const clampedM = Math.max(0, Math.min(59, isNaN(m) ? 0 : m));
    const clampedS = Math.max(0, Math.min(59, isNaN(s) ? 0 : s));
    setCustomHours(clampedH);
    setCustomMinutes(clampedM);
    setCustomSeconds(clampedS);
    const total = clampedH * 3600 + clampedM * 60 + clampedS;
    setCustomDuration(Math.max(1, total));
  };

  // Clean up audio buffers on unmount
  useEffect(() => {
    return () => {
      audioManager.disposeBuffers();
    };
  }, []);

  const tasks = useTaskStore((state) => state.tasks);
  const toggleSubtask = useTaskStore((state) => state.toggleSubtask);
  const toggleTask = useTaskStore((state) => state.toggleTask);
  const activeTasks = tasks.filter((t) => !t.completed);

  const selectedTask = useMemo(() => {
    return tasks.find((t) => t.id === selectedTaskId) || null;
  }, [tasks, selectedTaskId]);

  // Convert tasks to options for Select
  const taskOptions: SelectOption[] = [
    { value: '', label: 'General Focus (No specific task)' },
    ...activeTasks.map((t) => ({
      value: t.id,
      label: t.title,
      badge: t.category
    }))
  ];

  // Today's focus sessions calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessions = useMemo(() => {
    return focusSessions.filter((s) => s.completedAt.startsWith(todayStr));
  }, [focusSessions, todayStr]);

  const totalFocusMinsToday = useMemo(() => {
    return todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  }, [todaySessions]);

  return (
    <div className="max-w-[1500px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-outline-subtle gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-secondary uppercase tracking-widest font-sans">
              Focus Session
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface-low border border-outline-subtle text-secondary font-medium">
              {todaySessions.length} sessions today • {totalFocusMinsToday}m focused
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-on-surface">
            Focus Timer
          </h1>
        </div>
      </div>

      {/* 2-Column Responsive Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* Left Focus Timer Core Column (7 cols) */}
        <div className="lg:col-span-7 bg-surface-lowest border border-outline-variant rounded-2xl p-6 sm:p-8 shadow-card flex flex-col items-center justify-center text-center space-y-6">
          {/* Timer Presets */}
          <div className="flex flex-wrap items-center justify-center gap-2" role="group" aria-label="Timer presets">
            <button
              type="button"
              aria-pressed={currentPreset === 'pomodoro'}
              onClick={() => setPreset('pomodoro', 25)}
              className={`px-4 py-2 min-h-[36px] rounded-full text-xs font-medium transition-all cursor-pointer ${
                currentPreset === 'pomodoro'
                  ? 'bg-surface-container text-on-surface border border-outline-variant font-semibold shadow-xs'
                  : 'text-secondary hover:text-on-surface hover:bg-surface-low'
              }`}
            >
              25 Minutes
            </button>
            <button
              type="button"
              aria-pressed={currentPreset === 'deep'}
              onClick={() => setPreset('deep', 50)}
              className={`px-4 py-2 min-h-[36px] rounded-full text-xs font-medium transition-all cursor-pointer ${
                currentPreset === 'deep'
                  ? 'bg-surface-container text-on-surface border border-outline-variant font-semibold shadow-xs'
                  : 'text-secondary hover:text-on-surface hover:bg-surface-low'
              }`}
            >
              50 Minutes
            </button>
            <button
              type="button"
              aria-pressed={currentPreset === 'short'}
              onClick={() => setPreset('short', 5)}
              className={`px-4 py-2 min-h-[36px] rounded-full text-xs font-medium transition-all cursor-pointer ${
                currentPreset === 'short'
                  ? 'bg-surface-container text-on-surface border border-outline-variant font-semibold shadow-xs'
                  : 'text-secondary hover:text-on-surface hover:bg-surface-low'
              }`}
            >
              5 Min Break
            </button>
            <button
              type="button"
              aria-pressed={currentPreset === 'long'}
              onClick={() => setPreset('long', 15)}
              className={`px-4 py-2 min-h-[36px] rounded-full text-xs font-medium transition-all cursor-pointer ${
                currentPreset === 'long'
                  ? 'bg-surface-container text-on-surface border border-outline-variant font-semibold shadow-xs'
                  : 'text-secondary hover:text-on-surface hover:bg-surface-low'
              }`}
            >
              15 Min Break
            </button>
            <button
              type="button"
              aria-pressed={currentPreset === 'custom'}
              onClick={() => {
                if (currentPreset !== 'custom') {
                  applyCustomDuration(customHours, customMinutes, customSeconds);
                }
              }}
              className={`px-4 py-2 min-h-[36px] rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                currentPreset === 'custom'
                  ? 'bg-primary-container text-on-primary-container border border-primary font-semibold shadow-xs'
                  : 'text-secondary hover:text-on-surface hover:bg-surface-low'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                Custom
                {currentPreset === 'custom'
                  ? ` (${customHours > 0 ? `${customHours}h ` : ''}${customMinutes}m${customSeconds > 0 ? ` ${customSeconds}s` : ''})`
                  : ''}
              </span>
            </button>
          </div>

          {/* Custom Duration Configurator */}
          {currentPreset === 'custom' && (
            <div className="flex flex-wrap items-center justify-center gap-3 py-2.5 px-4 bg-surface-low border border-outline-subtle rounded-xl animate-fade-in shadow-xs">
              <span className="text-xs text-secondary font-medium font-sans">Set Time:</span>

              <div className="flex items-center gap-2">
                {/* Hours Field */}
                <div className="flex items-center gap-1 bg-surface-lowest border border-outline-variant px-2.5 py-1 rounded-md shadow-xs">
                  <input
                    type="number"
                    min={0}
                    max={24}
                    value={customHours}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                      applyCustomDuration(val, customMinutes, customSeconds);
                    }}
                    className="w-8 text-center text-sm font-semibold font-serif bg-transparent text-on-surface focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none no-spinners"
                    aria-label="Custom focus duration hours"
                  />
                  <span className="text-xs text-secondary font-medium font-sans">h</span>
                </div>

                <span className="text-secondary/60 font-bold">:</span>

                {/* Minutes Field */}
                <div className="flex items-center gap-1 bg-surface-lowest border border-outline-variant px-2.5 py-1 rounded-md shadow-xs">
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={customMinutes}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                      applyCustomDuration(customHours, val, customSeconds);
                    }}
                    className="w-8 text-center text-sm font-semibold font-serif bg-transparent text-on-surface focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none no-spinners"
                    aria-label="Custom focus duration minutes"
                  />
                  <span className="text-xs text-secondary font-medium font-sans">m</span>
                </div>

                <span className="text-secondary/60 font-bold">:</span>

                {/* Seconds Field */}
                <div className="flex items-center gap-1 bg-surface-lowest border border-outline-variant px-2.5 py-1 rounded-md shadow-xs">
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={customSeconds}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                      applyCustomDuration(customHours, customMinutes, val);
                    }}
                    className="w-8 text-center text-sm font-semibold font-serif bg-transparent text-on-surface focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none no-spinners"
                    aria-label="Custom focus duration seconds"
                  />
                  <span className="text-xs text-secondary font-medium font-sans">s</span>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1 border-l border-outline-subtle pl-3">
                {[
                  { label: '10m', h: 0, m: 10, s: 0 },
                  { label: '25m', h: 0, m: 25, s: 0 },
                  { label: '45m', h: 0, m: 45, s: 0 },
                  { label: '1h', h: 1, m: 0, s: 0 },
                  { label: '1h 30m', h: 1, m: 30, s: 0 }
                ].map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => applyCustomDuration(p.h, p.m, p.s)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                      customHours === p.h && customMinutes === p.m && customSeconds === p.s
                        ? 'bg-primary-container text-on-primary-container font-semibold'
                        : 'text-secondary hover:text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Timer Clock Dial */}
          <FocusTimerClock />

          {/* Primary Timer Controls */}
          <div className="flex items-center gap-4 pt-2">
            <button
              type="button"
              onClick={toggleTimer}
              aria-label={isRunning ? 'Pause focus timer' : 'Start focus timer'}
              className="flex items-center gap-2 px-8 py-3.5 bg-primary-container text-on-primary-container hover:bg-primary rounded-full text-base font-semibold shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5" aria-hidden="true" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" aria-hidden="true" />
                  <span>Start Focus</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={resetTimer}
              aria-label="Reset timer to beginning"
              className="p-3.5 rounded-full bg-surface-low border border-outline-variant text-secondary hover:text-on-surface hover:bg-surface-container transition-colors shadow-xs cursor-pointer"
              title="Reset timer"
            >
              <RotateCcw className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Right Companion Column (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Target Task & Active Subtasks Card */}
          <div className="bg-surface-lowest border border-outline-variant rounded-xl p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-outline-subtle pb-2.5">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" aria-hidden="true" />
                <h3 className="font-serif text-sm font-semibold text-on-surface">Target Task</h3>
              </div>
              {selectedTask && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-surface-low text-secondary border border-outline-subtle">
                  {selectedTask.category}
                </span>
              )}
            </div>

            {/* Task Selector */}
            <Select
              value={selectedTaskId || ''}
              onChange={(val) => setSelectedTaskId(val || null)}
              options={taskOptions}
              placeholder="Select task to focus on..."
              ariaLabel="Select task to focus on"
            />

            {/* Selected Task Details & Subtasks Checklist */}
            {selectedTask ? (
              <div className="space-y-3 pt-1">
                <div className="p-3 bg-surface-low rounded-lg border border-outline-subtle space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-serif text-sm font-semibold text-on-surface">{selectedTask.title}</h4>
                    <button
                      type="button"
                      onClick={() => toggleTask(selectedTask.id)}
                      className="text-[11px] font-semibold text-primary hover:underline flex-shrink-0 cursor-pointer"
                    >
                      Mark Complete
                    </button>
                  </div>
                  {selectedTask.description && (
                    <p className="text-xs text-secondary line-clamp-2">{selectedTask.description}</p>
                  )}
                </div>

                {/* Interactive Subtasks list if any */}
                {selectedTask.subtasks && selectedTask.subtasks.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-secondary block font-sans">
                      Checklist ({selectedTask.subtasks.filter((s) => s.completed).length}/{selectedTask.subtasks.length})
                    </span>
                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                      {selectedTask.subtasks.map((sub) => (
                        <label
                          key={sub.id}
                          className="flex items-center gap-2 text-xs p-1.5 rounded hover:bg-surface-low cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={sub.completed}
                            onChange={() => toggleSubtask(selectedTask.id, sub.id)}
                            className="rounded border-outline-variant text-primary focus:ring-primary/20 cursor-pointer"
                          />
                          <span className={sub.completed ? 'line-through text-secondary' : 'text-on-surface'}>
                            {sub.title}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-secondary font-sans leading-relaxed">
                No task selected. Pick a task above or run an open focus block.
              </p>
            )}
          </div>

          {/* Ambient Soundscapes Card */}
          <div className="bg-surface-lowest border border-outline-variant rounded-xl p-5 shadow-card space-y-3.5">
            <div className="flex items-center gap-2 border-b border-outline-subtle pb-2.5">
              <Headphones className="w-4 h-4 text-tertiary" aria-hidden="true" />
              <h3 className="font-serif text-sm font-semibold text-on-surface">Soundscapes</h3>
            </div>

            {/* Ambient Sound Buttons Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5" role="group" aria-label="Ambient soundscapes">
              {[
                { id: 'none', label: 'Off' },
                { id: 'rain', label: 'Rain' },
                { id: 'forest', label: 'Forest' },
                { id: 'ocean', label: 'Ocean' },
                { id: 'cafe', label: 'Café' },
                { id: 'drone', label: 'Drone' },
                { id: 'noise', label: 'Pink' }
              ].map((snd) => (
                <button
                  key={snd.id}
                  type="button"
                  aria-pressed={ambientType === snd.id}
                  onClick={() => setAmbientType(snd.id as AmbientType)}
                  className={`min-h-[44px] py-2 px-1 rounded-md text-xs font-medium transition-all text-center truncate cursor-pointer flex items-center justify-center ${
                    ambientType === snd.id
                      ? 'bg-primary-container text-on-primary-container font-semibold shadow-xs'
                      : 'bg-surface-low text-secondary hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {snd.label}
                </button>
              ))}
            </div>
          </div>

          {/* Daily Focus Summary Card */}
          <div className="bg-surface-lowest border border-outline-variant rounded-xl p-5 shadow-card space-y-3">
            <div className="flex items-center gap-2 border-b border-outline-subtle pb-2.5">
              <Sparkles className="w-4 h-4 text-tertiary" aria-hidden="true" />
              <h3 className="font-serif text-sm font-semibold text-on-surface">Today's Focus Summary</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 font-sans">
              <div className="p-3 bg-surface-low rounded-lg border border-outline-subtle">
                <span className="text-[10px] uppercase font-bold tracking-wider text-secondary block">
                  Focus Time
                </span>
                <span className="font-serif text-xl font-bold text-on-surface">
                  {totalFocusMinsToday >= 60
                    ? `${Math.floor(totalFocusMinsToday / 60)}h ${totalFocusMinsToday % 60}m`
                    : `${totalFocusMinsToday}m`}
                </span>
              </div>
              <div className="p-3 bg-surface-low rounded-lg border border-outline-subtle">
                <span className="text-[10px] uppercase font-bold tracking-wider text-secondary block">
                  Completed
                </span>
                <span className="font-serif text-xl font-bold text-primary">
                  {todaySessions.length} {todaySessions.length === 1 ? 'interval' : 'intervals'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
