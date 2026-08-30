import { useState, useEffect } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { useReminderStore } from '../store/useReminderStore';
import { useTimerStore } from '../store/useTimerStore';
import { useMetaStore } from '../store/useMetaStore';
import { useUIStore } from '../store/useUIStore';
import { dbImportJSON } from '../db/indexedDB';

/**
 * Hook to manage global drag-and-drop JSON backup file restoration.
 */
export function useDragDropRestore() {
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const setTasks = useTaskStore((state) => state.setTasks);
  const setReminders = useReminderStore((state) => state.setReminders);
  const setFocusSessions = useTimerStore((state) => state.setFocusSessions);
  const setUser = useMetaStore((state) => state.setUser);
  const setSettings = useMetaStore((state) => state.setSettings);
  const showToast = useUIStore((state) => state.showToast);

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.types.includes('Files')) {
        setIsDraggingFile(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      if (e.relatedTarget === null) {
        setIsDraggingFile(false);
      }
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      setIsDraggingFile(false);

      const file = e.dataTransfer?.files?.[0];
      if (!file || !file.name.endsWith('.json')) return;

      try {
        const text = await file.text();
        const backupData = JSON.parse(text);
        const success = await dbImportJSON(backupData);

        if (success) {
          if (backupData.tasks) setTasks(backupData.tasks);
          if (backupData.reminders) setReminders(backupData.reminders);
          if (backupData.focusSessions) setFocusSessions(backupData.focusSessions);
          if (backupData.meta?.user) setUser(backupData.meta.user);
          if (backupData.meta?.settings) setSettings(backupData.meta.settings);
          showToast('Workspace backup restored from dropped file! 📦', 'success');
        } else {
          showToast('Failed to parse backup payload.', 'error');
        }
      } catch {
        showToast('Invalid JSON backup file.', 'error');
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [setTasks, setReminders, setFocusSessions, setUser, setSettings, showToast]);

  return { isDraggingFile };
}
