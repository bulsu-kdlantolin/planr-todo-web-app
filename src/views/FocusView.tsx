import React, { useState, useEffect, useMemo } from 'react';
import { useTimerStore, AmbientType } from '../store/useTimerStore';
import { useTaskStore } from '../store/useTaskStore';
import { useUIStore } from '../store/useUIStore';
import { FocusTimerClock } from '../components/focus/FocusTimerClock';
import { Logo } from '../components/common/Logo';
import { Select, SelectOption } from '../components/common/Select';
import { audioManager } from '../utils/audio';
import {
  Play,
  Pause,
  RotateCcw,
  Headphones,
  Maximize2,
  Minimize2,
  Wind,
  Target,
  CheckCircle2,
  Flame,
  Clock,
  Sparkles,
  ListTodo
} from 'lucide-react';

export const FocusView: React.FC = () => {
  const currentPreset = useTimerStore((state) => state.currentPreset);
  const isRunning = useTimerStore((state) => state.isRunning);
  const selectedTaskId = useTimerStore((state) => state.selectedTaskId);
  const ambientType = useTimerStore((state) => state.ambientType);
  const focusSessions = useTimerStore((state) => state.focusSessions);

  const setPreset = useTimerStore((state) => state.setPreset);
  const setSelectedTaskId = useTimerStore((state) => state.setSelectedTaskId);
  const setAmbientType = useTimerStore((state) => state.setAmbientType);
  const toggleTimer = useTimerStore((state) => state.toggleTimer);
  const resetTimer = useTimerStore((state) => state.resetTimer);

  const fullScreenMode = useUIStore((state) => state.fullScreenMode);
  const toggleFullScreenMode = useUIStore((state) => state.toggleFullScreenMode);

  const [showBreathingGuide, setShowBreathingGuide] = useState(false);
  const [solfeggioFreq, setSolfeggioFreq] = useState<432 | 528 | 639>(528);

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

  const handleFreqChange = (freq: 432 | 528 | 639) => {
    setSolfeggioFreq(freq);
    audioManager.setSolfeggioFreq(freq);
    if (ambientType === 'drone') {
      audioManager.startAmbient('drone');
    }
  };

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

  // If in Zen Full Screen mode, render immersive centered distraction-free view
  if (fullScreenMode) {
    return (
      <div className="max-w-3xl mx-auto min-h-[85vh] flex flex-col items-center justify-center text-center space-y-8 animate-fade-in px-6 py-10">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-lowest border border-outline-subtle text-xs font-semibold text-primary shadow-sm">
            <Logo size="sm" showWordmark={false} />
            <span>Zen Focus</span>
          </div>

          <button
            type="button"
            onClick={toggleFullScreenMode}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-low hover:bg-surface-container border border-outline-subtle text-xs font-medium text-secondary hover:text-on-surface transition-colors cursor-pointer"
            title="Exit Full Screen Mode (F)"
          >
            <Minimize2 className="w-3.5 h-3.5 text-tertiary" aria-hidden="true" />
            <span>Exit Zen Mode (F)</span>
          </button>
        </div>

        {/* Selected Task Highlight if any */}
        {selectedTask && (
          <div className="px-4 py-1.5 rounded-full bg-surface-lowest border border-outline-variant text-xs text-on-surface font-medium shadow-xs">
            Target: <span className="font-serif font-semibold">{selectedTask.title}</span>
          </div>
        )}

        {/* Presets */}
        <div className="flex flex-wrap items-center justify-center gap-2" role="group" aria-label="Timer presets">
          <button
            type="button"
            onClick={() => setPreset('pomodoro', 25)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
              currentPreset === 'pomodoro'
                ? 'bg-surface-lowest text-on-surface border border-outline-variant font-semibold shadow-sm'
                : 'text-secondary hover:text-on-surface hover:bg-surface-low'
            }`}
          >
            25 Minutes
          </button>
          <button
            type="button"
            onClick={() => setPreset('deep', 50)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
              currentPreset === 'deep'
                ? 'bg-surface-lowest text-on-surface border border-outline-variant font-semibold shadow-sm'
                : 'text-secondary hover:text-on-surface hover:bg-surface-low'
            }`}
          >
            50 Minutes
          </button>
          <button
            type="button"
            onClick={() => setPreset('short', 5)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
              currentPreset === 'short'
                ? 'bg-surface-lowest text-on-surface border border-outline-variant font-semibold shadow-sm'
                : 'text-secondary hover:text-on-surface hover:bg-surface-low'
            }`}
          >
            5 Min Break
          </button>
          <button
            type="button"
            onClick={() => setPreset('long', 15)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
              currentPreset === 'long'
                ? 'bg-surface-lowest text-on-surface border border-outline-variant font-semibold shadow-sm'
                : 'text-secondary hover:text-on-surface hover:bg-surface-low'
            }`}
          >
            15 Min Break
          </button>
        </div>

        {/* Clock Dial */}
        <FocusTimerClock showBreathingGuide={showBreathingGuide} />

        {/* Controls */}
        <div className="flex items-center gap-4">
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
                <span>Start</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={resetTimer}
            aria-label="Reset timer to beginning"
            className="p-3.5 rounded-full bg-surface-lowest border border-outline-variant text-secondary hover:text-on-surface hover:bg-surface-low transition-colors shadow-sm cursor-pointer"
            title="Reset timer"
          >
            <RotateCcw className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  // Standard Balanced 2-Column Dashboard View (Same max-w-5xl width as Daily Overview & Tasks)
  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-fade-in space-y-7">
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

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowBreathingGuide(!showBreathingGuide)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
              showBreathingGuide
                ? 'bg-tertiary-container text-on-tertiary-container border-tertiary'
                : 'bg-surface-low hover:bg-surface-container border-outline-subtle text-secondary'
            }`}
            title="Box breathing guide"
          >
            <Wind className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Breathing Guide</span>
          </button>

          <button
            type="button"
            onClick={toggleFullScreenMode}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-surface-low hover:bg-surface-container border border-outline-subtle text-xs font-medium text-secondary hover:text-on-surface transition-colors cursor-pointer"
            title="Toggle Zen Full Screen Mode (Shortcut: F)"
          >
            <Maximize2 className="w-3.5 h-3.5 text-tertiary" aria-hidden="true" />
            <span>Zen Mode (F)</span>
          </button>
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
              onClick={() => setPreset('pomodoro', 25)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                currentPreset === 'pomodoro'
                  ? 'bg-surface-container text-on-surface border border-outline-variant font-semibold shadow-xs'
                  : 'text-secondary hover:text-on-surface hover:bg-surface-low'
              }`}
            >
              25 Minutes
            </button>
            <button
              type="button"
              onClick={() => setPreset('deep', 50)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                currentPreset === 'deep'
                  ? 'bg-surface-container text-on-surface border border-outline-variant font-semibold shadow-xs'
                  : 'text-secondary hover:text-on-surface hover:bg-surface-low'
              }`}
            >
              50 Minutes
            </button>
            <button
              type="button"
              onClick={() => setPreset('short', 5)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                currentPreset === 'short'
                  ? 'bg-surface-container text-on-surface border border-outline-variant font-semibold shadow-xs'
                  : 'text-secondary hover:text-on-surface hover:bg-surface-low'
              }`}
            >
              5 Min Break
            </button>
            <button
              type="button"
              onClick={() => setPreset('long', 15)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                currentPreset === 'long'
                  ? 'bg-surface-container text-on-surface border border-outline-variant font-semibold shadow-xs'
                  : 'text-secondary hover:text-on-surface hover:bg-surface-low'
              }`}
            >
              15 Min Break
            </button>
          </div>

          {/* Concentric Breathing Timer Clock */}
          <FocusTimerClock showBreathingGuide={showBreathingGuide} />

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

          {/* Ambient Soundscapes & Resonant Frequencies Card */}
          <div className="bg-surface-lowest border border-outline-variant rounded-xl p-5 shadow-card space-y-3.5">
            <div className="flex items-center justify-between border-b border-outline-subtle pb-2.5">
              <div className="flex items-center gap-2">
                <Headphones className="w-4 h-4 text-tertiary" aria-hidden="true" />
                <h3 className="font-serif text-sm font-semibold text-on-surface">Soundscapes</h3>
              </div>

              {/* Solfeggio Tuning Selector with Detailed Tooltips */}
              <div className="flex items-center gap-1 text-[11px]" role="group" aria-label="Solfeggio frequency tuning">
                <span className="text-secondary font-medium mr-1 font-sans">Tone:</span>
                {[
                  { freq: 432, label: '432Hz', desc: '432Hz — Deep Calm & Grounding' },
                  { freq: 528, label: '528Hz', desc: '528Hz — Mental Clarity & Deep Focus' },
                  { freq: 639, label: '639Hz', desc: '639Hz — Harmonic Balance' }
                ].map(({ freq, label, desc }) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => handleFreqChange(freq as 432 | 528 | 639)}
                    className={`px-2.5 py-1 rounded transition-all cursor-pointer font-sans ${
                      solfeggioFreq === freq
                        ? 'bg-tertiary text-on-primary font-semibold shadow-xs'
                        : 'text-secondary hover:bg-surface-low hover:text-on-surface'
                    }`}
                    title={desc}
                    aria-label={desc}
                  >
                    {label}
                  </button>
                ))}
              </div>
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
                  onClick={() => setAmbientType(snd.id as AmbientType)}
                  className={`py-2 px-1 rounded-md text-xs font-medium transition-all text-center truncate cursor-pointer ${
                    ambientType === snd.id
                      ? 'bg-primary-container text-on-primary-container font-semibold shadow-xs'
                      : 'bg-surface-low text-secondary hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {snd.label}
                </button>
              ))}
            </div>

            <div className="text-[11px] text-secondary font-sans bg-surface-low rounded-lg p-2.5 flex items-center justify-between border border-outline-subtle">
              <span className="font-medium text-on-surface">
                {solfeggioFreq === 432 && '432Hz • Deep calm & grounding tone'}
                {solfeggioFreq === 528 && '528Hz • Mental clarity & sustained focus'}
                {solfeggioFreq === 639 && '639Hz • Harmonic balance & focus tone'}
              </span>
              <span className="text-[10px] font-semibold text-tertiary uppercase font-sans tracking-wider">
                Solfeggio Active
              </span>
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
