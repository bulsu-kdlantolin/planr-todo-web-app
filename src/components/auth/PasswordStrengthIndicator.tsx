import React, { useMemo } from 'react';
import { calculatePasswordStrength } from '../../utils/passwordStrength';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password
}) => {
  const strength = useMemo(() => calculatePasswordStrength(password), [password]);

  if (!password) {
    return null;
  }

  return (
    <div
      className="space-y-3 mt-3 animate-fade-in font-sans"
      role="status"
      aria-live="polite"
      aria-label={`Password strength: ${strength.label}`}
    >
      {/* Continuous Progress Bar (matching screenshot) */}
      <div className="w-full bg-slate-200 dark:bg-surface-container h-1.5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${strength.barColorClass}`}
          style={{ width: `${strength.percentage}%` }}
        />
      </div>

      {/* Headline (e.g., "Medium password. Must contain:" or "Strong password.") */}
      <p className="text-xs sm:text-sm font-semibold text-on-surface tracking-tight">
        {strength.headline}
      </p>

      {/* Vertical Requirements Checklist */}
      <ul className="space-y-1.5 text-xs">
        {strength.requirements.map((req) => (
          <li
            key={req.id}
            className={`flex items-center gap-2 transition-colors duration-150 ${
              req.met
                ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                : 'text-secondary/70 dark:text-secondary/60'
            }`}
          >
            {req.met ? (
              <Check
                className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0"
                strokeWidth={2.5}
                aria-hidden="true"
              />
            ) : (
              <X
                className="w-3.5 h-3.5 text-secondary/50 dark:text-secondary/40 flex-shrink-0"
                strokeWidth={2}
                aria-hidden="true"
              />
            )}
            <span>{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
