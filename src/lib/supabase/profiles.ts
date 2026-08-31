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
    return null;
  }

  if (!data) return null;

  return {
    profile: {
      name: data.name || '',
      title: data.title || 'Productivity User',
      tagline: data.tagline || 'Simple Focus',
      email: data.email || '',
      avatar: data.avatar_url || undefined,
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

  const payload: any = {
    id: userId,
    updated_at: new Date().toISOString()
  };

  if (profileUpdates?.name !== undefined) payload.name = profileUpdates.name;
  if (profileUpdates?.title !== undefined) payload.title = profileUpdates.title;
  if (profileUpdates?.tagline !== undefined) payload.tagline = profileUpdates.tagline;
  if (profileUpdates?.email !== undefined) payload.email = profileUpdates.email;
  if (profileUpdates?.avatar !== undefined) payload.avatar_url = profileUpdates.avatar;
  if (intentionUpdate !== undefined) payload.intention = intentionUpdate;
  if (settingsUpdates !== undefined) payload.settings = settingsUpdates;

  const { error } = await supabase.from('profiles').upsert(payload);

  if (error) {
    console.error('Error upserting profile in Supabase:', error);
    return false;
  }
  return true;
}
