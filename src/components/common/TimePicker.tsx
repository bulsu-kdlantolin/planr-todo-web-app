import React, { useState, useRef, useEffect } from 'react';
import { Clock, ChevronUp, ChevronDown } from 'lucide-react';
import { formatTimeDisplay } from '../../utils/date';
import { TimeFormat } from '../../types';

interface TimePickerProps {
  value: string; // HH:MM in 24h format e.g. "14:30"
  onChange: (value: string) => void;
  timeFormat?: TimeFormat;
  label?: string;
  id?: string;
  className?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  value = '09:00',
  onChange,
  timeFormat = '12h',
  label,
  id = 'time-picker',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [hoursStr, minsStr] = (value || '09:00').split(':');
  let currentHours = parseInt(hoursStr, 10);
  if (isNaN(currentHours)) currentHours = 9;
  let currentMins = parseInt(minsStr, 10);
  if (isNaN(currentMins)) currentMins = 0;

  // 12-hour display logic
  const isPM = currentHours >= 12;
  const display12Hours = currentHours % 12 === 0 ? 12 : currentHours % 12;

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const updateTime = (h: number, m: number) => {
    const safeH = Math.max(0, Math.min(23, h));
    const safeM = Math.max(0, Math.min(59, m));
    const hh = String(safeH).padStart(2, '0');
    const mm = String(safeM).padStart(2, '0');
    onChange(`${hh}:${mm}`);
  };

  const handleHourChange = (delta: number) => {
    let newH = currentHours + delta;
    if (newH > 23) newH = 0;
    if (newH < 0) newH = 23;
    updateTime(newH, currentMins);
  };

  const handleMinChange = (delta: number) => {
    let newM = currentMins + delta;
    if (newM > 55) newM = 0;
    if (newM < 0) newM = 55;
    updateTime(currentHours, newM);
  };

  const toggleAMPM = () => {
    if (isPM) {
      updateTime(currentHours - 12, currentMins);
    } else {
      updateTime(currentHours + 12, currentMins);
    }
  };

  const formattedDisplay = formatTimeDisplay(value, timeFormat);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5 font-sans"
        >
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={`Select time, currently ${formattedDisplay}`}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-surface-low border rounded-md text-xs font-medium text-on-surface transition-all focus:outline-none focus:ring-2 focus:ring-primary-container/30 ${
          isOpen
            ? 'border-primary-container ring-2 ring-primary-container/20 shadow-sm'
            : 'border-outline-variant hover:border-outline shadow-card'
        }`}
      >
        <span className="font-sans font-medium">{formattedDisplay}</span>
        <Clock className="w-4 h-4 text-secondary flex-shrink-0" aria-hidden="true" />
      </button>

      {/* Time Popover */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Select custom time"
          className="absolute left-0 top-full mt-1.5 z-50 p-4 bg-surface-lowest border border-outline-variant rounded-md shadow-dropdown animate-dropdown-in flex flex-col items-center gap-3 select-none"
        >
          <div className="flex items-center gap-3">
            {/* Hours Column */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => handleHourChange(1)}
                aria-label="Increment hour"
                className="p-1 rounded hover:bg-surface-low text-secondary hover:text-on-surface transition-colors"
              >
                <ChevronUp className="w-4 h-4" aria-hidden="true" />
              </button>
              <span
                className="font-serif text-xl font-bold py-1 px-2.5 text-on-surface"
                aria-label={`Hours: ${timeFormat === '12h' ? display12Hours : String(currentHours).padStart(2, '0')}`}
              >
                {timeFormat === '12h' ? display12Hours : String(currentHours).padStart(2, '0')}
              </span>
              <button
                type="button"
                onClick={() => handleHourChange(-1)}
                aria-label="Decrement hour"
                className="p-1 rounded hover:bg-surface-low text-secondary hover:text-on-surface transition-colors"
              >
                <ChevronDown className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <span className="font-serif text-xl font-bold text-secondary pb-1" aria-hidden="true">:</span>

            {/* Minutes Column */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => handleMinChange(5)}
                aria-label="Increment minutes"
                className="p-1 rounded hover:bg-surface-low text-secondary hover:text-on-surface transition-colors"
              >
                <ChevronUp className="w-4 h-4" aria-hidden="true" />
              </button>
              <span
                className="font-serif text-xl font-bold py-1 px-2.5 text-on-surface"
                aria-label={`Minutes: ${String(currentMins).padStart(2, '0')}`}
              >
                {String(currentMins).padStart(2, '0')}
              </span>
              <button
                type="button"
                onClick={() => handleMinChange(-5)}
                aria-label="Decrement minutes"
                className="p-1 rounded hover:bg-surface-low text-secondary hover:text-on-surface transition-colors"
              >
                <ChevronDown className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {/* AM/PM Toggle (if 12h mode) */}
            {timeFormat === '12h' && (
              <div className="flex flex-col gap-1 pl-2 border-l border-outline-subtle">
                <button
                  type="button"
                  onClick={() => isPM && toggleAMPM()}
                  aria-label="Select AM"
                  aria-pressed={!isPM}
                  className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                    !isPM
                      ? 'bg-primary-container text-on-primary-container'
                      : 'text-secondary hover:bg-surface-low'
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => !isPM && toggleAMPM()}
                  aria-label="Select PM"
                  aria-pressed={isPM}
                  className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                    isPM
                      ? 'bg-primary-container text-on-primary-container'
                      : 'text-secondary hover:bg-surface-low'
                  }`}
                >
                  PM
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-full py-1 text-xs font-semibold uppercase tracking-wider bg-surface-low hover:bg-surface-container text-on-surface rounded border border-outline-subtle transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
};
