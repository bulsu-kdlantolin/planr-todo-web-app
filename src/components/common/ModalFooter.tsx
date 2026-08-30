import React from 'react';

interface ModalFooterProps {
  onCancel: () => void;
  onSubmit?: () => void;
  submitText?: string;
  cancelText?: string;
  submitDisabled?: boolean;
  className?: string;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({
  onCancel,
  onSubmit,
  submitText = 'Save',
  cancelText = 'Cancel',
  submitDisabled = false,
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-end gap-3 pt-4 border-t border-outline-subtle mt-4 ${className}`}>
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 text-xs font-medium text-secondary hover:text-on-surface rounded-md hover:bg-surface-low transition-colors"
      >
        {cancelText}
      </button>

      <button
        type={onSubmit ? 'button' : 'submit'}
        onClick={onSubmit}
        disabled={submitDisabled}
        className="px-5 py-2 text-xs font-semibold uppercase tracking-wider bg-primary-container hover:bg-primary text-on-primary-container rounded-md shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitText}
      </button>
    </div>
  );
};
