import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUIStore } from '../store/useUIStore';
import { Logo } from '../components/common/Logo';
import { Lock, ArrowRight, AlertCircle, CheckCircle2, KeyRound, Loader2 } from 'lucide-react';
import { triggerHapticFeedback, getFieldValidationClass } from '../utils/validation';

export const ResetPasswordView: React.FC = () => {
  const { updatePassword, session } = useAuth();
  const setActiveView = useUIStore((state) => state.setActiveView);
  const showToast = useUIStore((state) => state.showToast);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const errors: { password?: string; confirmPassword?: string } = {};
    if (!password) {
      errors.password = 'Please enter a new password.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters long.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password.';
    } else if (password && confirmPassword && password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      triggerHapticFeedback();
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setFieldErrors({});

    const { error } = await updatePassword(password);
    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
    } else {
      setIsSuccess(true);
      showToast('Password updated successfully! 🔒', 'success');
      setTimeout(() => {
        setActiveView('daily');
      }, 2000);
    }
  };

  const isInvalidSession = !session;

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center px-4 sm:px-6 py-12 animate-fade-in">
      {/* Brand Header */}
      <div className="mb-8 text-center flex flex-col items-center">
        <button
          type="button"
          onClick={() => setActiveView('landing')}
          className="hover:opacity-80 transition-opacity cursor-pointer"
          aria-label="Return to landing page"
        >
          <Logo size="lg" />
        </button>
      </div>

      {/* Main Reset Card */}
      <div className="w-full max-w-lg sm:max-w-xl bg-surface-lowest border border-outline-variant rounded-2xl p-8 sm:p-12 shadow-card space-y-7">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-primary-container/20 border border-primary-container/40 flex items-center justify-center text-primary mx-auto mb-2">
            <KeyRound className="w-6 h-6" aria-hidden="true" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-on-surface tracking-tight">
            Reset your password
          </h1>
          <p className="text-sm text-secondary font-sans max-w-sm mx-auto">
            Choose a secure new password for your Planr account.
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            aria-live="polite"
            className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-red-800 dark:text-red-300 animate-fade-in"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center space-y-3 animate-fade-in">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <h3 className="font-serif text-lg font-semibold text-emerald-900 dark:text-emerald-200">
              Password Changed!
            </h3>
            <p className="text-xs text-emerald-800 dark:text-emerald-300">
              Redirecting you to your workspace...
            </p>
          </div>
        ) : (
          <form noValidate onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label
                htmlFor="reset-new-password"
                className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-2 font-sans"
              >
                New Password (min. 6 characters) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-secondary absolute left-4 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  id="reset-new-password"
                  type="password"
                  autoFocus
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-11 pr-4 py-3 bg-surface-low border rounded-xl text-sm text-on-surface placeholder:text-secondary/60 focus:outline-none transition-all ${getFieldValidationClass(
                    !!fieldErrors.password
                  )}`}
                />
              </div>
              {fieldErrors.password && (
                <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1 animate-fade-in font-medium" role="alert">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{fieldErrors.password}</span>
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="reset-confirm-password"
                className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-2 font-sans"
              >
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-secondary absolute left-4 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  id="reset-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-11 pr-4 py-3 bg-surface-low border rounded-xl text-sm text-on-surface placeholder:text-secondary/60 focus:outline-none transition-all ${getFieldValidationClass(
                    !!fieldErrors.confirmPassword
                  )}`}
                />
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1 animate-fade-in font-medium" role="alert">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{fieldErrors.confirmPassword}</span>
                </p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-5 bg-primary-container hover:bg-primary text-on-primary-container text-sm font-semibold uppercase tracking-wider rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span>Updating password...</span>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  </span>
                ) : (
                  <>
                    <span>Save New Password & Continue</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        <div className="pt-2 text-center text-xs text-secondary">
          <button
            type="button"
            onClick={() => setActiveView('signin')}
            className="font-semibold text-primary hover:text-primary-container underline transition-colors"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};
