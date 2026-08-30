import React, { useState } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { Logo } from '../common/Logo';
import { UserCheck, Mail, Lock, User, AlertCircle } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const authModalOpen = useUIStore((state) => state.authModalOpen);
  const closeAuthModal = useUIStore((state) => state.closeAuthModal);
  const authMode = useUIStore((state) => state.authMode);
  const openAuthModal = useUIStore((state) => state.openAuthModal);
  const showToast = useUIStore((state) => state.showToast);

  const {
    signInWithEmail,
    signUpWithEmail,
    isConfigured,
    isLoading: isAuthLoading
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const { error } = await signInWithEmail(email, password);
    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
    } else {
      showToast('Signed in successfully', 'success');
      closeAuthModal();
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const { error } = await signUpWithEmail(email, password, name);
    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
    } else {
      showToast('Account created successfully', 'success');
      closeAuthModal();
    }
  };

  const handleDemoLogin = async () => {
    setIsSubmitting(true);
    await signInWithEmail('demo@planr.app', 'intentional');
    setIsSubmitting(false);
    showToast('Entered workspace in private local mode', 'info');
    closeAuthModal();
  };

  return (
    <Modal
      isOpen={authModalOpen}
      onClose={closeAuthModal}
      title={authMode === 'signin' ? 'Sign In' : 'Create Account'}
      maxWidthClass="max-w-md"
    >
      <div className="text-center mb-6">
        <div className="flex justify-center mb-3">
          <Logo size="md" />
        </div>
        <p className="text-xs text-secondary">
          {authMode === 'signin'
            ? 'Sign in to access your workspace.'
            : 'Start organizing your days with intentional focus.'}
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-xs text-red-700 dark:text-red-300"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Mode Switcher Tab */}
      <div className="flex rounded-lg bg-surface-low p-1 mb-4 border border-outline-subtle">
        <button
          type="button"
          onClick={() => {
            openAuthModal('signin');
            setErrorMessage(null);
          }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
            authMode === 'signin'
              ? 'bg-surface-lowest text-on-surface shadow-xs'
              : 'text-secondary hover:text-on-surface'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            openAuthModal('signup');
            setErrorMessage(null);
          }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
            authMode === 'signup'
              ? 'bg-surface-lowest text-on-surface shadow-xs'
              : 'text-secondary hover:text-on-surface'
          }`}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={authMode === 'signin' ? handleSignIn : handleSignUp} className="space-y-3.5">
        {authMode === 'signup' && (
          <div>
            <label htmlFor="modal-name-input" className="block text-xs font-medium text-secondary mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="modal-name-input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full pl-9 pr-3 py-2 bg-surface-low border border-outline-variant rounded-md text-xs text-on-surface focus:border-primary-container focus:outline-none"
              />
            </div>
          </div>
        )}

        <div>
          <label htmlFor="modal-email-input" className="block text-xs font-medium text-secondary mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="modal-email-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-9 pr-3 py-2 bg-surface-low border border-outline-variant rounded-md text-xs text-on-surface focus:border-primary-container focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="modal-password-input" className="block text-xs font-medium text-secondary mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="modal-password-input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2 bg-surface-low border border-outline-variant rounded-md text-xs text-on-surface focus:border-primary-container focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-1">
          <button
            type="submit"
            disabled={isSubmitting || isAuthLoading}
            className="w-full py-2.5 bg-primary-container hover:bg-primary text-on-primary-container text-xs font-semibold uppercase tracking-wider rounded-md shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting
              ? 'Authenticating...'
              : authMode === 'signin'
              ? 'Sign In'
              : 'Create Account'}
          </button>
        </div>

        <div className="relative my-3 text-center">
          <hr className="border-outline-subtle" />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface-lowest px-2 text-[10px] text-secondary">
            or
          </span>
        </div>

        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={isSubmitting}
          className="w-full py-2 bg-surface-low hover:bg-surface-container text-on-surface border border-outline-variant text-xs font-medium rounded-md flex items-center justify-center gap-2 transition-colors"
        >
          <UserCheck className="w-3.5 h-3.5 text-tertiary" aria-hidden="true" />
          <span>Continue in Private Local Mode</span>
        </button>
      </form>
    </Modal>
  );
};

export default AuthModal;
