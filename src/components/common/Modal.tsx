import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  titleId?: string;
  ariaDescribedById?: string;
  children: React.ReactNode;
  maxWidthClass?: string;
  icon?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  titleId = 'modal-title',
  ariaDescribedById,
  children,
  maxWidthClass = 'max-w-lg',
  icon
}) => {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const isMouseDownOnBackdrop = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Use robust focus trap with focus restoration and escape handling
  useFocusTrap(modalRef, {
    isActive: isOpen,
    onEscape: () => onCloseRef.current(),
    restoreFocus: true
  });

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      isMouseDownOnBackdrop.current = true;
    }
  };

  const handleBackdropMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMouseDownOnBackdrop.current && e.target === e.currentTarget) {
      onCloseRef.current();
    }
    isMouseDownOnBackdrop.current = false;
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[100] flex items-center justify-center p-3 sm:p-6 animate-fade-in"
      onMouseDown={handleBackdropMouseDown}
      onMouseUp={handleBackdropMouseUp}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={ariaDescribedById}
        className={`bg-surface-lowest border border-outline-variant rounded-2xl shadow-modal w-full ${maxWidthClass} max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-scale-in`}
      >
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 sm:px-8 sm:pt-6 sm:pb-4 border-b border-outline-subtle flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            {icon}
            <h2 id={titleId} className="font-serif text-lg sm:text-2xl font-semibold text-on-surface truncate">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onCloseRef.current()}
            aria-label="Close dialog"
            className="w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center text-secondary hover:text-on-surface hover:bg-surface-low rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-container cursor-pointer flex-shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Inner Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-8 sm:py-6 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
