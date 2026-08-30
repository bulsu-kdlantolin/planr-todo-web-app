import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  className?: string;
  wordmarkClassName?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showWordmark = true,
  className = '',
  wordmarkClassName = ''
}) => {
  const sizeMap = {
    sm: { icon: 22, wordmark: 'text-base', container: 'gap-2' },
    md: { icon: 30, wordmark: 'text-xl', container: 'gap-2.5' },
    lg: { icon: 40, wordmark: 'text-2xl', container: 'gap-3' },
    xl: { icon: 56, wordmark: 'text-4xl', container: 'gap-3.5' }
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const iconPx = currentSize.icon;

  return (
    <div className={`inline-flex items-center select-none ${currentSize.container} ${className}`}>
      {/* Pure Raw Planr Focus Monogram (No container card) */}
      <svg
        width={iconPx}
        height={iconPx}
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 transition-transform duration-300 hover:scale-105"
        aria-hidden="true"
      >
        {/* Architectural Stem for 'P' */}
        <line
          x1="6"
          y1="4"
          x2="6"
          y2="24"
          stroke="var(--color-primary-container)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />

        {/* Precision Focus Arc / Loop */}
        <path
          d="M 6 4 H 16 C 20.8 4 24 7.6 24 12.5 C 24 17.4 20.8 21 16 21 H 6"
          stroke="var(--color-primary-container)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Center Focal Grounding Lens (Olive Sage) */}
        <circle
          cx="15"
          cy="12.5"
          r="3"
          fill="var(--color-tertiary)"
        />
      </svg>

      {/* Elegant Wordmark */}
      {showWordmark && (
        <span
          className={`font-serif font-semibold tracking-tight text-on-surface leading-none ${currentSize.wordmark} ${wordmarkClassName}`}
        >
          planr
        </span>
      )}
    </div>
  );
};

export default Logo;
