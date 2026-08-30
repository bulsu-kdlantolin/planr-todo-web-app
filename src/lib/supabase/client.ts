import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read configuration strictly from Vite environment variables (.env / Vercel env)
let rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
if (rawUrl.endsWith('/rest/v1') || rawUrl.endsWith('/rest/v1/')) {
  rawUrl = rawUrl.replace(/\/rest\/v1\/?$/, '');
}
if (rawUrl.endsWith('/')) {
  rawUrl = rawUrl.slice(0, -1);
}

const supabaseUrl = rawUrl;
const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  ''
).trim();

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    supabaseAnonKey !== 'your-anon-key' &&
    supabaseAnonKey !== 'placeholder-key'
  );
};

// Create the Supabase client safely with fallback for unconfigured environments
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);
