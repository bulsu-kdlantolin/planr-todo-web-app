import { useState, useEffect } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { useReminderStore } from '../store/useReminderStore';
import { useTimerStore } from '../store/useTimerStore';
import { useMetaStore } from '../store/useMetaStore';
import { initDatabase } from '../db/indexedDB';
import { audioManager } from '../utils/audio';

/**
 * Hook to initialize IndexedDB and hydrate all Zustand stores.
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
      try {
        const data = await initDatabase();
        if (isMounted && data) {
          if (data.tasks) setTasks(data.tasks);
          if (data.reminders) setReminders(data.reminders);
          if (data.focusSessions) setFocusSessions(data.focusSessions);
          if (data.user) setUser(data.user);
          if (data.settings) {
            setSettings(data.settings);
            audioManager.setVolume(data.settings.soundVolume ?? 0.5);
          }
          if (data.intention) setIntention(data.intention);
        }
      } catch (err) {
        console.error('Database initialization error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    hydrate();

    return () => {
      isMounted = false;
    };
  }, [setTasks, setReminders, setFocusSessions, setUser, setSettings, setIntention]);

  return { isLoading };
}
