import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { useMetaStore } from '../store/useMetaStore';
import { useTaskStore } from '../store/useTaskStore';
import { useReminderStore } from '../store/useReminderStore';
import { useTimerStore } from '../store/useTimerStore';
import { fetchUserProfile } from '../lib/supabase/profiles';
import { fetchUserTasks } from '../lib/supabase/tasks';
import { fetchUserReminders } from '../lib/supabase/reminders';
import { fetchUserFocusSessions } from '../lib/supabase/focus';
import { subscribeToUserRealtime, unsubscribeFromUserRealtime } from '../lib/supabase/realtime';
import { formatFriendlyAuthError } from '../utils/errors';

export type OtpVerificationType = 'email' | 'signup' | 'recovery' | 'magiclink';

export interface SignUpResult {
  error: Error | null;
  needsEmailConfirmation?: boolean;
  isExistingUnconfirmed?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  isOnline: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<SignUpResult>;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  sendEmailOtp: (email: string, isSignUp?: boolean) => Promise<{ error: Error | null }>;
  verifyEmailOtp: (email: string, token: string, type?: OtpVerificationType) => Promise<{ error: Error | null }>;
  resendVerificationEmail: (email: string) => Promise<{ error: Error | null }>;
  sendPasswordResetEmail: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  signOut: (scope?: 'local' | 'global') => Promise<{ error: Error | null }>;
  refreshData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const isConfigured = isSupabaseConfigured();
  const [isLoading, setIsLoading] = useState(isConfigured);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const updateUserMeta = useMetaStore((state) => state.updateUser);
  const setMetaUser = useMetaStore((state) => state.setUser);
  const setSettings = useMetaStore((state) => state.setSettings);
  const setIntention = useMetaStore((state) => state.setIntention);
  const setTasks = useTaskStore((state) => state.setTasks);
  const setReminders = useReminderStore((state) => state.setReminders);
  const setFocusSessions = useTimerStore((state) => state.setFocusSessions);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const hydrateUserData = async (userId: string, currentSessionUser: User) => {
    try {
      // Record Google provider to prevent unauthorized password resets on passwordless accounts
      const isGoogle =
        currentSessionUser.app_metadata?.provider === 'google' ||
        currentSessionUser.app_metadata?.providers?.includes('google') ||
        currentSessionUser.identities?.some((id: any) => id.provider === 'google');
      if (isGoogle && currentSessionUser.email) {
        try {
          localStorage.setItem(`planr_oauth_provider_${currentSessionUser.email.toLowerCase()}`, 'google');
        } catch {}
      }

      // Record if this user has established a password
      if (currentSessionUser.user_metadata?.has_password) {
        try {
          localStorage.setItem(`planr_has_password_${userId}`, 'true');
          if (currentSessionUser.email) {
            localStorage.setItem(`planr_has_password_${currentSessionUser.email.toLowerCase()}`, 'true');
          }
        } catch {}
      }

      // Check localStorage fallback for profile avatar
      let localAvatar: string | undefined = undefined;
      try {
        localAvatar =
          localStorage.getItem(`planr_avatar_${userId}`) ||
          (currentSessionUser.email ? localStorage.getItem(`planr_avatar_${currentSessionUser.email.toLowerCase()}`) : null) ||
          undefined;
      } catch {}

      const [profileData, tasks, reminders, focusSessions] = await Promise.all([
        fetchUserProfile(userId),
        fetchUserTasks(userId),
        fetchUserReminders(userId),
        fetchUserFocusSessions(userId)
      ]);

      const meta = currentSessionUser.user_metadata;
      // Custom avatar explicitly set by user MUST take precedence over Google's OAuth avatar!
      const customAvatar =
        profileData?.profile?.avatar ||
        (profileData?.settings as any)?.custom_avatar ||
        localStorage.getItem(`planr_custom_avatar_${userId}`) ||
        (currentSessionUser.email ? localStorage.getItem(`planr_custom_avatar_${currentSessionUser.email.toLowerCase()}`) : null);

      const resolvedAvatar =
        customAvatar ||
        meta?.avatar_url ||
        meta?.picture ||
        meta?.avatar ||
        localAvatar;

      if (resolvedAvatar) {
        try {
          if (customAvatar) {
            localStorage.setItem(`planr_custom_avatar_${userId}`, resolvedAvatar);
            if (currentSessionUser.email) {
              localStorage.setItem(`planr_custom_avatar_${currentSessionUser.email.toLowerCase()}`, resolvedAvatar);
            }
          }
          localStorage.setItem(`planr_avatar_${userId}`, resolvedAvatar);
          if (currentSessionUser.email) {
            localStorage.setItem(`planr_avatar_${currentSessionUser.email.toLowerCase()}`, resolvedAvatar);
          }
        } catch {}
      }

      if (profileData) {
        setMetaUser({
          ...profileData.profile,
          avatar: resolvedAvatar,
          email: currentSessionUser.email || profileData.profile.email,
          isLoggedIn: true
        });
        if (profileData.settings) {
          setSettings({
            ...useMetaStore.getState().settings,
            ...profileData.settings
          });
        }
        setIntention(profileData.intention);
      } else {
        setMetaUser({
          name:
            meta?.name ||
            meta?.full_name ||
            currentSessionUser.email?.split('@')[0] ||
            'User',
          title: meta?.title || 'Productivity User',
          tagline: meta?.tagline || 'Simple Focus',
          email: currentSessionUser.email || '',
          avatar: resolvedAvatar,
          isLoggedIn: true
        });
      }

      setTasks(tasks);
      setReminders(reminders);
      setFocusSessions(focusSessions);

      subscribeToUserRealtime(userId);
    } catch (err) {
      console.error('Failed to hydrate user cloud data:', err);
    }
  };

  // Auth State Listener
  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        hydrateUserData(session.user.id, session.user);
      }
      setIsLoading(false);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') {
        window.location.hash = 'reset-password';
      } else if (event === 'SIGNED_IN') {
        if (window.location.hash.includes('access_token=')) {
          window.location.hash = 'daily';
        }
      }

      if (session?.user) {
        hydrateUserData(session.user.id, session.user);
      } else if (event === 'SIGNED_OUT') {
        unsubscribeFromUserRealtime();
        setMetaUser({
          name: '',
          title: '',
          tagline: '',
          email: '',
          isLoggedIn: false
        });
        setTasks([]);
        setReminders([]);
        setFocusSessions([]);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      unsubscribeFromUserRealtime();
    };
  }, [isConfigured]);

  const signInWithEmail = async (email: string, password: string) => {
    const trimmedEmail = email.trim();
    if (!isConfigured) {
      updateUserMeta({
        email: trimmedEmail,
        name: trimmedEmail.split('@')[0] || 'User',
        isLoggedIn: true
      });
      return { error: null };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: trimmedEmail, 
        password 
      });
      if (error) {
        return { error: new Error(formatFriendlyAuthError(error)) };
      }
      
      if (data.user) {
        if (data.user.email) {
          try {
            localStorage.setItem(`planr_has_password_${data.user.email.toLowerCase()}`, 'true');
          } catch {}
        }
        await hydrateUserData(data.user.id, data.user);
      }
      
      return { error: null };
    } catch (err: any) {
      return { error: new Error(formatFriendlyAuthError(err)) };
    }
  };

  const signUpWithEmail = async (email: string, password: string, name?: string): Promise<SignUpResult> => {
    const trimmedEmail = email.trim();
    if (!isConfigured) {
      updateUserMeta({
        email: trimmedEmail,
        name: name || trimmedEmail.split('@')[0] || 'User',
        isLoggedIn: true
      });
      return { error: null, needsEmailConfirmation: false };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: { name: name || trimmedEmail.split('@')[0], has_password: true },
          emailRedirectTo: window.location.origin
        }
      });

      if (error) {
        return { error: new Error(formatFriendlyAuthError(error)) };
      }

      if (trimmedEmail) {
        try {
          localStorage.setItem(`planr_has_password_${trimmedEmail.toLowerCase()}`, 'true');
        } catch {}
      }

      if (data.user && data.user.identities && data.user.identities.length === 0) {
        return { error: null, isExistingUnconfirmed: true };
      }

      const needsConfirmation = !data.session;
      if (data.user && data.session) {
        await hydrateUserData(data.user.id, data.user);
      }

      return { error: null, needsEmailConfirmation: needsConfirmation };
    } catch (err: any) {
      return { error: new Error(formatFriendlyAuthError(err)) };
    }
  };

  const signInWithGoogle = async () => {
    if (!isConfigured) {
      updateUserMeta({
        name: 'Google User',
        email: 'user@gmail.com',
        isLoggedIn: true
      });
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) {
        return { error: new Error(formatFriendlyAuthError(error)) };
      }
      return { error: null };
    } catch (err: any) {
      return { error: new Error(formatFriendlyAuthError(err)) };
    }
  };

  const sendEmailOtp = async (email: string, isSignUp = false) => {
    const trimmedEmail = email.trim();
    if (!isConfigured) {
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          shouldCreateUser: isSignUp,
          emailRedirectTo: window.location.origin
        }
      });
      if (error) {
        return { error: new Error(formatFriendlyAuthError(error)) };
      }
      return { error: null };
    } catch (err: any) {
      return { error: new Error(formatFriendlyAuthError(err)) };
    }
  };

  const verifyEmailOtp = async (
    email: string,
    token: string,
    type: OtpVerificationType = 'email'
  ) => {
    const trimmedEmail = email.trim();
    const trimmedToken = token.trim();
    
    if (!isConfigured) {
      updateUserMeta({
        email: trimmedEmail,
        name: trimmedEmail.split('@')[0] || 'User',
        isLoggedIn: true
      });
      return { error: null };
    }

    try {
      let otpType: 'signup' | 'recovery' | 'magiclink' | 'email' = 'email';
      if (type === 'signup') otpType = 'signup';
      else if (type === 'recovery') otpType = 'recovery';
      else if (type === 'magiclink') otpType = 'magiclink';

      const { data, error } = await supabase.auth.verifyOtp({
        email: trimmedEmail,
        token: trimmedToken,
        type: otpType
      });

      if (error) {
        return { error: new Error(formatFriendlyAuthError(error)) };
      }

      if (data.user) {
        await hydrateUserData(data.user.id, data.user);
      }
      
      return { error: null };
    } catch (err: any) {
      return { error: new Error(formatFriendlyAuthError(err)) };
    }
  };

  const resendVerificationEmail = async (email: string) => {
    const trimmedEmail = email.trim();
    if (!isConfigured) return { error: null };

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: trimmedEmail,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      if (error) {
        return { error: new Error(formatFriendlyAuthError(error)) };
      }
      return { error: null };
    } catch (err: any) {
      return { error: new Error(formatFriendlyAuthError(err)) };
    }
  };

  const sendPasswordResetEmail = async (email: string) => {
    const trimmedEmail = email.trim();

    // Check if account was created using Google OAuth and does not have a password set
    const knownProvider = localStorage.getItem(`planr_oauth_provider_${trimmedEmail.toLowerCase()}`);
    const hasPassword = localStorage.getItem(`planr_has_password_${trimmedEmail.toLowerCase()}`) === 'true';
    if (knownProvider === 'google' && !hasPassword) {
      return {
        error: new Error('This account was registered using Google and does not have a password set. Password reset is not permitted — please sign in with Google, or set a password in Settings once signed in.')
      };
    }

    if (!isConfigured) {
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: window.location.origin
      });
      if (error) {
        return { error: new Error(formatFriendlyAuthError(error)) };
      }
      return { error: null };
    } catch (err: any) {
      return { error: new Error(formatFriendlyAuthError(err)) };
    }
  };

  const updatePassword = async (newPassword: string) => {
    if (!isConfigured) {
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
        data: {
          has_password: true
        }
      });
      if (error) {
        return { error: new Error(formatFriendlyAuthError(error)) };
      }
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
      return { error: null };
    } catch (err: any) {
      return { error: new Error(formatFriendlyAuthError(err)) };
    }
  };

  const signInWithMagicLink = async (email: string) => {
    const trimmedEmail = email.trim();
    if (!isConfigured) {
      updateUserMeta({ email: trimmedEmail, isLoggedIn: true });
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      return { error: error ? new Error(formatFriendlyAuthError(error)) : null };
    } catch (err: any) {
      return { error: new Error(formatFriendlyAuthError(err)) };
    }
  };

  const signOut = async (scope: 'local' | 'global' = 'local') => {
    unsubscribeFromUserRealtime();
    if (isConfigured) {
      await supabase.auth.signOut({ scope });
    }
    setMetaUser({
      name: '',
      title: '',
      tagline: '',
      email: '',
      isLoggedIn: false
    });
    setTasks([]);
    setReminders([]);
    setFocusSessions([]);
    setUser(null);
    setSession(null);
    return { error: null };
  };

  const refreshData = async () => {
    if (user?.id) {
      await hydrateUserData(user.id, user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isConfigured,
        isOnline,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        sendEmailOtp,
        verifyEmailOtp,
        resendVerificationEmail,
        sendPasswordResetEmail,
        updatePassword,
        signInWithMagicLink,
        signOut,
        refreshData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
