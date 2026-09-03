import React, { useState, useEffect } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { Logo } from '../common/Logo';
import { GoogleButton } from '../auth/GoogleButton';
import { Mail, Lock, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { PasswordStrengthIndicator } from '../auth/PasswordStrengthIndicator';
import { triggerHapticFeedback, getFieldValidationClass } from '../../utils/validation';

export const AuthModal: React.FC = () => {
  const authModalOpen = useUIStore((state) => state.authModalOpen);
  const closeAuthModal = useUIStore((state) => state.closeAuthModal);
  const authMode = useUIStore((state) => state.authMode);
  const openAuthModal = useUIStore((state) => state.openAuthModal);
  const showToast = useUIStore((state) => state.showToast);
  const setActiveView = useUIStore((state) => state.setActiveView);

  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    isLoading: isAuthLoading
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setFieldErrors({});
    setErrorMessage(null);
  }, [authModalOpen, authMode]);

  const isValidEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr.trim());
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const errors: { email?: string; password?: string } = {};
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      errors.email = 'Please enter your email address.';
    } else if (!isValidEmail(cleanEmail)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Please enter your password.';
    }

    if (Object.keys(errors).length > 0) {
      triggerHapticFeedback();
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setFieldErrors({});

    const { error } = await signInWithEmail(cleanEmail, password);
    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
    } else {
      showToast('Signed in successfully! ☀️', 'success');
      closeAuthModal();
      setEmail('');
      setPassword('');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const errors: { email?: string; password?: string } = {};
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      errors.email = 'Please enter your email address.';
    } else if (!isValidEmail(cleanEmail)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Please enter a password.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters long.';
    }

    if (Object.keys(errors).length > 0) {
      triggerHapticFeedback();
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setFieldErrors({});

    const result = await signUpWithEmail(cleanEmail, password);
    setIsSubmitting(false);

    if (result.error) {
      setErrorMessage(result.error.message);
      if (result.isExistingUnconfirmed) {
        showToast('Fresh verification email sent! 📬', 'info');
      }
    } else {
      if (result.needsEmailConfirmation) {
        showToast('Verification email sent! Check your inbox ✉️', 'info');
      } else {
        showToast('Account created! Welcome to Planr 🌿', 'success');
      }
      closeAuthModal();
      setEmail('');
      setPassword('');
    }
  };

  const handleGoogleAuth = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    const { error } = await signInWithGoogle();
    setIsGoogleLoading(false);
    if (error) {
      setErrorMessage(error.message);
    }
  };

  const isSignIn = authMode === 'signin';

  return (
    <Modal
      isOpen={authModalOpen}
      onClose={closeAuthModal}
      title={isSignIn ? 'Welcome Back' : 'Create an Account'}
      titleId="auth-modal-title"
      maxWidthClass="max-w-sm"
      icon={<Logo size="sm" showWordmark={false} />}
    >
      {/* Mode Switcher Tabs */}
      <div className="flex border-b border-outline-subtle mb-4">
        <button
          type="button"
          onClick={() => {
            openAuthModal('signin');
            setErrorMessage(null);
            setFieldErrors({});
          }}
          className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider text-center border-b-2 transition-colors cursor-pointer ${
            isSignIn
              ? 'border-primary-container text-primary-container'
              : 'border-transparent text-secondary hover:text-on-surface'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            openAuthModal('signup');
            setErrorMessage(null);
            setFieldErrors({});
          }}
          className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider text-center border-b-2 transition-colors cursor-pointer ${
            !isSignIn
              ? 'border-primary-container text-primary-container'
              : 'border-transparent text-secondary hover:text-on-surface'
          }`}
        >
          Create Account
        </button>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-md flex items-center gap-2 text-xs text-red-800 dark:text-red-300"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600 dark:text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form noValidate onSubmit={isSignIn ? handleSignIn : handleSignUp} className="space-y-3.5 my-2">
        <div>
          <label htmlFor="modal-email-input" className="block text-xs font-medium text-secondary mb-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="z-10 w-4 h-4 text-secondary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="modal-email-input"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="you@example.com"
              className={`w-full pl-9 pr-3 py-2 bg-surface-low border rounded-md text-xs text-on-surface focus:outline-none transition-all ${getFieldValidationClass(
                !!fieldErrors.email
              )}`}
            />
          </div>
          {fieldErrors.email && (
            <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 animate-fade-in font-medium" role="alert">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              <span>{fieldErrors.email}</span>
            </p>
          )}
        </div>

        <div>
          <label htmlFor="modal-password-input" className="block text-xs font-medium text-secondary mb-1">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className="z-10 w-4 h-4 text-secondary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="modal-password-input"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="••••••••"
              className={`w-full pl-9 pr-9 py-2 bg-surface-low border rounded-md text-xs text-on-surface focus:outline-none transition-all ${getFieldValidationClass(
                !!fieldErrors.password
              )}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="z-10 absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface transition-colors cursor-pointer border-none bg-transparent p-0 outline-none focus:outline-none focus:ring-0 select-none"
            >
              {showPassword ? (
                <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              )}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 animate-fade-in font-medium" role="alert">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              <span>{fieldErrors.password}</span>
            </p>
          )}

          {!isSignIn && <PasswordStrengthIndicator password={password} />}

          {isSignIn && (
            <div className="flex justify-end mt-1.5">
              <button
                type="button"
                onClick={() => {
                  closeAuthModal();
                  setActiveView('signin');
                }}
                className="text-[11px] text-primary hover:text-primary-container hover:underline transition-colors cursor-pointer font-medium"
              >
                Forgot password?
              </button>
            </div>
          )}
        </div>

        <div className="pt-1">
          <button
            type="submit"
            disabled={isSubmitting || isAuthLoading}
            className="w-full py-2.5 bg-primary-container hover:bg-primary text-on-primary-container text-xs font-semibold uppercase tracking-wider rounded-md shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span>{authMode === 'signin' ? 'Signing in...' : 'Creating account...'}</span>
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              </span>
            ) : (
              <span>{authMode === 'signin' ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>
        </div>

        {/* Google OAuth Option */}
        <div className="space-y-3 pt-2">
          <div className="relative text-center">
            <hr className="border-outline-subtle" />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface-lowest px-2 text-[10px] text-secondary">
              or continue with
            </span>
          </div>

          <GoogleButton
            onClick={handleGoogleAuth}
            isLoading={isGoogleLoading}
            disabled={isSubmitting}
            label="Continue with Google"
          />
        </div>
      </form>
    </Modal>
  );
};

export default AuthModal;
