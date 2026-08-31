import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUIStore } from '../store/useUIStore';
import { Logo } from '../components/common/Logo';
import { GoogleButton } from '../components/auth/GoogleButton';
import { OtpInput } from '../components/auth/OtpInput';
import {
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Clock,
  CheckCircle2,
  Send,
  RefreshCw
} from 'lucide-react';

type SignInMode = 'password' | 'link' | 'forgot_password';

export const SignInView: React.FC = () => {
  const {
    signInWithEmail,
    signInWithGoogle,
    sendEmailOtp,
    verifyEmailOtp,
    sendPasswordResetEmail,
    resendVerificationEmail,
    isLoading: authLoading
  } = useAuth();

  const setActiveView = useUIStore((state) => state.setActiveView);
  const showToast = useUIStore((state) => state.showToast);

  const [mode, setMode] = useState<SignInMode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [linkSent, setLinkSent] = useState(false);
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
    const cleanEmail = email.trim();
    if (!cleanEmail || !password || isSubmitting || lockoutRemaining > 0) return;

    if (!isValidEmail(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

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

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || isSubmitting) return;

    if (!isValidEmail(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const { error } = await sendEmailOtp(cleanEmail, false);
    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
    } else {
      setLinkSent(true);
      setResendCooldown(60);
      showToast(`Sign-in link sent to ${cleanEmail} ✉️`, 'info');
    }
  };

  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otpCode;
    const cleanEmail = email.trim();
    if (!cleanEmail || code.length !== 6 || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const { error } = await verifyEmailOtp(cleanEmail, code, 'email');
    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
    } else {
      showToast('Verified & Signed in! ☀️', 'success');
      setActiveView('daily');
    }
  };

  const handleSendPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || isSubmitting) return;

    if (!isValidEmail(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

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

      {/* Main Authentication Card */}
      <div className="w-full max-w-lg sm:max-w-xl bg-surface-lowest border border-outline-variant rounded-2xl p-8 sm:p-12 shadow-card space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-on-surface tracking-tight">
            {mode === 'forgot_password'
              ? 'Reset your password'
              : mode === 'link'
              ? 'Sign in with Email Link'
              : 'Welcome back'}
          </h1>
          <p className="text-sm text-secondary font-sans max-w-sm mx-auto">
            {mode === 'forgot_password'
              ? 'We will send a password reset link to your email address.'
              : mode === 'link'
              ? 'Enter your email to receive an instant sign-in link.'
              : 'Sign in to access your focused workspace and daily schedule.'}
          </p>
        </div>

        {/* Mode Switch Tabs */}
        {mode !== 'forgot_password' && (
          <div className="grid grid-cols-2 p-1 rounded-xl bg-surface-low border border-outline-subtle text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('password');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-lg transition-all ${
                mode === 'password'
                  ? 'bg-surface-lowest text-on-surface shadow-xs font-bold'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('link');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-lg transition-all ${
                mode === 'link'
                  ? 'bg-surface-lowest text-on-surface shadow-xs font-bold'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              Email Link
            </button>
          </div>
        )}

        {errorMessage && (
          <div
            role="alert"
            aria-live="polite"
            className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl space-y-2.5 text-red-800 dark:text-red-300 animate-fade-in"
          >
            <div className="flex items-center gap-2.5 text-xs font-semibold">
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
                  <RefreshCw className={`w-3 h-3 ${isSubmitting ? 'animate-spin' : ''}`} />
                  <span>
                    {resendCooldown > 0
                      ? `Resend available in ${resendCooldown}s`
                      : 'Resend Verification Email'}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* 1. Standard Password Sign In */}
        {mode === 'password' && (
          <form onSubmit={handlePasswordSignIn} className="space-y-4">
            <div>
              <label
                htmlFor="signin-email"
                className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-2 font-sans"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="w-4 h-4 text-secondary absolute left-4 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  id="signin-email"
                  type="email"
                  required
                  autoFocus
                  disabled={isSubmitting || isLockedOut}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="name@example.com"
                  className="w-full pl-11 pr-4 py-3 bg-surface-low border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-secondary/60 focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 focus:outline-none transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="signin-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-secondary font-sans"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot_password');
                    setErrorMessage(null);
                  }}
                  className="text-xs text-primary hover:text-primary-container hover:underline transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock
                  className="w-4 h-4 text-secondary absolute left-4 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  id="signin-password"
                  type="password"
                  required
                  disabled={isSubmitting || isLockedOut}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-surface-low border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-secondary/60 focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 focus:outline-none transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || authLoading || !email || !password || isLockedOut}
                className="w-full py-3.5 px-5 bg-primary-container hover:bg-primary text-on-primary-container text-sm font-semibold uppercase tracking-wider rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span>Signing In...</span>
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

        {/* 2. Email Link Sign In */}
        {mode === 'link' && (
          <div className="space-y-4">
            {!linkSent ? (
              <form onSubmit={handleSendLink} className="space-y-4">
                <div>
                  <label
                    htmlFor="signin-link-email"
                    className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-2 font-sans"
                  >
                    Your Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      className="w-4 h-4 text-secondary absolute left-4 top-1/2 -translate-y-1/2"
                      aria-hidden="true"
                    />
                    <input
                      id="signin-link-email"
                      type="email"
                      required
                      autoFocus
                      disabled={isSubmitting}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="name@example.com"
                      className="w-full pl-11 pr-4 py-3 bg-surface-low border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-secondary/60 focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !email}
                  className="w-full py-3.5 px-5 bg-primary-container hover:bg-primary text-on-primary-container text-sm font-semibold uppercase tracking-wider rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Sending Link...' : 'Send Sign-In Link'}</span>
                </button>
              </form>
            ) : (
              <div className="p-6 bg-surface-low rounded-xl border border-outline-subtle text-center space-y-4 animate-fade-in">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <div className="space-y-1.5">
                  <h3 className="font-serif text-lg font-semibold text-on-surface">Check your inbox</h3>
                  <p className="text-xs text-secondary max-w-sm mx-auto leading-relaxed">
                    We sent an instant sign-in link to <span className="font-semibold text-on-surface">{email}</span>. Click the link in your email to access your workspace.
                  </p>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLinkSent(false);
                      setErrorMessage(null);
                    }}
                    className="text-xs text-secondary hover:text-on-surface underline transition-colors cursor-pointer"
                  >
                    Use a different email address
                  </button>

                  {/* Optional OTP Code input fallback if their email includes a 6-digit token */}
                  <div className="pt-3 border-t border-outline-subtle/60 text-left space-y-2">
                    <span className="text-[11px] font-medium text-secondary">Received a 6-digit code instead?</span>
                    <OtpInput
                      value={otpCode}
                      onChange={setOtpCode}
                      onComplete={(code) => handleVerifyOtp(code)}
                      onResend={async () => {
                        await sendEmailOtp(email, false);
                      }}
                      disabled={isSubmitting}
                      isSubmitting={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. Password Reset Flow */}
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
                    setMode('password');
                    setResetSent(false);
                  }}
                  className="px-5 py-2 bg-surface-lowest hover:bg-surface border border-outline-variant text-xs font-semibold rounded-lg text-on-surface transition-colors cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendPasswordReset} className="space-y-4">
                <div>
                  <label
                    htmlFor="reset-email"
                    className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-2 font-sans"
                  >
                    Account Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      className="w-4 h-4 text-secondary absolute left-4 top-1/2 -translate-y-1/2"
                      aria-hidden="true"
                    />
                    <input
                      id="reset-email"
                      type="email"
                      required
                      autoFocus
                      disabled={isSubmitting}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="name@example.com"
                      className="w-full pl-11 pr-4 py-3 bg-surface-low border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-secondary/60 focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !email}
                    className="w-full py-3 px-5 bg-primary-container hover:bg-primary text-on-primary-container text-sm font-semibold uppercase tracking-wider rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{isSubmitting ? 'Sending Reset Link...' : 'Send Password Reset Link'}</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('password');
                      setErrorMessage(null);
                    }}
                    className="w-full text-center text-xs font-medium text-secondary hover:text-on-surface transition-colors py-1.5 cursor-pointer"
                  >
                    Cancel & Return to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Google OAuth Button */}
        {mode !== 'forgot_password' && (
          <div className="space-y-4 pt-2">
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
