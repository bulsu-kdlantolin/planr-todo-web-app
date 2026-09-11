import React from 'react';
import { useUIStore } from '../../store/useUIStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const toasts = useUIStore((state) => state.toasts);
  const dismissToast = useUIStore((state) => state.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-6 right-6 z-[120] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        return (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto bg-surface-lowest border border-outline-variant shadow-ambient-hover rounded-md p-3.5 flex items-center gap-3 text-sm text-on-surface animate-fade-in transition-all"
          >
            {toast.type === 'success' && (
              <CheckCircle2 className="w-5 h-5 text-tertiary flex-shrink-0" aria-hidden="true" />
            )}
            {toast.type === 'error' && (
              <AlertCircle className="w-5 h-5 text-error flex-shrink-0" aria-hidden="true" />
            )}
            {toast.type === 'info' && (
              <Info className="w-5 h-5 text-secondary flex-shrink-0" aria-hidden="true" />
            )}

            <span className="flex-1 leading-snug">{toast.message}</span>

            {toast.secondaryActionText && toast.onSecondaryAction && (
              <button
                type="button"
                onClick={() => {
                  toast.onSecondaryAction?.();
                  dismissToast(toast.id);
                }}
                className="px-2.5 py-1 text-xs font-medium text-secondary hover:text-on-surface bg-surface-low hover:bg-surface-container rounded border border-outline-subtle transition-colors cursor-pointer"
              >
                {toast.secondaryActionText}
              </button>
            )}

            {toast.actionText && toast.onAction && (
              <button
                type="button"
                onClick={() => {
                  toast.onAction?.();
                  dismissToast(toast.id);
                }}
                className="px-2.5 py-1 text-xs font-semibold text-primary bg-surface-low hover:bg-surface-container rounded border border-outline-subtle transition-colors cursor-pointer"
              >
                {toast.actionText}
              </button>
            )}

            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="text-secondary hover:text-on-surface p-1 rounded-sm transition-colors"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
