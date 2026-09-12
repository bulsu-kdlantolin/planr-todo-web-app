import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled]):not([aria-hidden="true"])',
  'textarea:not([disabled]):not([aria-hidden="true"])',
  'input:not([disabled]):not([aria-hidden="true"])',
  'select:not([disabled]):not([aria-hidden="true"])',
  '[tabindex]:not([tabindex="-1"]):not([aria-hidden="true"])'
].join(', ');

const isElementVisible = (el: HTMLElement): boolean => {
  if (el.getAttribute('aria-hidden') === 'true') return false;
  if (el.style.display === 'none' || el.style.visibility === 'hidden') return false;
  if (el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0) return true;
  if (typeof window !== 'undefined' && window.getComputedStyle) {
    try {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    } catch {
      return true;
    }
  }
  return true;
};

export interface UseFocusTrapOptions {
  isActive: boolean;
  onEscape?: () => void;
  initialFocusSelector?: string;
  restoreFocus?: boolean;
}

export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  { isActive, onEscape, initialFocusSelector, restoreFocus = true }: UseFocusTrapOptions
) {
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  useEffect(() => {
    if (!isActive) return;

    // Cache previously focused element before modal opened
    previousActiveElementRef.current = document.activeElement as HTMLElement | null;

    // Set initial focus
    const timer = setTimeout(() => {
      if (!containerRef.current) return;

      if (initialFocusSelector) {
        const customEl = containerRef.current.querySelector<HTMLElement>(initialFocusSelector);
        if (customEl && isElementVisible(customEl)) {
          customEl.focus();
          return;
        }
      }

      // Default: focus first interactive element, prioritizing inputs
      const firstInput = containerRef.current.querySelector<HTMLElement>(
        'input:not([disabled]):not([type="hidden"]), textarea:not([disabled])'
      );
      if (firstInput && isElementVisible(firstInput)) {
        firstInput.focus();
        return;
      }

      const focusableElements = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter(isElementVisible);

      if (focusableElements.length > 0) {
        // Avoid focusing close button immediately if another action exists
        const nonCloseBtn = focusableElements.find(
          (el) => !el.getAttribute('aria-label')?.toLowerCase().includes('close')
        );
        (nonCloseBtn || focusableElements[0]).focus();
      } else {
        // If no focusable children, focus container if it has tabindex
        containerRef.current.focus();
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current) return;

      if (e.key === 'Escape') {
        if (onEscapeRef.current) {
          e.preventDefault();
          onEscapeRef.current();
        }
        return;
      }

      if (e.key === 'Tab') {
        const focusable = Array.from(
          containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        ).filter(isElementVisible);

        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || !containerRef.current.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !containerRef.current.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);

      if (restoreFocus && previousActiveElementRef.current) {
        // Small delay to ensure modal has unmounted from DOM
        setTimeout(() => {
          previousActiveElementRef.current?.focus();
        }, 10);
      }
    };
  }, [isActive, initialFocusSelector, restoreFocus, containerRef]);
}
