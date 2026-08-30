import { useEffect } from 'react';
import { useUIStore } from '../store/useUIStore';
import { ViewType } from '../types';

const VALID_VIEWS: ViewType[] = [
  'landing',
  'signin',
  'signup',
  'onboarding',
  'daily',
  'tasks',
  'reminders',
  'focus',
  'settings'
];

/**
 * Hook to manage URL hash-based navigation with route validation and fallback.
 */
export function useHashRouter() {
  const activeView = useUIStore((state) => state.activeView);
  const setActiveView = useUIStore((state) => state.setActiveView);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as ViewType;
      if (VALID_VIEWS.includes(hash)) {
        setActiveView(hash);
      } else if (window.location.hash === '' || window.location.hash === '#') {
        // Keep current view or default to landing
        if (!VALID_VIEWS.includes(activeView)) {
          setActiveView('landing');
        }
      } else {
        // Fallback for unrecognized route
        setActiveView('daily');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [setActiveView, activeView]);

  return { activeView, setActiveView };
}
