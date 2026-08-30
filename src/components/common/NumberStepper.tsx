import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface NumberStepperProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  unitLabel?: string;
  className?: string;
}

export const NumberStepper: React.FC<NumberStepperProps> = ({
  value,
  onChange,
  min = 1,
  max = 12,
  step = 1,
  label,
  unitLabel = 'blocks',
  className = ''
}) => {
  const handleDecrement = () => {
    if (value - step >= min) {
      onChange(value - step);
    }
  };

  const handleIncrement = () => {
    if (value + step <= max) {
      onChange(value + step);
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5 font-sans">
          {label}
        </label>
      )}

      <div className="flex items-center justify-between bg-surface-low border border-outline-variant rounded-lg p-1 shadow-xs">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          aria-label="Decrease value"
          className="w-8 h-8 rounded-md bg-surface-lowest hover:bg-surface-container border border-outline-subtle flex items-center justify-center text-on-surface disabled:opacity-40 transition-colors active:scale-95"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <div className="text-center px-2">
          <span className="font-serif text-sm font-bold text-on-surface mr-1">{value}</span>
          <span className="text-[11px] text-secondary font-sans">{unitLabel}</span>
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          aria-label="Increase value"
          className="w-8 h-8 rounded-md bg-surface-lowest hover:bg-surface-container border border-outline-subtle flex items-center justify-center text-on-surface disabled:opacity-40 transition-colors active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default NumberStepper;
