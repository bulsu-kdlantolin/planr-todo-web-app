import React, { memo } from 'react';
import { useTimerStore } from '../../store/useTimerStore';
import { SoundwaveCanvas } from './SoundwaveCanvas';

export const FocusTimerClock: React.FC = memo(() => {
  const durationSec = useTimerStore((state) => state.durationSec);
  const remainingSec = useTimerStore((state) => state.remainingSec);
  const isRunning = useTimerStore((state) => state.isRunning);
  const ambientType = useTimerStore((state) => state.ambientType);

  const hours = Math.floor(remainingSec / 3600);
  const mins = Math.floor((remainingSec % 3600) / 60);
  const secs = remainingSec % 60;
  const timeFormatted =
    hours > 0
      ? `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // Circular progress math:
  // circumference = 2 * PI * radius
  // progressRatio = (duration - remaining) / duration
  // strokeDashoffset = circumference - (progressRatio * circumference)
  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = durationSec > 0 ? (durationSec - remainingSec) / durationSec : 0;
  const strokeDashoffset = circumference - progressRatio * circumference;

  return (
    <div className="relative my-4 flex items-center justify-center">
      {/* Organic Soundwave Visualizer Canvas */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
        <SoundwaveCanvas isPlaying={isRunning} ambientType={ambientType} />
      </div>

      <svg className="w-72 h-72 -rotate-90 transform" aria-label={`Timer: ${timeFormatted}`}>
        <circle
          cx="144"
          cy="144"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          className="text-surface-high"
          fill="transparent"
        />
        <circle
          cx="144"
          cy="144"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-tertiary transition-all duration-1000 ease-linear"
          fill="transparent"
        />
      </svg>

      {/* Center Countdown Display with Screen Reader Timer Role */}
      <div
        role="timer"
        aria-live="polite"
        aria-atomic="true"
        aria-label={`Time remaining: ${hours > 0 ? `${hours} hours, ` : ''}${mins} minutes and ${secs} seconds`}
        className="absolute flex flex-col items-center justify-center"
      >
        <span className="font-serif text-5xl sm:text-6xl font-bold tracking-tight text-on-surface select-none">
          {timeFormatted}
        </span>
        <span className="text-xs uppercase tracking-widest text-secondary font-semibold mt-2">
          {isRunning ? (
            <span className="flex items-center gap-1.5 text-tertiary">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-ping" />
              <span>Timer Active</span>
            </span>
          ) : (
            'Paused'
          )}
        </span>
      </div>

      {/* Accessible Live Region for Screen Reader Announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {remainingSec === 0
          ? 'Focus block completed! Excellent work.'
          : isRunning
          ? `Timer running. ${mins} minutes remaining.`
          : 'Timer paused.'}
      </div>
    </div>
  );
});

FocusTimerClock.displayName = 'FocusTimerClock';

export default FocusTimerClock;
