-- ==============================================================================
-- Planr — Supabase PostgreSQL Schema & Row-Level Security (RLS)
-- Optimized with Supabase Best Practices (Indexes, TO authenticated, search_path)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. Profiles Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100),
  email TEXT,
  title VARCHAR(100) DEFAULT 'Productivity User',
  tagline VARCHAR(200) DEFAULT 'Simple Focus',
  avatar_url TEXT,
  intention TEXT DEFAULT 'Focus on what truly moves the needle today.',
  settings JSONB NOT NULL DEFAULT '{
    "theme": "light",
    "timeFormat": "12h",
    "soundEffects": true,
    "soundVolume": 0.5,
    "focusDuration": 25,
    "deepFocusDuration": 50,
    "shortBreakDuration": 5,
    "longBreakDuration": 15,
    "autoStartBreaks": false,
    "notificationsEnabled": false,
    "shortcuts": {}
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 2. Tasks Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  due_date DATE,
  priority INT NOT NULL DEFAULT 2, -- 1=low, 2=medium, 3=high, 4=urgent
  duration_minutes INT NOT NULL DEFAULT 25,
  estimated_pomodoros INT NOT NULL DEFAULT 1,
  revision INT NOT NULL DEFAULT 1,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  subtasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  category TEXT NOT NULL DEFAULT 'Work',
  tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  deleted_at TIMESTAMPTZ
);

-- ------------------------------------------------------------------------------
-- 3. Reminders Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reminders (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  time TEXT NOT NULL, -- HH:MM (24h standard)
  period TEXT NOT NULL DEFAULT 'Morning',
  repeat TEXT NOT NULL DEFAULT 'Daily',
  scheduled_date DATE,
  sound BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN NOT NULL DEFAULT true,
  completed BOOLEAN NOT NULL DEFAULT false,
  description TEXT DEFAULT '',
  revision INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  deleted_at TIMESTAMPTZ
);

-- ------------------------------------------------------------------------------
-- 4. Focus Sessions Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id TEXT,
  task_title TEXT NOT NULL DEFAULT 'Deep Focus Session',
  duration_minutes INT NOT NULL DEFAULT 25,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  type TEXT NOT NULL DEFAULT 'focus', -- 'focus' | 'break'
  break_preset TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  deleted_at TIMESTAMPTZ
);

-- ------------------------------------------------------------------------------
-- 5. Daily Logs Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_count INT NOT NULL DEFAULT 0,
  focus_minutes INT NOT NULL DEFAULT 0,
  intention TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, date)
);

-- ------------------------------------------------------------------------------
-- 6. High-Performance Compound & Partial Indexes (Supabase Best Practices)
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_active ON public.tasks(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_user_due ON public.tasks(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_completed ON public.tasks(user_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON public.tasks(updated_at);
CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON public.tasks(deleted_at);

CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user_active ON public.reminders(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reminders_user_date ON public.reminders(user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_reminders_deleted_at ON public.reminders(deleted_at);

CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id ON public.focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_active ON public.focus_sessions(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_date ON public.focus_sessions(user_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_deleted_at ON public.focus_sessions(deleted_at);

CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON public.daily_logs(user_id, date);

-- ------------------------------------------------------------------------------
-- 7. Data API Grants (Least Privilege: anon has no direct table access)
-- ------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

-- ------------------------------------------------------------------------------
-- 8. Row Level Security (RLS) Policies (Using TO authenticated & (select auth.uid()))
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
CREATE POLICY "Users can delete their own profile"
  ON public.profiles FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = id);

-- Tasks Policies
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
CREATE POLICY "Users can view their own tasks"
  ON public.tasks FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own tasks" ON public.tasks;
CREATE POLICY "Users can insert their own tasks"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
CREATE POLICY "Users can update their own tasks"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;
CREATE POLICY "Users can delete their own tasks"
  ON public.tasks FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Reminders Policies
DROP POLICY IF EXISTS "Users can view their own reminders" ON public.reminders;
CREATE POLICY "Users can view their own reminders"
  ON public.reminders FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own reminders" ON public.reminders;
CREATE POLICY "Users can insert their own reminders"
  ON public.reminders FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own reminders" ON public.reminders;
CREATE POLICY "Users can update their own reminders"
  ON public.reminders FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own reminders" ON public.reminders;
CREATE POLICY "Users can delete their own reminders"
  ON public.reminders FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Focus Sessions Policies
DROP POLICY IF EXISTS "Users can view their own focus sessions" ON public.focus_sessions;
CREATE POLICY "Users can view their own focus sessions"
  ON public.focus_sessions FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own focus sessions" ON public.focus_sessions;
CREATE POLICY "Users can insert their own focus sessions"
  ON public.focus_sessions FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own focus sessions" ON public.focus_sessions;
CREATE POLICY "Users can update their own focus sessions"
  ON public.focus_sessions FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own focus sessions" ON public.focus_sessions;
CREATE POLICY "Users can delete their own focus sessions"
  ON public.focus_sessions FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Daily Logs Policies
DROP POLICY IF EXISTS "Users can view their own daily logs" ON public.daily_logs;
CREATE POLICY "Users can view their own daily logs"
  ON public.daily_logs FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own daily logs" ON public.daily_logs;
CREATE POLICY "Users can insert their own daily logs"
  ON public.daily_logs FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own daily logs" ON public.daily_logs;
CREATE POLICY "Users can update their own daily logs"
  ON public.daily_logs FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own daily logs" ON public.daily_logs;
CREATE POLICY "Users can delete their own daily logs"
  ON public.daily_logs FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ------------------------------------------------------------------------------
-- 9. Secure Profile Creation Trigger on Auth Signup (search_path protected)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 10. Automatic Updated-At Trigger (search_path protected)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS set_tasks_updated_at ON public.tasks;
CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_reminders_updated_at ON public.reminders;
CREATE TRIGGER set_reminders_updated_at
  BEFORE UPDATE ON public.reminders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
