import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUIStore } from '../store/useUIStore';
import { Logo } from '../components/common/Logo';
import { GoogleButton } from '../components/auth/GoogleButton';
import {
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Clock,
  Loader2,
  MailCheck,
  RefreshCw
} from 'lucide-react';
import { triggerHapticFeedback, getFieldValidationClass } from '../utils/validation';

export const SignUpView: React.FC = () => {
  const {
    signUpWithEmail,
    signInWithGoogle,
    resendVerificationEmail,
    isLoading: authLoading
  } = useAuth();

  const setActiveView = useUIStore((state) => state.setActiveView);
  const showToast = useUIStore((state) => state.showToast);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Client-side rate limiting protection
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const timer = setInterval(() => {
      setLockoutRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutRemaining]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const isValidEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr.trim());
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || lockoutRemaining > 0) return;

    const errors: { email?: string; password?: string } = {};
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      errors.email = 'Please enter your email address.';
    } else if (!isValidEmail(cleanEmail)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Please create a password for your account.';
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
      if (result.isExistingUnconfirmed) {
        setNeedsConfirmation(true);
        setErrorMessage(result.error.message);
        showToast('Fresh verification email sent! 📬', 'info');
      } else {
        const nextFailures = failedAttempts + 1;
        setFailedAttempts(nextFailures);
        if (nextFailures >= 4) {
          setLockoutRemaining(30);
          setErrorMessage('Too many attempts. Please wait 30 seconds before trying again.');
        } else {
          setErrorMessage(result.error.message);
        }
      }
    } else {
      setFailedAttempts(0);
      if (result.needsEmailConfirmation) {
        setNeedsConfirmation(true);
        showToast('Verification email sent! Check your inbox ✉️', 'info');
      } else {
        showToast('Account created! Welcome to Planr 🌿', 'success');
        setActiveView('onboarding');
      }
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    const { error } = await signInWithGoogle();
    setIsGoogleLoading(false);
    if (error) {
      setErrorMessage(error.message);
    }
  };

  const handleResendConfirmation = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || resendCooldown > 0) return;

    setIsSubmitting(true);
    const { error } = await resendVerificationEmail(cleanEmail);
    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
    } else {
      setResendCooldown(60);
      showToast('Fresh verification email sent! 📬', 'success');
    }
  };

  const isLockedOut = lockoutRemaining > 0;

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

      {/* Main Sign Up Card */}
      <div className="w-full max-w-lg sm:max-w-xl bg-surface-lowest border border-outline-variant rounded-2xl p-8 sm:p-12 shadow-card space-y-6">
        {/* Email Verification Required Screen */}
        {needsConfirmation ? (
          <div className="text-center space-y-6 py-2 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-primary-container/20 border border-primary-container/40 flex items-center justify-center text-primary mx-auto">
              <MailCheck className="w-8 h-8 text-primary" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-on-surface tracking-tight">
                Verify your email
              </h1>
              <p className="text-sm text-secondary font-sans max-w-md mx-auto leading-relaxed">
                We've sent a verification link to <span className="font-semibold text-on-surface">{email}</span>. Click the link in the email to activate your account.
              </p>
            </div>

            {errorMessage && (
              <div
                role="alert"
                aria-live="polite"
                className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-red-800 dark:text-red-300 animate-fade-in text-left"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveView('signin')}
                className="w-full py-3.5 px-5 bg-primary-container hover:bg-primary text-on-primary-container text-sm font-semibold uppercase tracking-wider rounded-xl shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={isSubmitting || resendCooldown > 0}
                className="w-full py-3 px-4 bg-surface-low hover:bg-surface-container border border-outline-variant text-secondary hover:text-on-surface text-xs font-semibold uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span>Resending verification email...</span>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  </span>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>
                      {resendCooldown > 0
                        ? `Resend available in ${resendCooldown}s`
                        : 'Resend Verification Email'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center space-y-2">
              <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-on-surface tracking-tight">
                Create your account
              </h1>
              <p className="text-sm text-secondary font-sans max-w-sm mx-auto">
                Start organizing your days with intentional focus and clarity.
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

            {/* Standard Email & Password Sign Up Form */}
            <form noValidate onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label
                  htmlFor="signup-email"
                  className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-2 font-sans"
                >
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail
                    className="w-4 h-4 text-secondary absolute left-4 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <input
                    id="signup-email"
                    type="email"
                    autoFocus
                    disabled={isSubmitting || isLockedOut}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="name@example.com"
                    className={`w-full pl-11 pr-4 py-3 bg-surface-low border rounded-xl text-sm text-on-surface placeholder:text-secondary/60 focus:outline-none transition-all disabled:opacity-50 ${getFieldValidationClass(
                      !!fieldErrors.email
                    )}`}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1 animate-fade-in font-medium" role="alert">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{fieldErrors.email}</span>
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="signup-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-2 font-sans"
                >
                  Create Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock
                    className="w-4 h-4 text-secondary absolute left-4 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <input
                    id="signup-password"
                    type="password"
                    disabled={isSubmitting || isLockedOut}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="At least 6 characters"
                    className={`w-full pl-11 pr-4 py-3 bg-surface-low border rounded-xl text-sm text-on-surface placeholder:text-secondary/60 focus:outline-none transition-all disabled:opacity-50 ${getFieldValidationClass(
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

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || authLoading || isLockedOut}
                  className="w-full py-3.5 px-5 bg-primary-container hover:bg-primary text-on-primary-container text-sm font-semibold uppercase tracking-wider rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span>Creating account...</span>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    </span>
                  ) : isLockedOut ? (
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Wait {lockoutRemaining}s
                    </span>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Google OAuth Button */}
            <div className="space-y-4 pt-2">
              <div className="relative text-center">
                <hr className="border-outline-subtle" />
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface-lowest px-3 text-xs text-secondary font-sans">
                  or continue with
                </span>
              </div>

              <GoogleButton
                onClick={handleGoogleSignUp}
                isLoading={isGoogleLoading}
                disabled={isSubmitting || isLockedOut}
                label="Continue with Google"
              />
            </div>

            {/* Switch to Sign In */}
            <div className="pt-2 text-center text-xs text-secondary">
              <span>Already have an account? </span>
              <button
                type="button"
                onClick={() => setActiveView('signin')}
                className="font-semibold text-primary hover:text-primary-container underline transition-colors ml-1 cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
