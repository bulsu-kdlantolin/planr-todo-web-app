import React from 'react';
import { Modal } from './Modal';
import { Logo } from './Logo';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      titleId="confirm-dialog-title"
      maxWidthClass="max-w-md"
      icon={<Logo size="sm" showWordmark={false} />}
    >
      <div className="space-y-4 my-2">
        <p className="text-xs text-secondary leading-relaxed font-sans break-words">
          {description}
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-outline-subtle">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-secondary hover:text-on-surface bg-surface-low hover:bg-surface-high border border-outline-subtle rounded-md transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 py-2 text-xs font-semibold uppercase tracking-wider bg-primary-container hover:bg-primary text-on-primary-container rounded-md shadow-sm transition-all active:scale-[0.98] focus:ring-2 focus:ring-primary-container focus:outline-none cursor-pointer"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
