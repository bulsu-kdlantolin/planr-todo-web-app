import React from 'react';
import { Loader2 } from 'lucide-react';

interface ModalFooterProps {
  onCancel: () => void;
  onSubmit?: () => void;
  submitText?: string;
  submittingText?: string;
  cancelText?: string;
  submitDisabled?: boolean;
  isSubmitting?: boolean;
  className?: string;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({
  onCancel,
  onSubmit,
  submitText = 'Save',
  submittingText,
  cancelText = 'Cancel',
  submitDisabled = false,
  isSubmitting = false,
  className = ''
}) => {
  const loadingLabel = submittingText || `${submitText}...`;

  return (
    <div className={`flex items-center justify-end gap-3 pt-4 border-t border-outline-subtle mt-4 ${className}`}>
      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        className="px-4 py-2 text-xs font-medium text-secondary hover:text-on-surface rounded-md hover:bg-surface-low transition-colors disabled:opacity-50 cursor-pointer"
      >
        {cancelText}
      </button>

      <button
        type={onSubmit ? 'button' : 'submit'}
        onClick={onSubmit}
        disabled={submitDisabled || isSubmitting}
        className="px-5 py-2 text-xs font-semibold uppercase tracking-wider bg-primary-container hover:bg-primary text-on-primary-container rounded-md shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <span>{loadingLabel}</span>
            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
          </span>
        ) : (
          submitText
        )}
      </button>
    </div>
  );
};
