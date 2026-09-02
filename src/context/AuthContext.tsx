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
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const updateUserMeta = useMetaStore((state) => state.updateUser);
  const setMetaUser = useMetaStore((state) => state.setUser);
  const setSettings = useMetaStore((state) => state.setSettings);
  const setIntention = useMetaStore((state) => state.setIntention);
  const setTasks = useTaskStore((state) => state.setTasks);
  const setReminders = useReminderStore((state) => state.setReminders);
  const setFocusSessions = useTimerStore((state) => state.setFocusSessions);

  const isConfigured = isSupabaseConfigured();

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
      const [profileData, tasks, reminders, focusSessions] = await Promise.all([
        fetchUserProfile(userId),
        fetchUserTasks(userId),
        fetchUserReminders(userId),
        fetchUserFocusSessions(userId)
      ]);

      if (profileData) {
        setMetaUser({
          ...profileData.profile,
          email: currentSessionUser.email || profileData.profile.email,
          isLoggedIn: true
        });
        setSettings(profileData.settings);
        setIntention(profileData.intention);
      } else {
        const meta = currentSessionUser.user_metadata;
        setMetaUser({
          name:
            meta?.name ||
            meta?.full_name ||
            currentSessionUser.email?.split('@')[0] ||
            'User',
          title: meta?.title || 'Productivity User',
          tagline: meta?.tagline || 'Simple Focus',
          email: currentSessionUser.email || '',
          avatar: meta?.avatar_url || meta?.picture || meta?.avatar || undefined,
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
      setUser(session?.user ?? null);

      if (event === 'PASSWORD_RECOVERY') {
        window.location.hash = '#reset-password';
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
          data: { name: name || trimmedEmail.split('@')[0] },
          emailRedirectTo: window.location.origin
        }
      });

      if (error) {
        return { error: new Error(formatFriendlyAuthError(error)) };
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
        email: 'google.user@planr.app',
        name: 'Google User',
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
    if (!isConfigured) {
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/#reset-password`
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
        password: newPassword
      });
      if (error) {
        return { error: new Error(formatFriendlyAuthError(error)) };
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
