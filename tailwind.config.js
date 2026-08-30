/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: 'var(--color-surface)',
          dim: 'var(--color-surface-dim)',
          bright: 'var(--color-surface-bright)',
          lowest: 'var(--color-surface-container-lowest)',
          low: 'var(--color-surface-container-low)',
          container: 'var(--color-surface-container)',
          high: 'var(--color-surface-container-high)',
          highest: 'var(--color-surface-container-highest)',
        },
        'on-surface': {
          DEFAULT: 'var(--color-on-surface)',
          variant: 'var(--color-on-surface-variant)',
        },
        primary: {
          DEFAULT: 'var(--color-primary)',
          container: 'var(--color-primary-container)',
          'on-container': 'var(--color-on-primary-container)',
          hover: 'var(--color-primary-hover)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          container: 'var(--color-secondary-container)',
          'on-container': 'var(--color-on-secondary-container)',
        },
        tertiary: {
          DEFAULT: 'var(--color-tertiary)',
          dark: 'var(--color-tertiary-dark)',
          container: 'var(--color-tertiary-container)',
          'on-container': 'var(--color-on-tertiary-container)',
        },
        outline: {
          DEFAULT: 'var(--color-outline)',
          variant: 'var(--color-outline-variant)',
          subtle: 'var(--color-outline-subtle)',
        },
        error: {
          DEFAULT: 'var(--color-error)',
          container: 'var(--color-error-container)',
        }
      },
      fontFamily: {
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['"Hanken Grotesk"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        ambient: 'var(--shadow-ambient)',
        'ambient-hover': 'var(--shadow-ambient-hover)',
        card: 'var(--shadow-card)',
        modal: 'var(--shadow-modal)',
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      maxWidth: {
        container: 'var(--container-max-width)',
      },
      animation: {
        'pulse-halo': 'pulseHalo 4s infinite cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in': 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        pulseHalo: {
          '0%': { boxShadow: '0 0 0 0 rgba(120, 113, 108, 0.12)' },
          '50%': { boxShadow: '0 0 0 35px rgba(120, 113, 108, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(120, 113, 108, 0)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      }
    },
  },
  plugins: [],
}
