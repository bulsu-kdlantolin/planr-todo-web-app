import { useState, useEffect } from 'react';
import { useUIStore } from '../store/useUIStore';
import { restoreWorkspaceFromJSON } from '../utils/exportEngines';

/**
 * Hook to manage global drag-and-drop JSON backup file restoration.
 */
export function useDragDropRestore() {
  const [isDraggingFile, setIsDraggingFile] = useState(false);
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
        const success = await restoreWorkspaceFromJSON(backupData);

        if (success) {
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
  }, [showToast]);

  return { isDraggingFile };
}
