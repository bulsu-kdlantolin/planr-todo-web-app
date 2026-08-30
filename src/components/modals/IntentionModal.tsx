import React, { useState, useEffect } from 'react';
import { useMetaStore } from '../../store/useMetaStore';
import { useUIStore } from '../../store/useUIStore';
import { Modal } from '../common/Modal';
import { Logo } from '../common/Logo';

interface IntentionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IntentionModal: React.FC<IntentionModalProps> = ({ isOpen, onClose }) => {
  const intention = useMetaStore((state) => state.intention);
  const updateIntention = useMetaStore((state) => state.updateIntention);
  const showToast = useUIStore((state) => state.showToast);

  const [value, setValue] = useState(intention);

  useEffect(() => {
    setValue(intention);
  }, [intention, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      await updateIntention(value.trim());
      showToast('Daily grounding intention updated');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Daily Intention"
      titleId="intention-modal-title"
      maxWidthClass="max-w-md"
      icon={<Logo size="sm" showWordmark={false} />}
    >
      <form onSubmit={handleSubmit} className="space-y-4 my-2">
        <div>
          <label htmlFor="daily-intention-input" className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
            Set your grounding thought or primary focus
          </label>
          <textarea
            id="daily-intention-input"
            rows={3}
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. Move through the day with stillness, clarity, and deep focus..."
            className="w-full px-3.5 py-2.5 bg-surface-low border border-outline-variant rounded-md text-sm text-on-surface focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary-container/20 font-serif italic resize-y"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-outline-subtle">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-secondary hover:text-on-surface bg-surface-low hover:bg-surface-container rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-medium bg-primary-container text-on-primary-container hover:bg-primary rounded-md shadow-sm transition-all"
          >
            Save Intention
          </button>
        </div>
      </form>
    </Modal>
  );
};
