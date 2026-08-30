import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { syncEngine, SyncStatus } from '../lib/db/syncEngine';
import { useMetaStore } from '../store/useMetaStore';
import { formatFriendlyAuthError } from '../utils/errors';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  isOnline: boolean;
  syncStatus: SyncStatus;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<{ error: Error | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  syncNow: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

  const updateUserMeta = useMetaStore((state) => state.updateUser);
  const isConfigured = isSupabaseConfigured();

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (user?.id) syncEngine.syncAll(user.id);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user?.id]);

  // Subscribe to sync status
  useEffect(() => {
    const unsubscribe = syncEngine.subscribe(setSyncStatus);
    return () => unsubscribe();
  }, []);

  // Supabase Auth State Listener
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
        updateUserMeta({
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          isLoggedIn: true
        });
        syncEngine.syncAll(session.user.id);
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        updateUserMeta({
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          isLoggedIn: true
        });
        syncEngine.syncAll(session.user.id);
      } else {
        updateUserMeta({ isLoggedIn: false });
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isConfigured, updateUserMeta]);

  const signInWithEmail = async (email: string, password: string) => {
    if (!isConfigured) {
      // Local fallback
      updateUserMeta({
        email,
        name: email.split('@')[0] || 'User',
        isLoggedIn: true
      });
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { error: new Error(formatFriendlyAuthError(error)) };
      }
      return { error: null };
    } catch (err: any) {
      return { error: new Error(formatFriendlyAuthError(err)) };
    }
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    if (!isConfigured) {
      // Local fallback
      updateUserMeta({
        email,
        name: name || email.split('@')[0] || 'User',
        isLoggedIn: true
      });
      return { error: null };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name: name || email.split('@')[0] }
        }
      });
      if (error) {
        return { error: new Error(formatFriendlyAuthError(error)) };
      }

      if (data?.user) {
        updateUserMeta({
          email: data.user.email || email,
          name: name || data.user.user_metadata?.name || email.split('@')[0] || 'User',
          isLoggedIn: true
        });
        if (data.session) {
          setSession(data.session);
          setUser(data.user);
          syncEngine.syncAll(data.user.id);
        }
      }
      return { error: null };
    } catch (err: any) {
      return { error: new Error(formatFriendlyAuthError(err)) };
    }
  };

  const signInWithMagicLink = async (email: string) => {
    if (!isConfigured) {
      updateUserMeta({ email, isLoggedIn: true });
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signOut = async () => {
    if (isConfigured) {
      await supabase.auth.signOut();
    }
    updateUserMeta({ isLoggedIn: false });
    setUser(null);
    setSession(null);
    return { error: null };
  };

  const syncNow = async () => {
    if (user?.id) {
      await syncEngine.syncAll(user.id);
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
        syncStatus,
        signInWithEmail,
        signUpWithEmail,
        signInWithMagicLink,
        signOut,
        syncNow
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
