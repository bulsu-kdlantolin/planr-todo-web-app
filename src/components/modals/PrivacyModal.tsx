import React from 'react';
import { Modal } from '../common/Modal';
import { ShieldCheck, Lock, Trash2, Download } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Privacy Policy & Data Security"
      titleId="privacy-modal-title"
      maxWidthClass="max-w-lg"
      icon={
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <ShieldCheck className="w-4 h-4" aria-hidden="true" />
        </div>
      }
    >
      <div className="space-y-4 my-2 text-xs text-on-surface font-sans leading-relaxed">
        <div className="p-3.5 bg-surface-low rounded-xl border border-outline-subtle space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-primary">
            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Zero Tracking & Local-First Philosophy</span>
          </div>
          <p className="text-secondary text-[11px]">
            Planr is engineered with complete privacy in mind. We embed zero advertising pixels, tracking cookies, or commercial analytics scripts.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-serif text-sm font-semibold text-on-surface">1. What Data We Collect</h3>
          <p className="text-secondary">
            We only store the data you explicitly provide to organize your life: tasks, reminders, focus logs, and optional profile names.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-serif text-sm font-semibold text-on-surface">2. GDPR Rights & Compliance</h3>
          <ul className="space-y-1.5 text-secondary list-disc pl-4">
            <li>
              <strong>Right to Data Portability (Article 20):</strong> You can export all your workspace data at any time in standard JSON, Markdown, or CSV formats from the Settings tab.
            </li>
            <li>
              <strong>Right to Erasure (Article 17):</strong> When you delete your account or clear data, database cascading permanently removes all corresponding records.
            </li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="font-serif text-sm font-semibold text-on-surface">3. Client-Side Vault Encryption</h3>
          <p className="text-secondary">
            When you use Planr&apos;s secret vault, your data is encrypted using Web Crypto AES-GCM-256 with 600,000 PBKDF2 iterations directly on your device before touching any cloud storage.
          </p>
        </div>

        <div className="pt-3 border-t border-outline-subtle flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[38px] px-4 py-1.5 rounded-lg bg-primary-container text-on-primary-container hover:bg-primary text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
          >
            Understood
          </button>
        </div>
      </div>
    </Modal>
  );
};
