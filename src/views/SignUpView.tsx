import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUIStore } from '../store/useUIStore';
import { Logo } from '../components/common/Logo';
import { GoogleButton } from '../components/auth/GoogleButton';
import { OtpInput } from '../components/auth/OtpInput';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Clock,
  CheckCircle2,
  Send,
  MailCheck,
  RefreshCw
} from 'lucide-react';

type SignUpMode = 'password' | 'link';

export const SignUpView: React.FC = () => {
  const {
    signUpWithEmail,
    signInWithGoogle,
    sendEmailOtp,
    verifyEmailOtp,
    resendVerificationEmail,
    isLoading: authLoading
  } = useAuth();

  const setActiveView = useUIStore((state) => state.setActiveView);
  const showToast = useUIStore((state) => state.showToast);

  const [mode, setMode] = useState<SignUpMode>('password');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [linkSent, setLinkSent] = useState(false);
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

  const handlePasswordSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password || isSubmitting || lockoutRemaining > 0) return;

    if (!isValidEmail(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await signUpWithEmail(cleanEmail, password, name.trim() || undefined);
    setIsSubmitting(false);

    if (result.error) {
      const nextFailures = failedAttempts + 1;
      setFailedAttempts(nextFailures);
      if (nextFailures >= 4) {
        setLockoutRemaining(30);
        setErrorMessage('Too many attempts. Please wait 30 seconds before trying again.');
      } else {
        setErrorMessage(result.error.message);
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

    const { error } = await sendEmailOtp(cleanEmail, true);
    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
    } else {
      setLinkSent(true);
      setResendCooldown(60);
      showToast(`Verification link sent to ${cleanEmail} ✉️`, 'info');
    }
  };

  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otpCode;
    const cleanEmail = email.trim();
    if (!cleanEmail || code.length !== 6 || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const { error } = await verifyEmailOtp(cleanEmail, code, 'signup');
    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
    } else {
      showToast('Email verified! Welcome to Planr 🌿', 'success');
      setActiveView('onboarding');
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
                <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                <span>
                  {resendCooldown > 0
                    ? `Resend available in ${resendCooldown}s`
                    : 'Resend Verification Email'}
                </span>
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

            {/* Mode Switch Tabs */}
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

            {/* 1. Standard Password Sign Up */}
            {mode === 'password' && (
              <form onSubmit={handlePasswordSignUp} className="space-y-4">
                <div>
                  <label
                    htmlFor="signup-name"
                    className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-2 font-sans"
                  >
                    Full Name / Preferred Name
                  </label>
                  <div className="relative">
                    <User
                      className="w-4 h-4 text-secondary absolute left-4 top-1/2 -translate-y-1/2"
                      aria-hidden="true"
                    />
                    <input
                      id="signup-name"
                      type="text"
                      autoFocus
                      disabled={isSubmitting || isLockedOut}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="w-full pl-11 pr-4 py-3 bg-surface-low border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-secondary/60 focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 focus:outline-none transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="signup-email"
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
                      id="signup-email"
                      type="email"
                      required
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
                  <label
                    htmlFor="signup-password"
                    className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-2 font-sans"
                  >
                    Create Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="w-4 h-4 text-secondary absolute left-4 top-1/2 -translate-y-1/2"
                      aria-hidden="true"
                    />
                    <input
                      id="signup-password"
                      type="password"
                      required
                      disabled={isSubmitting || isLockedOut}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="At least 6 characters"
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
                      <span>Creating Account...</span>
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
            )}

            {/* 2. Email Link / Verification Sign Up */}
            {mode === 'link' && (
              <div className="space-y-4">
                {!linkSent ? (
                  <form onSubmit={handleSendLink} className="space-y-4">
                    <div>
                      <label
                        htmlFor="signup-link-email"
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
                          id="signup-link-email"
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
                      <span>{isSubmitting ? 'Sending Link...' : 'Send Sign-Up Link'}</span>
                    </button>
                  </form>
                ) : (
                  <div className="p-6 bg-surface-low rounded-xl border border-outline-subtle text-center space-y-4 animate-fade-in">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
                    <div className="space-y-1.5">
                      <h3 className="font-serif text-lg font-semibold text-on-surface">Check your inbox</h3>
                      <p className="text-xs text-secondary max-w-sm mx-auto leading-relaxed">
                        We sent a secure verification link to <span className="font-semibold text-on-surface">{email}</span>. Click the link in your email to activate and sign in automatically.
                      </p>
                    </div>

                    <div className="pt-2 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setLinkSent(false);
                          setErrorMessage(null);
                        }}
                        className="text-xs text-secondary hover:text-on-surface underline transition-colors"
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
                            await sendEmailOtp(email, true);
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

            {/* Google OAuth Button */}
            <div className="space-y-4 pt-2">
              <div className="relative text-center">
                <hr className="border-outline-subtle" />
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface-lowest px-3 text-xs text-secondary font-sans">
                  or sign up with
                </span>
              </div>

              <GoogleButton
                onClick={handleGoogleSignUp}
                isLoading={isGoogleLoading}
                disabled={isSubmitting || isLockedOut}
                label="Sign Up with Google"
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
