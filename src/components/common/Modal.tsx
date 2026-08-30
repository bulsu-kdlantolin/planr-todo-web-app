import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  titleId?: string;
  children: React.ReactNode;
  maxWidthClass?: string;
  icon?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  titleId = 'modal-title',
  children,
  maxWidthClass = 'max-w-lg',
  icon
}) => {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const isMouseDownOnBackdrop = useRef(false);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      // Escape key listener & focus trap
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        }

        // Focus trap
        if (e.key === 'Tab' && modalRef.current) {
          const focusable = modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length === 0) return;

          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      // Auto-focus first input or container
      setTimeout(() => {
        if (modalRef.current) {
          const firstInput = modalRef.current.querySelector<HTMLElement>(
            'input, button:not([aria-label="Close dialog"])'
          );
          if (firstInput) firstInput.focus();
        }
      }, 50);

      return () => {
        document.body.style.overflow = originalOverflow;
        document.removeEventListener('keydown', handleKeyDown);
        if (previousActiveElement.current) {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      isMouseDownOnBackdrop.current = true;
    }
  };

  const handleBackdropMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMouseDownOnBackdrop.current && e.target === e.currentTarget) {
      onClose();
    }
    isMouseDownOnBackdrop.current = false;
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onMouseDown={handleBackdropMouseDown}
      onMouseUp={handleBackdropMouseUp}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`bg-surface-lowest border border-outline-variant rounded-lg shadow-modal w-full ${maxWidthClass} max-h-[90vh] overflow-y-auto p-6 sm:p-8 animate-scale-in`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-outline-subtle mb-4">
          <div className="flex items-center gap-2.5">
            {icon}
            <h2 id={titleId} className="font-serif text-xl sm:text-2xl font-semibold text-on-surface">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 text-secondary hover:text-on-surface hover:bg-surface-low rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-container"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
