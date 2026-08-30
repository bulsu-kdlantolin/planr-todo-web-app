import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getTodayDateString, formatDateLong } from '../../utils/date';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Select date...',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const initialDate = value ? new Date(value + 'T00:00:00') : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth()); // 0-indexed

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const todayStr = getTodayDateString();

  // Generate calendar days for viewMonth & viewYear
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
  const adjustedFirstDay = (firstDayOfMonth + 6) % 7; // Monday = 0
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  const calendarDays: Array<{
    day: number;
    monthOffset: number; // -1 = prev, 0 = current, 1 = next
    dateString: string;
  }> = [];

  // Previous month padding
  for (let i = adjustedFirstDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const m = viewMonth === 0 ? 11 : viewMonth - 1;
    const y = viewMonth === 0 ? viewYear - 1 : viewYear;
    const dateString = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ day: d, monthOffset: -1, dateString });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateString = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ day: d, monthOffset: 0, dateString });
  }

  // Next month padding to fill 35 or 42 grid slots
  const remaining = (7 - (calendarDays.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const m = viewMonth === 11 ? 0 : viewMonth + 1;
    const y = viewMonth === 11 ? viewYear + 1 : viewYear;
    const dateString = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ day: d, monthOffset: 1, dateString });
  }

  const handleSelectDate = (dateStr: string) => {
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  const handleSetQuickDate = (offsetDays: number) => {
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    const dateStr = target.toISOString().split('T')[0];
    onChange(dateStr);
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5 font-sans">
          {label}
        </label>
      )}

      {/* Trigger Wrapper */}
      <div className="w-full flex items-center justify-between px-3.5 py-2.5 bg-surface-low hover:bg-surface-container/60 border border-outline-variant rounded-lg text-xs text-left text-on-surface focus-within:border-primary-container focus-within:ring-2 focus-within:ring-primary-container/20 transition-all shadow-xs">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 flex items-center gap-2.5 min-w-0 text-left focus:outline-none"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
        >
          <Calendar className="w-4 h-4 text-tertiary flex-shrink-0" aria-hidden="true" />
          <span className={`truncate ${value ? 'font-medium text-on-surface' : 'text-secondary/70'}`}>
            {value ? formatDateLong(value) : placeholder}
          </span>
        </button>

        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-secondary hover:text-on-surface rounded hover:bg-surface transition-colors ml-1"
            title="Clear date"
            aria-label="Clear date"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Custom Calendar Popover */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-72 bg-surface-lowest border border-outline-variant rounded-xl shadow-modal p-3.5 space-y-3 animate-fade-in">
          {/* Month / Year Navigator */}
          <div className="flex items-center justify-between pb-2 border-b border-outline-subtle">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded hover:bg-surface-low text-secondary hover:text-on-surface transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-serif text-sm font-semibold text-on-surface">
              {monthNames[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded hover:bg-surface-low text-secondary hover:text-on-surface transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-secondary uppercase tracking-wider font-sans">
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
            <span>Su</span>
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {calendarDays.map((item, idx) => {
              const isSelected = value === item.dateString;
              const isToday = todayStr === item.dateString;
              const isCurrentMonth = item.monthOffset === 0;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDate(item.dateString)}
                  className={`h-8 w-8 mx-auto rounded-lg flex items-center justify-center text-xs transition-all ${
                    isSelected
                      ? 'bg-primary-container text-on-primary-container font-bold shadow-xs'
                      : isToday
                      ? 'bg-surface-container text-primary font-semibold border border-primary-container/40'
                      : isCurrentMonth
                      ? 'text-on-surface hover:bg-surface-low font-normal'
                      : 'text-secondary/40 hover:bg-surface-low/50'
                  }`}
                >
                  {item.day}
                </button>
              );
            })}
          </div>

          {/* Quick Action Shortcuts */}
          <div className="pt-2 border-t border-outline-subtle flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleSetQuickDate(0)}
                className="px-2 py-1 rounded bg-surface-low hover:bg-surface-container text-secondary hover:text-on-surface font-medium transition-colors"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickDate(1)}
                className="px-2 py-1 rounded bg-surface-low hover:bg-surface-container text-secondary hover:text-on-surface font-medium transition-colors"
              >
                Tomorrow
              </button>
            </div>

            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-red-600 dark:text-red-400 hover:underline font-medium px-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
