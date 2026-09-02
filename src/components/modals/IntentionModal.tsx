import React, { useState, useEffect } from 'react';
import { useMetaStore } from '../../store/useMetaStore';
import { useUIStore } from '../../store/useUIStore';
import { Modal } from '../common/Modal';
import { Logo } from '../common/Logo';
import { AlertCircle } from 'lucide-react';
import { triggerHapticFeedback, getFieldValidationClass } from '../../utils/validation';

interface IntentionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IntentionModal: React.FC<IntentionModalProps> = ({ isOpen, onClose }) => {
  const intention = useMetaStore((state) => state.intention);
  const updateIntention = useMetaStore((state) => state.updateIntention);
  const showToast = useUIStore((state) => state.showToast);

  const [value, setValue] = useState(intention);
  const [intentionError, setIntentionError] = useState<string | null>(null);

  useEffect(() => {
    setValue(intention);
    setIntentionError(null);
  }, [intention, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) {
      triggerHapticFeedback();
      setIntentionError('Please enter your main focus for today');
      return;
    }
    await updateIntention(value.trim());
    showToast('Daily focus updated', 'success');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Daily Focus"
      titleId="intention-modal-title"
      maxWidthClass="max-w-md"
      icon={<Logo size="sm" showWordmark={false} />}
    >
      <form noValidate onSubmit={handleSubmit} className="space-y-4 my-2">
        <div>
          <label htmlFor="daily-intention-input" className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
            What is your main priority today? <span className="text-red-500">*</span>
          </label>
          <textarea
            id="daily-intention-input"
            rows={3}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (intentionError) setIntentionError(null);
            }}
            placeholder="e.g. Complete the design draft and review team feedback"
            className={`w-full px-3.5 py-2.5 bg-surface-low border rounded-md text-sm text-on-surface font-serif italic resize-y transition-all focus:outline-none ${getFieldValidationClass(
              !!intentionError
            )}`}
          />
          {intentionError && (
            <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1 animate-fade-in font-medium" role="alert">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{intentionError}</span>
            </p>
          )}
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
            Save Focus
          </button>
        </div>
      </form>
    </Modal>
  );
};
