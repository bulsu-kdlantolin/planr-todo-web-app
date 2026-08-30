import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUIStore } from '../store/useUIStore';
import { useMetaStore } from '../store/useMetaStore';
import { Logo } from '../components/common/Logo';
import { Mail, Lock, ArrowRight, AlertCircle, Clock } from 'lucide-react';

export const SignUpView: React.FC = () => {
  const { signUpWithEmail, isLoading: authLoading } = useAuth();
  const setActiveView = useUIStore((state) => state.setActiveView);
  const showToast = useUIStore((state) => state.showToast);
  const updateUser = useMetaStore((state) => state.updateUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Client-side rate limiting protection (3 attempts -> 30s cooldown)
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const timer = setInterval(() => {
      setLockoutRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutRemaining]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || isSubmitting || lockoutRemaining > 0) return;

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const defaultName = email.split('@')[0];
    const formattedName = defaultName.charAt(0).toUpperCase() + defaultName.slice(1);

    const { error } = await signUpWithEmail(email, password, formattedName);
    setIsSubmitting(false);

    if (error) {
      const nextFailures = failedAttempts + 1;
      setFailedAttempts(nextFailures);
      if (nextFailures >= 3) {
        setLockoutRemaining(30);
        setErrorMessage('Too many registration attempts. Please wait 30 seconds before retrying.');
      } else {
        setErrorMessage(error.message);
      }
    } else {
      setFailedAttempts(0);
      await updateUser({
        name: formattedName,
        email,
        isLoggedIn: true
      });
      showToast('Account created! Set up your profile 🌿', 'success');
      setActiveView('onboarding');
    }
  };

  const handleContinueOffline = async () => {
    const defaultName = email ? email.split('@')[0] : 'User';
    const formattedName = defaultName.charAt(0).toUpperCase() + defaultName.slice(1);
    await updateUser({
      name: formattedName,
      email: email || 'local@planr.app',
      isLoggedIn: true
    });
    showToast('Entered workspace in private local mode 🌿', 'info');
    setActiveView('onboarding');
  };

  const isLockedOut = lockoutRemaining > 0;

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center px-4 sm:px-6 py-12 animate-fade-in">
      {/* Brand Header */}
      <div className="mb-8 text-center flex flex-col items-center">
        <button
          type="button"
          onClick={() => setActiveView('landing')}
          className="hover:opacity-80 transition-opacity"
          aria-label="Return to landing page"
        >
          <Logo size="lg" />
        </button>
      </div>

      {/* Main Sign Up Card */}
      <div className="w-full max-w-lg sm:max-w-xl bg-surface-lowest border border-outline-variant rounded-2xl p-8 sm:p-12 shadow-card space-y-7">
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
            className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl space-y-2 text-red-800 dark:text-red-300 animate-fade-in"
          >
            <div className="flex items-center gap-2.5 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
            {(errorMessage.includes('Unable to reach') || errorMessage.includes('local mode') || errorMessage.includes('rate limit') || isLockedOut) && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleContinueOffline}
                  className="text-xs font-semibold underline hover:text-red-950 dark:hover:text-white inline-flex items-center gap-1"
                >
                  <span>Continue with your local workspace &rarr;</span>
                </button>
              </div>
            )}
            {errorMessage.includes('already exists') && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setActiveView('signin')}
                  className="text-xs font-semibold underline hover:text-red-950 dark:hover:text-white inline-flex items-center gap-1"
                >
                  <span>Sign in to your account &rarr;</span>
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-5">
          <div>
            <label htmlFor="signup-email" className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-2 font-sans">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-secondary absolute left-4 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                id="signup-email"
                type="email"
                required
                autoFocus
                disabled={isLockedOut}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage && !isLockedOut) setErrorMessage(null);
                }}
                placeholder="you@example.com"
                className="w-full pl-11 pr-4 py-3 bg-surface-low border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-secondary/60 focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 focus:outline-none transition-all disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label htmlFor="signup-password" className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-2 font-sans">
              Password (min. 6 characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-secondary absolute left-4 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                id="signup-password"
                type="password"
                required
                disabled={isLockedOut}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage && !isLockedOut) setErrorMessage(null);
                }}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-surface-low border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-secondary/60 focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 focus:outline-none transition-all disabled:opacity-60"
              />
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <button
              type="submit"
              disabled={isSubmitting || authLoading || isLockedOut}
              className="w-full py-3 px-5 bg-primary-container hover:bg-primary text-on-primary-container text-sm font-semibold uppercase tracking-wider rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLockedOut ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Retry in {lockoutRemaining}s</span>
                </>
              ) : isSubmitting ? (
                <span>Creating account...</span>
              ) : (
                <>
                  <span>Create Account & Continue</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleContinueOffline}
              className="w-full py-2.5 px-4 bg-surface-low hover:bg-surface-high border border-outline-variant text-on-surface text-xs font-semibold uppercase tracking-wider rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>Continue in Private Local Mode</span>
            </button>
          </div>
        </form>

        {/* Switch to Sign In */}
        <div className="pt-2 text-center text-xs text-secondary">
          <span>Already have an account? </span>
          <button
            type="button"
            onClick={() => setActiveView('signin')}
            className="font-semibold text-primary hover:text-primary-container underline transition-colors ml-1"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};
