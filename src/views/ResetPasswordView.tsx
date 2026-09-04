import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUIStore } from '../store/useUIStore';
import { Logo } from '../components/common/Logo';
import { Lock, ArrowRight, AlertCircle, CheckCircle2, KeyRound, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { PasswordStrengthIndicator } from '../components/auth/PasswordStrengthIndicator';
import { triggerHapticFeedback, getFieldValidationClass } from '../utils/validation';

export const ResetPasswordView: React.FC = () => {
  const { updatePassword, session } = useAuth();
  const setActiveView = useUIStore((state) => state.setActiveView);
  const showToast = useUIStore((state) => state.showToast);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const isGoogleUser = Boolean(
    session?.user?.app_metadata?.provider === 'google' ||
    session?.user?.app_metadata?.providers?.includes('google') ||
    session?.user?.identities?.some((id: any) => id.provider === 'google') ||
    (session?.user?.email && localStorage.getItem(`planr_oauth_provider_${session.user.email.toLowerCase()}`) === 'google')
  );

  const hasPassword = Boolean(
    session?.user?.user_metadata?.has_password ||
    (session?.user?.id && localStorage.getItem(`planr_has_password_${session.user.id}`) === 'true') ||
    (session?.user?.email && localStorage.getItem(`planr_has_password_${session.user.email.toLowerCase()}`) === 'true')
  );

  const isPureGoogleUser = isGoogleUser && !hasPassword;

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (isPureGoogleUser) {
      setErrorMessage('This account was registered using Google and does not have a password. Please sign in with Google.');
      triggerHapticFeedback();
      return;
    }

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
      if (session?.user?.id) {
        try {
          localStorage.setItem(`planr_has_password_${session.user.id}`, 'true');
        } catch {}
      }
      if (session?.user?.email) {
        try {
          localStorage.setItem(`planr_has_password_${session.user.email.toLowerCase()}`, 'true');
        } catch {}
      }
      showToast('Password updated successfully! 🔒', 'success');
      setTimeout(() => {
        setActiveView('daily');
      }, 2000);
    }
  };


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

      {/* Main Reset Card with balanced width and spacing */}
      <div className="w-full max-w-md bg-surface-lowest border border-outline-variant rounded-2xl p-6 sm:p-8 shadow-card space-y-5">
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-xl bg-primary-container/20 border border-primary-container/40 flex items-center justify-center text-primary mx-auto mb-1">
            <KeyRound className="w-6 h-6" aria-hidden="true" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-on-surface tracking-tight">
            Reset your password
          </h1>
          <p className="text-xs sm:text-sm text-secondary font-sans max-w-xs mx-auto">
            Choose a secure new password for your Planr account.
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            aria-live="polite"
            className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-xs font-semibold text-red-800 dark:text-red-300 animate-fade-in"
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
        ) : isPureGoogleUser ? (
          <div className="p-6 bg-surface-low rounded-xl border border-outline-subtle text-center space-y-4 animate-fade-in">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto">
              <ShieldCheck className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-serif text-lg font-semibold text-on-surface">
                Google Account Detected
              </h3>
              <p className="text-xs text-secondary max-w-xs mx-auto">
                This account was registered using Google and does not have a password set. Password reset is not available — please sign in directly with Google.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveView('signin')}
              className="w-full py-3 px-5 bg-primary-container hover:bg-primary text-on-primary-container text-sm font-semibold uppercase tracking-wider rounded-xl shadow-sm transition-all cursor-pointer"
            >
              Return to Sign In
            </button>
          </div>
        ) : (
          <form noValidate onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label
                htmlFor="reset-new-password"
                className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5 font-sans"
              >
                New Password (min. 6 characters) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="z-10 w-4 h-4 text-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                <input
                  id="reset-new-password"
                  type={showPassword ? 'text' : 'password'}
                  autoFocus
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-11 py-2.5 sm:py-3 bg-surface-low border rounded-xl text-sm text-on-surface placeholder:text-secondary/60 focus:outline-none transition-all ${getFieldValidationClass(
                    !!fieldErrors.password
                  )}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="z-10 absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface transition-colors cursor-pointer border-none bg-transparent p-0 outline-none focus:outline-none focus:ring-0 select-none"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1 animate-fade-in font-medium" role="alert">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{fieldErrors.password}</span>
                </p>
              )}

              {/* Password Strength Indicator */}
              <PasswordStrengthIndicator password={password} />
            </div>

            <div>
              <label
                htmlFor="reset-confirm-password"
                className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5 font-sans"
              >
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="z-10 w-4 h-4 text-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                <input
                  id="reset-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-11 py-2.5 sm:py-3 bg-surface-low border rounded-xl text-sm text-on-surface placeholder:text-secondary/60 focus:outline-none transition-all ${getFieldValidationClass(
                    !!fieldErrors.confirmPassword
                  )}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isSubmitting}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  className="z-10 absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface transition-colors cursor-pointer border-none bg-transparent p-0 outline-none focus:outline-none focus:ring-0 select-none"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1 animate-fade-in font-medium" role="alert">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{fieldErrors.confirmPassword}</span>
                </p>
              )}
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-5 bg-primary-container hover:bg-primary text-on-primary-container text-sm font-semibold uppercase tracking-wider rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
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
            className="font-semibold text-primary hover:text-primary-container underline transition-colors cursor-pointer"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};
