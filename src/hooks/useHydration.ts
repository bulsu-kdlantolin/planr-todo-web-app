import { useState, useEffect } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { useReminderStore } from '../store/useReminderStore';
import { useTimerStore } from '../store/useTimerStore';
import { useMetaStore } from '../store/useMetaStore';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { fetchUserTasks } from '../lib/supabase/tasks';
import { fetchUserReminders } from '../lib/supabase/reminders';
import { fetchUserFocusSessions } from '../lib/supabase/focus';
import { fetchUserProfile } from '../lib/supabase/profiles';
import { subscribeToUserRealtime, unsubscribeFromUserRealtime } from '../lib/supabase/realtime';
import { audioManager } from '../utils/audio';

/**
 * Hook to hydrate all Zustand stores directly from Supabase PostgreSQL database
 * and connect Supabase Realtime synchronization.
 */
export function useHydration() {
  const [isLoading, setIsLoading] = useState(true);

  const setTasks = useTaskStore((state) => state.setTasks);
  const setReminders = useReminderStore((state) => state.setReminders);
  const setFocusSessions = useTimerStore((state) => state.setFocusSessions);
  const setUser = useMetaStore((state) => state.setUser);
  const setSettings = useMetaStore((state) => state.setSettings);
  const setIntention = useMetaStore((state) => state.setIntention);

  useEffect(() => {
    let isMounted = true;

    async function hydrate() {
      if (!isSupabaseConfigured()) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();

        if (session?.user?.id) {
          const userId = session.user.id;

          const [profileData, tasks, reminders, focusSessions] = await Promise.all([
            fetchUserProfile(userId),
            fetchUserTasks(userId),
            fetchUserReminders(userId),
            fetchUserFocusSessions(userId)
          ]);

          if (isMounted) {
            if (profileData) {
              setUser({
                ...profileData.profile,
                email: session.user.email || profileData.profile.email,
                isLoggedIn: true
              });
              setSettings(profileData.settings);
              setIntention(profileData.intention);
              audioManager.setVolume(profileData.settings.soundVolume ?? 0.5);
            } else {
              setUser({
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                title: 'Productivity User',
                tagline: 'Simple Focus',
                email: session.user.email || '',
                isLoggedIn: true
              });
            }

            setTasks(tasks);
            setReminders(reminders);
            setFocusSessions(focusSessions);

            subscribeToUserRealtime(userId);
          }
        }
      } catch (err) {
        console.error('Supabase hydration error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    hydrate();

    return () => {
      isMounted = false;
      unsubscribeFromUserRealtime();
    };
  }, [setTasks, setReminders, setFocusSessions, setUser, setSettings, setIntention]);

  return { isLoading };
}
