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

  // 1. Check for custom avatar in DB profiles table (both avatar_url and settings.custom_avatar)
  const dbCustomAvatar =
    (data?.avatar_url && data.avatar_url.trim()) ||
    ((data?.settings as any)?.custom_avatar && (data?.settings as any)?.custom_avatar.trim()) ||
    undefined;

  // 2. Check local custom avatar cache (keyed by userId or authEmail)
  let localCustomAvatar: string | undefined = undefined;
  let localAvatar: string | undefined = undefined;
  try {
    localCustomAvatar =
      localStorage.getItem(`planr_custom_avatar_${userId}`) ||
      (authEmail ? localStorage.getItem(`planr_custom_avatar_${authEmail.toLowerCase()}`) : null) ||
      undefined;
    localAvatar =
      localStorage.getItem(`planr_avatar_${userId}`) ||
      (authEmail ? localStorage.getItem(`planr_avatar_${authEmail.toLowerCase()}`) : null) ||
      undefined;
  } catch (e) {
    console.warn('Error reading local custom avatar fallback:', e);
  }

  // A custom avatar (from DB or local custom cache) ALWAYS beats the generic Google OAuth picture!
  // Only fall back to Google OAuth avatar (authAvatar) if the user has never set a custom avatar.
  const resolvedAvatar =
    dbCustomAvatar ||
    localCustomAvatar ||
    authAvatar ||
    localAvatar;

  // Keep local storage cache fresh
  if (resolvedAvatar) {
    try {
      if (dbCustomAvatar || localCustomAvatar) {
        localStorage.setItem(`planr_custom_avatar_${userId}`, resolvedAvatar);
        if (authEmail) {
          localStorage.setItem(`planr_custom_avatar_${authEmail.toLowerCase()}`, resolvedAvatar);
        }
      }
      localStorage.setItem(`planr_avatar_${userId}`, resolvedAvatar);
      if (authEmail) {
        localStorage.setItem(`planr_avatar_${authEmail.toLowerCase()}`, resolvedAvatar);
      }
    } catch {}
  }

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
      title: data.title || (data.settings as any)?.title || authTitle || 'Productivity User',
      tagline: data.tagline || (data.settings as any)?.tagline || authTagline || 'Simple Focus',
      email: data.email || authEmail || '',
      avatar: resolvedAvatar,
      isLoggedIn: true
    },
    settings: {
      ...DEFAULT_SETTINGS,
      ...(data.settings || {})
    },
    intention: data.intention || (data.settings as any)?.intention || ''
  };
}

export async function upsertUserProfileDb(
  userId: string,
  profileUpdates?: Partial<UserProfile>,
  settingsUpdates?: Partial<AppSettings>,
  intentionUpdate?: string
): Promise<boolean> {
  if (!isSupabaseConfigured() || !userId) return true;

  // 1. Cache to localStorage immediately for instant durability across OAuth logins
  if (profileUpdates && 'avatar' in profileUpdates) {
    try {
      if (profileUpdates.avatar) {
        localStorage.setItem(`planr_custom_avatar_${userId}`, profileUpdates.avatar);
        localStorage.setItem(`planr_avatar_${userId}`, profileUpdates.avatar);
        if (profileUpdates.email) {
          const lowerEmail = profileUpdates.email.toLowerCase();
          localStorage.setItem(`planr_custom_avatar_${lowerEmail}`, profileUpdates.avatar);
          localStorage.setItem(`planr_avatar_${lowerEmail}`, profileUpdates.avatar);
        }
      } else {
        localStorage.removeItem(`planr_custom_avatar_${userId}`);
        localStorage.removeItem(`planr_avatar_${userId}`);
        if (profileUpdates.email) {
          const lowerEmail = profileUpdates.email.toLowerCase();
          localStorage.removeItem(`planr_custom_avatar_${lowerEmail}`);
          localStorage.removeItem(`planr_avatar_${lowerEmail}`);
        }
      }
    } catch (cacheErr) {
      console.warn('Error caching avatar to localStorage:', cacheErr);
    }
  }

  // 2. Build strictly valid payload matching columns that exist in public.profiles:
  // (id, name, email, avatar_url, settings, updated_at)
  const mergedSettings = {
    ...DEFAULT_SETTINGS,
    ...(settingsUpdates || {}),
    ...(profileUpdates?.title !== undefined ? { title: profileUpdates.title } : {}),
    ...(profileUpdates?.tagline !== undefined ? { tagline: profileUpdates.tagline } : {}),
    ...(intentionUpdate !== undefined ? { intention: intentionUpdate } : {}),
    ...(profileUpdates && 'avatar' in profileUpdates
      ? { custom_avatar: profileUpdates.avatar || null, has_custom_avatar: Boolean(profileUpdates.avatar) }
      : {})
  };

  const payload: Record<string, any> = {
    id: userId,
    updated_at: new Date().toISOString(),
    settings: mergedSettings
  };

  if (profileUpdates?.name !== undefined) payload.name = profileUpdates.name;
  if (profileUpdates?.email !== undefined) payload.email = profileUpdates.email;
  if (profileUpdates && 'avatar' in profileUpdates) {
    payload.avatar_url = profileUpdates.avatar || null;
  }

  // 3. Build metadata updates for Supabase Auth
  const metaUpdates: Record<string, any> = {};
  if (profileUpdates?.name !== undefined) metaUpdates.name = profileUpdates.name;
  if (profileUpdates?.title !== undefined) metaUpdates.title = profileUpdates.title;
  if (profileUpdates?.tagline !== undefined) metaUpdates.tagline = profileUpdates.tagline;
  if (profileUpdates && 'avatar' in profileUpdates) {
    metaUpdates.avatar_url = profileUpdates.avatar || null;
    metaUpdates.picture = profileUpdates.avatar || null;
    metaUpdates.avatar = profileUpdates.avatar || null;
    metaUpdates.custom_avatar = profileUpdates.avatar || null;
    metaUpdates.has_custom_avatar = Boolean(profileUpdates.avatar);
  }

  // 4. Persist to Supabase profiles table and Supabase Auth concurrently in parallel
  const tasks: PromiseLike<any>[] = [
    supabase.from('profiles').upsert(payload)
  ];

  if (Object.keys(metaUpdates).length > 0) {
    tasks.push(supabase.auth.updateUser({ data: metaUpdates }));
  }

  try {
    const results = await Promise.allSettled(tasks.map((t) => Promise.resolve(t)));
    const profileResult = results[0];
    if (profileResult.status === 'rejected' || (profileResult.status === 'fulfilled' && profileResult.value?.error)) {
      console.warn('Upsert profile in Supabase warning:', profileResult);
    }
  } catch (err) {
    console.warn('Could not sync profile to remote Supabase:', err);
  }

  return true;
}
