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
  'settings',
  'reset-password'
];

/**
 * Hook to manage URL hash-based navigation with route validation,
 * OAuth callback detection, and password reset handling.
 */
export function useHashRouter() {
  const activeView = useUIStore((state) => state.activeView);
  const setActiveView = useUIStore((state) => state.setActiveView);

  useEffect(() => {
    const handleHashChange = () => {
      const rawHash = window.location.hash;
      const cleanHash = rawHash.replace('#', '') as ViewType;

      // Detect Supabase Password Recovery fragment
      if (rawHash.includes('type=recovery') || cleanHash === 'reset-password') {
        setActiveView('reset-password');
        return;
      }

      // Detect Supabase OAuth Token Callback fragment (e.g. #access_token=...&refresh_token=...)
      if (rawHash.includes('access_token=') || rawHash.includes('error_description=')) {
        // Let Supabase Auth client ingest the tokens; default to daily workspace
        setActiveView('daily');
        return;
      }

      if (cleanHash.startsWith('landing')) {
        setActiveView('landing');
        return;
      }

      if (VALID_VIEWS.includes(cleanHash)) {
        setActiveView(cleanHash);
      } else if (rawHash === '' || rawHash === '#') {
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
