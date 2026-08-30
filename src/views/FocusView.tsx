import React, { useState, useEffect } from 'react';
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
  Wind
} from 'lucide-react';

export const FocusView: React.FC = () => {
  const currentPreset = useTimerStore((state) => state.currentPreset);
  const isRunning = useTimerStore((state) => state.isRunning);
  const selectedTaskId = useTimerStore((state) => state.selectedTaskId);
  const ambientType = useTimerStore((state) => state.ambientType);

  const setPreset = useTimerStore((state) => state.setPreset);
  const setSelectedTaskId = useTimerStore((state) => state.setSelectedTaskId);
  const setAmbientType = useTimerStore((state) => state.setAmbientType);
  const toggleTimer = useTimerStore((state) => state.toggleTimer);
  const resetTimer = useTimerStore((state) => state.resetTimer);

  const fullScreenMode = useUIStore((state) => state.fullScreenMode);
  const toggleFullScreenMode = useUIStore((state) => state.toggleFullScreenMode);

  const [showBreathingGuide, setShowBreathingGuide] = useState(false);
  const [solfeggioFreq, setSolfeggioFreq] = useState<432 | 528 | 639>(528);

  // Clean up audio buffers on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      audioManager.disposeBuffers();
    };
  }, []);

  const tasks = useTaskStore((state) => state.tasks);
  const activeTasks = tasks.filter((t) => !t.completed);

  const handleFreqChange = (freq: 432 | 528 | 639) => {
    setSolfeggioFreq(freq);
    audioManager.setSolfeggioFreq(freq);
    if (ambientType === 'drone') {
      audioManager.startAmbient('drone');
    }
  };

  // Convert tasks to options for custom Select
  const taskOptions: SelectOption[] = [
    { value: '', label: 'General Focus (No specific task)' },
    ...activeTasks.map((t) => ({
      value: t.id,
      label: t.title,
      badge: t.category
    }))
  ];

  return (
    <div
      className={`mx-auto px-6 py-10 animate-fade-in flex flex-col items-center justify-center text-center transition-all ${
        fullScreenMode ? 'max-w-4xl min-h-[90vh]' : 'max-w-2xl'
      }`}
    >
      {/* Header Badge & Full Screen Controls */}
      <div className="flex items-center gap-3 mb-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-lowest border border-outline-subtle text-xs font-semibold text-primary shadow-sm">
          <Logo size="sm" showWordmark={false} />
          <span>Focus Timer</span>
        </div>

        <button
          type="button"
          onClick={toggleFullScreenMode}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-low hover:bg-surface-container border border-outline-subtle text-xs font-medium text-secondary hover:text-on-surface transition-colors"
          title="Toggle Full Screen Mode (Shortcut: F)"
        >
          {fullScreenMode ? (
            <>
              <Minimize2 className="w-3.5 h-3.5 text-tertiary" aria-hidden="true" />
              <span>Exit Full Screen (F)</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-tertiary" aria-hidden="true" />
              <span>Full Screen (F)</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setShowBreathingGuide(!showBreathingGuide)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
            showBreathingGuide
              ? 'bg-tertiary-container text-on-tertiary-container border-tertiary'
              : 'bg-surface-low hover:bg-surface-container border-outline-subtle text-secondary'
          }`}
          title="Breathing Rhythm Guide (4-4-4 cadence)"
        >
          <Wind className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Breathe</span>
        </button>
      </div>

      {/* Timer Presets */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-6" role="group" aria-label="Timer presets">
        <button
          type="button"
          onClick={() => setPreset('pomodoro', 25)}
          className={`px-4 py-2 rounded-full text-xs font-medium transition-all focus:ring-2 focus:ring-primary-container focus:outline-none ${
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
          className={`px-4 py-2 rounded-full text-xs font-medium transition-all focus:ring-2 focus:ring-primary-container focus:outline-none ${
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
          className={`px-4 py-2 rounded-full text-xs font-medium transition-all focus:ring-2 focus:ring-primary-container focus:outline-none ${
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
          className={`px-4 py-2 rounded-full text-xs font-medium transition-all focus:ring-2 focus:ring-primary-container focus:outline-none ${
            currentPreset === 'long'
              ? 'bg-surface-lowest text-on-surface border border-outline-variant font-semibold shadow-sm'
              : 'text-secondary hover:text-on-surface hover:bg-surface-low'
          }`}
        >
          15 Min Break
        </button>
      </div>

      {/* Task Selector with Custom Accessible Animated Select Component */}
      <div className="w-full max-w-sm mb-6 text-left">
        <Select
          value={selectedTaskId || ''}
          onChange={(val) => setSelectedTaskId(val || null)}
          options={taskOptions}
          placeholder="Select task to focus on..."
          ariaLabel="Select task to focus on"
        />
      </div>

      {/* Memoized Clock Dial Component */}
      <FocusTimerClock showBreathingGuide={showBreathingGuide} />

      {/* Primary Timer Controls in Clean Lighter Sandstone */}
      <div className="flex items-center gap-4 my-6">
        <button
          type="button"
          onClick={toggleTimer}
          aria-label={isRunning ? 'Pause focus timer' : 'Start focus timer'}
          className="flex items-center gap-2 px-8 py-3.5 bg-primary-container text-on-primary-container hover:bg-primary rounded-full text-base font-semibold shadow-md transition-all active:scale-[0.98] focus:ring-2 focus:ring-primary-container focus:outline-none"
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
          className="p-3.5 rounded-full bg-surface-lowest border border-outline-variant text-secondary hover:text-on-surface hover:bg-surface-low transition-colors focus:ring-2 focus:ring-primary-container focus:outline-none shadow-sm"
          title="Reset timer"
        >
          <RotateCcw className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Ambient Sound Selection & Solfeggio Tuning */}
      <div className="w-full max-w-md bg-surface-lowest border border-outline-variant rounded-xl p-5 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
            <Headphones className="w-4 h-4 text-tertiary" aria-hidden="true" />
            <span>Ambient Sounds</span>
          </div>

          {/* Solfeggio Tuning Selector */}
          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-secondary font-medium mr-1">Pitch:</span>
            {([432, 528, 639] as const).map((freq) => (
              <button
                key={freq}
                type="button"
                onClick={() => handleFreqChange(freq)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  solfeggioFreq === freq
                    ? 'bg-tertiary text-on-primary font-semibold'
                    : 'text-secondary hover:bg-surface-low'
                }`}
                title={
                  freq === 432
                    ? '432Hz (Deep Calm)'
                    : freq === 528
                    ? '528Hz (Focus & Clarity)'
                    : '639Hz (Balance)'
                }
              >
                {freq}Hz
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5" role="group" aria-label="Ambient sound choices">
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
              className={`py-2 px-1 rounded-md text-xs font-medium transition-all text-center truncate ${
                ambientType === snd.id
                  ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                  : 'bg-surface-low text-secondary hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              {snd.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
