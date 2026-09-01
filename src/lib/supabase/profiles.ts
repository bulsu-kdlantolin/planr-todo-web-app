import { supabase, isSupabaseConfigured } from './client';
import { UserProfile, AppSettings } from '../../types';

export interface DbProfileRow {
  id: string;
  name: string | null;
  email: string | null;
  title: string | null;
  tagline: string | null;
  avatar_url: string | null;
  intention: string | null;
  settings: AppSettings;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: '',
  title: 'Productivity User',
  tagline: 'Simple Focus',
  email: '',
  isLoggedIn: false
};

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  timeFormat: '12h',
  soundEffects: true,
  soundVolume: 0.5,
  focusDuration: 25,
  deepFocusDuration: 50,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  autoStartBreaks: false,
  notificationsEnabled: false
};

export async function fetchUserProfile(
  userId: string
): Promise<{ profile: UserProfile; settings: AppSettings; intention: string } | null> {
  if (!isSupabaseConfigured() || !userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user profile from Supabase:', error);
  }

  // Read metadata from current auth session to ensure avatar retrieval
  let authAvatar: string | undefined = undefined;
  let authName: string | undefined = undefined;
  let authTitle: string | undefined = undefined;
  let authTagline: string | undefined = undefined;
  let authEmail: string | undefined = undefined;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    if (user) {
      authEmail = user.email;
      const meta = user.user_metadata;
      if (meta) {
        authAvatar = meta.avatar_url || meta.picture || meta.avatar || undefined;
        authName = meta.name || meta.full_name;
        authTitle = meta.title;
        authTagline = meta.tagline;
      }
    }
  } catch (e) {
    console.warn('Error reading session user metadata:', e);
  }

  const resolvedAvatar = data?.avatar_url ?? authAvatar ?? undefined;

  if (!data) {
    if (authEmail) {
      return {
        profile: {
          name: authName || authEmail.split('@')[0] || 'User',
          title: authTitle || 'Productivity User',
          tagline: authTagline || 'Simple Focus',
          email: authEmail,
          avatar: resolvedAvatar,
          isLoggedIn: true
        },
        settings: DEFAULT_SETTINGS,
        intention: ''
      };
    }
    return null;
  }

  return {
    profile: {
      name: data.name || authName || '',
      title: data.title || authTitle || 'Productivity User',
      tagline: data.tagline || authTagline || 'Simple Focus',
      email: data.email || authEmail || '',
      avatar: resolvedAvatar,
      isLoggedIn: true
    },
    settings: {
      ...DEFAULT_SETTINGS,
      ...(data.settings || {})
    },
    intention: data.intention || ''
  };
}

export async function upsertUserProfileDb(
  userId: string,
  profileUpdates?: Partial<UserProfile>,
  settingsUpdates?: Partial<AppSettings>,
  intentionUpdate?: string
): Promise<boolean> {
  if (!isSupabaseConfigured() || !userId) return true;

  const payload: Record<string, any> = {
    id: userId,
    updated_at: new Date().toISOString()
  };

  if (profileUpdates) {
    if (profileUpdates.name !== undefined) payload.name = profileUpdates.name;
    if (profileUpdates.title !== undefined) payload.title = profileUpdates.title;
    if (profileUpdates.tagline !== undefined) payload.tagline = profileUpdates.tagline;
    if (profileUpdates.email !== undefined) payload.email = profileUpdates.email;
    if ('avatar' in profileUpdates) {
      payload.avatar_url = profileUpdates.avatar || null;
    }
  }
  if (intentionUpdate !== undefined) payload.intention = intentionUpdate;
  if (settingsUpdates !== undefined) payload.settings = settingsUpdates;

  // 1. Persist to Supabase profiles table
  const { error } = await supabase.from('profiles').upsert(payload);

  if (error) {
    console.error('Error upserting profile in Supabase profiles table:', error);
    // If the error was due to missing avatar_url column in an older database migration:
    if (payload.avatar_url && error.message?.toLowerCase().includes('avatar_url')) {
      const fallbackPayload = { ...payload };
      delete fallbackPayload.avatar_url;
      await supabase.from('profiles').upsert(fallbackPayload);
    }
  }

  // 2. Also persist to Supabase Auth user_metadata so avatar is dual-stored & survives reloads
  try {
    const metaUpdates: Record<string, any> = {};
    if (profileUpdates?.name !== undefined) metaUpdates.name = profileUpdates.name;
    if (profileUpdates?.title !== undefined) metaUpdates.title = profileUpdates.title;
    if (profileUpdates?.tagline !== undefined) metaUpdates.tagline = profileUpdates.tagline;
    if ('avatar' in (profileUpdates || {})) {
      metaUpdates.avatar_url = profileUpdates?.avatar || null;
      metaUpdates.picture = profileUpdates?.avatar || null;
      metaUpdates.avatar = profileUpdates?.avatar || null;
    }

    if (Object.keys(metaUpdates).length > 0) {
      await supabase.auth.updateUser({ data: metaUpdates });
    }
  } catch (authErr) {
    console.warn('Could not update user metadata in auth:', authErr);
  }

  return true;
}
