import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  badge?: string;
  icon?: React.ReactNode;
}

interface SelectProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  label?: string;
  id?: string;
  ariaLabel?: string;
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  disabled?: boolean;
}

export function Select<T extends string = string>({
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  label,
  id: customId,
  ariaLabel,
  className = '',
  buttonClassName = '',
  dropdownClassName = '',
  disabled = false
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listboxRef = useRef<HTMLUListElement | null>(null);
  const generatedId = useId();
  const selectId = customId || generatedId;

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click
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

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0 && highlightedIndex < options.length) {
          onChange(options[highlightedIndex].value);
          setIsOpen(false);
        } else {
          setIsOpen(!isOpen);
          const currentIndex = options.findIndex((opt) => opt.value === value);
          setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          const currentIndex = options.findIndex((opt) => opt.value === value);
          setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
        } else {
          setHighlightedIndex((prev) => (prev + 1 < options.length ? prev + 1 : 0));
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          const currentIndex = options.findIndex((opt) => opt.value === value);
          setHighlightedIndex(currentIndex >= 0 ? currentIndex : options.length - 1);
        } else {
          setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : options.length - 1));
        }
        break;

      case 'Escape':
        if (isOpen) {
          e.preventDefault();
          setIsOpen(false);
        }
        break;

      case 'Tab':
        if (isOpen) {
          setIsOpen(false);
        }
        break;
    }
  };

  const handleSelect = (val: T) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5 font-sans"
        >
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        id={selectId}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={`${selectId}-listbox`}
        aria-activedescendant={isOpen && highlightedIndex >= 0 ? `${selectId}-option-${highlightedIndex}` : undefined}
        aria-label={ariaLabel || label || placeholder}
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            const currentIndex = options.findIndex((opt) => opt.value === value);
            setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
          }
        }}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 bg-surface-lowest border rounded-md text-xs font-medium text-on-surface transition-all focus:outline-none focus:ring-2 focus:ring-primary-container/30 ${
          isOpen
            ? 'border-primary-container ring-2 ring-primary-container/20 shadow-sm'
            : 'border-outline-variant hover:border-outline shadow-card'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon && (
            <span className="text-secondary flex-shrink-0">{selectedOption.icon}</span>
          )}
          <span className={selectedOption ? 'text-on-surface' : 'text-secondary'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-low text-secondary border border-outline-subtle">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-secondary flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-on-surface' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <ul
          id={`${selectId}-listbox`}
          ref={listboxRef}
          role="listbox"
          tabIndex={-1}
          aria-label={ariaLabel || label || placeholder}
          className={`absolute left-0 right-0 top-full mt-1.5 z-50 max-h-60 overflow-y-auto bg-surface-lowest border border-outline-variant rounded-md py-1 shadow-dropdown animate-dropdown-in ${dropdownClassName}`}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isHighlighted = index === highlightedIndex;

            return (
              <li
                key={option.value}
                id={`${selectId}-option-${index}`}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option.value)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`flex items-center justify-between px-3.5 py-2 text-xs cursor-pointer select-none transition-colors ${
                  isSelected
                    ? 'bg-surface-low text-on-surface font-semibold'
                    : isHighlighted
                    ? 'bg-surface-container text-on-surface'
                    : 'text-on-surface hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {option.icon && (
                    <span className="text-secondary flex-shrink-0">{option.icon}</span>
                  )}
                  <span className="truncate">{option.label}</span>
                  {option.badge && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface text-secondary border border-outline-subtle">
                      {option.badge}
                    </span>
                  )}
                </div>

                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-tertiary flex-shrink-0 ml-2" aria-hidden="true" />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
