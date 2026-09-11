import React, { useState, useEffect } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { useMetaStore } from '../../store/useMetaStore';
import { Modal } from '../common/Modal';
import { Command, RotateCcw, Edit3 } from 'lucide-react';

interface ShortcutAction {
  id: string;
  label: string;
  defaultKey: string;
}

const DEFAULT_SHORTCUTS: ShortcutAction[] = [
  { id: 'commandPalette', label: 'Spotlight & Command Palette', defaultKey: '⌘K / /' },
  { id: 'newTask', label: 'Create new task', defaultKey: 'N' },
  { id: 'toggleFullScreen', label: 'Toggle Full Screen mode', defaultKey: 'F' },
  { id: 'dailyView', label: 'Go to Daily Overview', defaultKey: 'D' },
  { id: 'tasksView', label: 'Go to Tasks', defaultKey: 'T' },
  { id: 'remindersView', label: 'Go to Reminders', defaultKey: 'R' },
  { id: 'focusView', label: 'Go to Focus Timer', defaultKey: 'C' },
  { id: 'shortcutsModal', label: 'Open keyboard shortcuts', defaultKey: '?' }
];

export const ShortcutsModal: React.FC = () => {
  const shortcutsModalOpen = useUIStore((state) => state.shortcutsModalOpen);
  const closeShortcutsModal = useUIStore((state) => state.closeShortcutsModal);
  const showToast = useUIStore((state) => state.showToast);

  const settings = useMetaStore((state) => state.settings);
  const updateSettings = useMetaStore((state) => state.updateSettings);

  const [recordingActionId, setRecordingActionId] = useState<string | null>(null);

  const customShortcuts = settings.shortcuts || {};

  const getActionKey = (actionId: string, defaultKey: string) => {
    return (customShortcuts as Record<string, string>)[actionId] || defaultKey;
  };

  useEffect(() => {
    if (!recordingActionId) return;

    const handleKeyCapture = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        setRecordingActionId(null);
        return;
      }

      const pressedKey = e.key.length === 1 ? e.key.toUpperCase() : e.key;
      const updated = {
        ...customShortcuts,
        [recordingActionId]: pressedKey
      };

      updateSettings({ shortcuts: updated });
      showToast(`Shortcut updated: ${pressedKey}`);
      setRecordingActionId(null);
    };

    window.addEventListener('keydown', handleKeyCapture, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyCapture, { capture: true });
  }, [recordingActionId, customShortcuts, updateSettings, showToast]);

  const handleResetDefaults = () => {
    updateSettings({ shortcuts: {} });
    showToast('Shortcuts reset to defaults');
  };

  return (
    <Modal
      isOpen={shortcutsModalOpen}
      onClose={closeShortcutsModal}
      title="Keyboard Shortcuts"
      titleId="shortcuts-modal-title"
      maxWidthClass="max-w-md"
      icon={<Command className="w-5 h-5 text-tertiary" aria-hidden="true" />}
    >
      <div className="space-y-3 my-3">
        <p className="text-xs text-secondary font-sans">
          Click any key below to customize and remap your shortcut bindings.
        </p>

        <div className="space-y-2">
          {DEFAULT_SHORTCUTS.map((sc) => {
            const currentKey = getActionKey(sc.id, sc.defaultKey);
            const isRecording = recordingActionId === sc.id;

            return (
              <div
                key={sc.id}
                className="flex items-center justify-between py-2 px-3 rounded-md bg-surface-low border border-outline-subtle text-xs"
              >
                <span className="text-on-surface font-medium">{sc.label}</span>

                <button
                  type="button"
                  onClick={() => setRecordingActionId(sc.id)}
                  aria-label={`Remap shortcut for ${sc.label}, currently ${currentKey}`}
                  className={`px-2.5 py-1 rounded font-mono text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                    isRecording
                      ? 'bg-tertiary text-on-primary animate-pulse ring-2 ring-tertiary'
                      : 'bg-surface-lowest border border-outline-variant text-primary hover:border-primary'
                  }`}
                >
                  <span>{isRecording ? 'Press key...' : currentKey}</span>
                  {!isRecording && <Edit3 className="w-3 h-3 text-secondary opacity-60" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-3 border-t border-outline-subtle flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={handleResetDefaults}
          className="flex items-center gap-1.5 text-secondary hover:text-on-surface transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Reset to Defaults</span>
        </button>

        <button
          type="button"
          onClick={closeShortcutsModal}
          className="px-4 py-1.5 rounded-md bg-primary-container hover:bg-primary text-on-primary-container font-semibold uppercase tracking-wider text-[11px] shadow-sm transition-all"
        >
          Done
        </button>
      </div>
    </Modal>
  );
};

export default ShortcutsModal;
