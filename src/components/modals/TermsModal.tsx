import React from 'react';
import { Modal } from '../common/Modal';
import { FileText, CheckCircle2 } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Terms of Service & Usage"
      titleId="terms-modal-title"
      maxWidthClass="max-w-lg"
      icon={
        <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
          <FileText className="w-4 h-4" aria-hidden="true" />
        </div>
      }
    >
      <div className="space-y-4 my-2 text-xs text-on-surface font-sans leading-relaxed">
        <div className="p-3.5 bg-surface-low rounded-xl border border-outline-subtle space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-primary">
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Calm, Fair, Zero-Subscription Software</span>
          </div>
          <p className="text-secondary text-[11px]">
            Planr is built for clarity and focus. No subscription paywalls, no artificial feature gating.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-serif text-sm font-semibold text-on-surface">1. User Data Ownership</h3>
          <p className="text-secondary">
            You maintain 100% intellectual property and ownership over all notes, reminders, task lists, and reflections created inside Planr.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-serif text-sm font-semibold text-on-surface">2. Fair Use & Availability</h3>
          <p className="text-secondary">
            You agree to use Planr responsibly and not to execute automated denial-of-service or malicious API scripts against the sync infrastructure.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-serif text-sm font-semibold text-on-surface">3. Offline-First Disclaimer</h3>
          <p className="text-secondary">
            Because Planr functions offline and synchronizes when online, we recommend keeping local backups via the &ldquo;Export Workspace (JSON)&rdquo; feature before performing major device resets.
          </p>
        </div>

        <div className="pt-3 border-t border-outline-subtle flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[38px] px-4 py-1.5 rounded-lg bg-primary-container text-on-primary-container hover:bg-primary text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
          >
            I Agree
          </button>
        </div>
      </div>
    </Modal>
  );
};
