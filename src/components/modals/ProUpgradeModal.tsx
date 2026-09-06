import React, { useState } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { Modal } from '../common/Modal';
import { Logo } from '../common/Logo';
import { Check, Sparkles, ShieldCheck, Cloud, HardDrive, RefreshCw, Music, Calendar } from 'lucide-react';

export const ProUpgradeModal: React.FC = () => {
  const isOpen = useUIStore((state) => state.proUpgradeModalOpen);
  const closeModal = useUIStore((state) => state.closeProUpgradeModal);
  const showToast = useUIStore((state) => state.showToast);

  const [billingCycle, setBillingCycle] = useState<'yearly' | 'monthly'>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSimulatedCheckout = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      closeModal();
      showToast('Planr Pro pre-order / checkout simulated successfully! 🎉', 'success');
    }, 1200);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title="Planr Pro"
      titleId="pro-upgrade-modal-title"
      maxWidthClass="max-w-xl"
      icon={<Sparkles className="w-5 h-5 text-tertiary" />}
    >
      <div className="space-y-6 my-2">
        {/* Header Pitch */}
        <div className="text-center space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-tertiary/15 text-tertiary border border-tertiary/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Multi-Device Sync</span>
          </span>
          <h3 className="font-serif text-2xl font-bold text-on-surface">
            Your local vault stays free forever. Add cloud sync when you need it.
          </h3>
          <p className="text-xs text-secondary max-w-md mx-auto leading-relaxed">
            Planr is completely free for offline use on your device. Upgrading to Pro gives you end-to-end encrypted sync across all your devices, revision history, and custom audio uploads.
          </p>
        </div>

        {/* Billing Cycle Selector */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 bg-surface-low border border-outline-variant rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-1.5 rounded-md transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-primary-container text-on-primary-container shadow-xs font-bold'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              Yearly (Save 25%) • $36/yr
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-md transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-primary-container text-on-primary-container shadow-xs font-bold'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              Monthly • $4/mo
            </button>
          </div>
        </div>

        {/* Plan Comparison Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Free Tier */}
          <div className="p-4 rounded-xl border border-outline-subtle bg-surface-low space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-serif font-bold text-base text-on-surface">Free Vault</h4>
                <p className="text-[11px] text-secondary">100% on-device privacy</p>
              </div>
              <span className="text-sm font-bold text-on-surface">$0</span>
            </div>

            <ul className="space-y-2 text-xs text-secondary pt-2 border-t border-outline-subtle">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>Local IndexedDB private storage</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>Unlimited tasks, subtasks & reminders</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>All 4 procedural focus soundscapes</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>Markdown, CSV & JSON data export</span>
              </li>
            </ul>
          </div>

          {/* Pro Tier */}
          <div className="p-4 rounded-xl border-2 border-primary bg-primary-container/10 relative space-y-3 shadow-ambient">
            <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white tracking-wide uppercase">
              Recommended
            </span>

            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-serif font-bold text-base text-primary">Planr Pro</h4>
                <p className="text-[11px] text-secondary">Encrypted sync & power tools</p>
              </div>
              <span className="text-sm font-bold text-primary">
                {billingCycle === 'yearly' ? '$3 / mo' : '$4 / mo'}
              </span>
            </div>

            <ul className="space-y-2 text-xs text-on-surface pt-2 border-t border-primary/20">
              <li className="flex items-center gap-2 font-medium">
                <Cloud className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>Encrypted multi-device sync</span>
              </li>
              <li className="flex items-center gap-2 font-medium">
                <RefreshCw className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>Version history and accidental delete recovery</span>
              </li>
              <li className="flex items-center gap-2 font-medium">
                <Music className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>Upload your own focus audio files (MP3/FLAC)</span>
              </li>
              <li className="flex items-center gap-2 font-medium">
                <Calendar className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>Calendar sync (Google & Outlook)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-outline-subtle">
          <span className="text-[11px] text-secondary">
            Cancel anytime • 14-day money-back guarantee
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-xs text-secondary hover:text-on-surface font-medium"
            >
              Maybe Later
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleSimulatedCheckout}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-container text-on-primary-container hover:bg-primary rounded-lg text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Redirecting to checkout...' : `Upgrade to Pro (${billingCycle === 'yearly' ? '$36/yr' : '$4/mo'})`}</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ProUpgradeModal;
