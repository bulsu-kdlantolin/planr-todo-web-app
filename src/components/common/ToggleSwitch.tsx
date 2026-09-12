import React, { useId } from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  id?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
  id: customId,
  ariaLabel,
  disabled = false
}) => {
  const autoId = useId();
  const switchId = customId || autoId;

  return (
    <div className="inline-flex items-center gap-3 min-h-[44px]">
      {label && (
        <label
          htmlFor={switchId}
          className="text-xs font-semibold uppercase tracking-wider text-secondary font-sans cursor-pointer select-none"
        >
          {label}
        </label>
      )}

      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel || label}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-container focus:ring-offset-2 ${
          checked ? 'bg-tertiary' : 'bg-[#c5bcb5] dark:bg-stone-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};
