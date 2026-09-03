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
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { triggerHapticFeedback, getFieldValidationClass } from '../utils/validation';

type SignInMode = 'signin' | 'forgot_password';

export const SignInView: React.FC = () => {
  const {
    signInWithEmail,
    signInWithGoogle,
    sendPasswordResetEmail,
    resendVerificationEmail,
    isLoading: authLoading
  } = useAuth();

  const setActiveView = useUIStore((state) => state.setActiveView);
  const showToast = useUIStore((state) => state.showToast);

  const [mode, setMode] = useState<SignInMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [resetSent, setResetSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Client-side rate limiting protection (4 attempts -> 30s cooldown)
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

  const handlePasswordSignIn = async (e: React.FormEvent) => {
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
      const nextFailures = failedAttempts + 1;
      setFailedAttempts(nextFailures);
      if (nextFailures >= 4) {
        setLockoutRemaining(30);
        setErrorMessage('Too many failed attempts. Please wait 30 seconds before trying again.');
      } else {
        setErrorMessage(error.message);
      }
    } else {
      setFailedAttempts(0);
      showToast('Signed in successfully! ☀️', 'success');
      setActiveView('daily');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    const { error } = await signInWithGoogle();
    setIsGoogleLoading(false);
    if (error) {
      setErrorMessage(error.message);
    }
  };

  const handleSendPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      triggerHapticFeedback();
      setFieldErrors({ email: 'Please enter your email address.' });
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      triggerHapticFeedback();
      setFieldErrors({ email: 'Please enter a valid email address.' });
      return;
    }

    // Check if this email is a known Google OAuth account
    const knownProvider = localStorage.getItem(`planr_oauth_provider_${cleanEmail.toLowerCase()}`);
    if (knownProvider === 'google') {
      triggerHapticFeedback();
      setErrorMessage('This account was registered using Google. Password reset is not available for Google accounts — please sign in with Google.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setFieldErrors({});

    const { error } = await sendPasswordResetEmail(cleanEmail);
    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
    } else {
      setResetSent(true);
      showToast('Password reset link sent! Check your inbox 📬', 'success');
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
  const isUnconfirmedEmail = errorMessage?.includes('not verified') || errorMessage?.includes('confirm your account');

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

      {/* Main Authentication Card with standard balanced width and spacing */}
      <div className="w-full max-w-md bg-surface-lowest border border-outline-variant rounded-2xl p-6 sm:p-8 shadow-card space-y-5">
        <div className="text-center space-y-1.5">
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-on-surface tracking-tight">
            {mode === 'forgot_password' ? 'Reset your password' : 'Welcome back'}
          </h1>
          <p className="text-xs sm:text-sm text-secondary font-sans max-w-xs mx-auto">
            {mode === 'forgot_password'
              ? 'We will send a password reset link to your email address.'
              : 'Sign in to access your focused workspace and daily schedule.'}
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            aria-live="polite"
            className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl space-y-2 text-red-800 dark:text-red-300 animate-fade-in"
          >
            <div className="flex items-center gap-2 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>

            {isUnconfirmedEmail && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={isSubmitting || resendCooldown > 0}
                  className="text-xs font-semibold underline hover:text-red-950 dark:hover:text-white inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-1.5">
                      <span>Resending verification email...</span>
                      <Loader2 className="w-3 h-3 animate-spin" />
                    </span>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3" />
                      <span>
                        {resendCooldown > 0
                          ? `Resend available in ${resendCooldown}s`
                          : 'Resend Verification Email'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* 1. Standard Email & Password Sign In Form */}
        {mode === 'signin' && (
          <form noValidate onSubmit={handlePasswordSignIn} className="space-y-4">
            <div>
              <label
                htmlFor="signin-email"
                className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5 font-sans"
              >
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail
                  className="z-10 w-4 h-4 text-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="signin-email"
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
                  className={`w-full pl-10 pr-4 py-2.5 sm:py-3 bg-surface-low border rounded-xl text-sm text-on-surface placeholder:text-secondary/60 focus:outline-none transition-all disabled:opacity-50 ${getFieldValidationClass(
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
                htmlFor="signin-password"
                className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5 font-sans"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock
                  className="z-10 w-4 h-4 text-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="signin-password"
                  type={showPassword ? 'text' : 'password'}
                  disabled={isSubmitting || isLockedOut}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-11 py-2.5 sm:py-3 bg-surface-low border rounded-xl text-sm text-on-surface placeholder:text-secondary/60 focus:outline-none transition-all disabled:opacity-50 ${getFieldValidationClass(
                    !!fieldErrors.password
                  )}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting || isLockedOut}
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

              {/* Forgot password anchor link placed directly below password input */}
              <div className="flex justify-end mt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot_password');
                    setErrorMessage(null);
                    setFieldErrors({});
                  }}
                  className="text-xs text-primary hover:text-primary-container hover:underline transition-colors cursor-pointer font-medium"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitting || authLoading || isLockedOut}
                className="w-full py-3 px-5 bg-primary-container hover:bg-primary text-on-primary-container text-sm font-semibold uppercase tracking-wider rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span>Signing in...</span>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  </span>
                ) : isLockedOut ? (
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Wait {lockoutRemaining}s
                  </span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* 2. Password Reset Request Flow */}
        {mode === 'forgot_password' && (
          <div className="space-y-4">
            {resetSent ? (
              <div className="p-6 bg-surface-low rounded-xl border border-outline-subtle text-center space-y-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <div className="space-y-1">
                  <h3 className="font-serif text-lg font-semibold text-on-surface">Reset Link Sent</h3>
                  <p className="text-xs text-secondary max-w-xs mx-auto">
                    We sent a password recovery link to <span className="font-semibold text-on-surface">{email}</span>. Click the link in your email to choose a new password.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setResetSent(false);
                    setFieldErrors({});
                  }}
                  className="px-5 py-2 bg-surface-lowest hover:bg-surface border border-outline-variant text-xs font-semibold rounded-lg text-on-surface transition-colors cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form noValidate onSubmit={handleSendPasswordReset} className="space-y-4">
                <div>
                  <label
                    htmlFor="reset-email"
                    className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5 font-sans"
                  >
                    Account Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail
                      className="z-10 w-4 h-4 text-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="reset-email"
                      type="email"
                      autoFocus
                      disabled={isSubmitting}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="name@example.com"
                      className={`w-full pl-10 pr-4 py-2.5 sm:py-3 bg-surface-low border rounded-xl text-sm text-on-surface placeholder:text-secondary/60 focus:outline-none transition-all ${getFieldValidationClass(
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

                <div className="space-y-2 pt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-5 bg-primary-container hover:bg-primary text-on-primary-container text-sm font-semibold uppercase tracking-wider rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span>Sending reset link...</span>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      </span>
                    ) : (
                      <>
                        <span>Send Password Reset Link</span>
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setErrorMessage(null);
                      setFieldErrors({});
                    }}
                    className="w-full py-2 text-center text-xs font-semibold text-secondary hover:text-on-surface transition-colors cursor-pointer"
                  >
                    Cancel and Return to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Google OAuth Button */}
        {mode !== 'forgot_password' && (
          <div className="space-y-3.5 pt-1">
            <div className="relative text-center">
              <hr className="border-outline-subtle" />
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface-lowest px-3 text-xs text-secondary font-sans">
                or continue with
              </span>
            </div>

            <GoogleButton
              onClick={handleGoogleSignIn}
              isLoading={isGoogleLoading}
              disabled={isSubmitting || isLockedOut}
            />
          </div>
        )}

        {/* Switch to Sign Up */}
        <div className="pt-2 text-center text-xs text-secondary">
          <span>Don't have an account? </span>
          <button
            type="button"
            onClick={() => setActiveView('signup')}
            className="font-semibold text-primary hover:text-primary-container underline transition-colors ml-1 cursor-pointer"
          >
            Create an account
          </button>
        </div>
      </div>
    </div>
  );
};
