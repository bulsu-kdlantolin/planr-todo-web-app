/**
 * Triggers subtle device haptic vibration if supported (e.g. on mobile/tablets).
 */
export function triggerHapticFeedback(): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate([35, 25, 35]);
    } catch {}
  }
}

/**
 * Standard dynamic CSS class helper for invalid input fields
 */
export function getFieldValidationClass(hasError: boolean): string {
  return hasError
    ? '!border-red-500 !ring-2 !ring-red-500/25 animate-shake'
    : 'border-outline-variant focus:border-primary-container focus:ring-2 focus:ring-primary-container/20';
}
