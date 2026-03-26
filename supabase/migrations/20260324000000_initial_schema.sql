-- ============================================================
-- Briefd — Initial Schema Migration
-- ============================================================
-- Extends Supabase auth.users with app-level tables.
-- Run via: supabase db push  OR  supabase migration up
-- ============================================================

-- Enable UUID extension (already enabled in Supabase by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS
-- Public profile that mirrors auth.users (1-to-1).
-- Created automatically via trigger on auth.users insert.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Mirror new auth users into public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- DIGEST PROFILES
-- Top-level preferences for a user's digest.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.digest_profiles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL DEFAULT 'My Morning Briefing',
  timezone      TEXT NOT NULL DEFAULT 'America/New_York',
  -- Tone options: 'concise' | 'detailed' | 'casual' | 'formal'
  tone          TEXT NOT NULL DEFAULT 'concise' CHECK (tone IN ('concise', 'detailed', 'casual', 'formal')),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)  -- one digest profile per user (can expand later)
);

CREATE TRIGGER digest_profiles_updated_at
  BEFORE UPDATE ON public.digest_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- DIGEST SECTIONS
-- Ordered list of content blocks in a user's digest.
-- Each row is one "module" (weather, news, calendar, etc.).
-- ============================================================
CREATE TYPE public.section_type AS ENUM (
  'weather',
  'news',
  'calendar',
  'tasks',
  'stocks',
  'quote',
  'sports',
  'custom'
);

CREATE TABLE IF NOT EXISTS public.digest_sections (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  digest_profile_id UUID NOT NULL REFERENCES public.digest_profiles(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  section_type    public.section_type NOT NULL,
  title           TEXT,                   -- optional custom label
  position        SMALLINT NOT NULL DEFAULT 0,  -- display order (0 = first)
  is_enabled      BOOLEAN NOT NULL DEFAULT TRUE,
  -- Flexible JSON config per section type.
  -- e.g. weather: { "location": "New York, NY", "units": "imperial" }
  --      news:    { "topics": ["tech", "science"], "sources": ["reuters"] }
  --      stocks:  { "tickers": ["AAPL", "MSFT"] }
  config          JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX digest_sections_profile_idx ON public.digest_sections (digest_profile_id, position);

CREATE TRIGGER digest_sections_updated_at
  BEFORE UPDATE ON public.digest_sections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- DELIVERY SETTINGS
-- When and how the digest is delivered.
-- ============================================================
CREATE TYPE public.delivery_channel AS ENUM (
  'email',
  'web_only'
  -- 'sms', 'slack', 'webhook'  -- future
);

CREATE TABLE IF NOT EXISTS public.delivery_settings (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  digest_profile_id   UUID NOT NULL REFERENCES public.digest_profiles(id) ON DELETE CASCADE,
  channel             public.delivery_channel NOT NULL DEFAULT 'email',
  delivery_email      TEXT,               -- destination email (may differ from auth email)
  -- Local time in HH:MM (24h) at which to send the digest
  delivery_time       TIME NOT NULL DEFAULT '07:00:00',
  -- Days of week as bitmask: Sun=1, Mon=2, Tue=4, Wed=8, Thu=16, Fri=32, Sat=64
  -- Default: Mon–Fri = 62
  delivery_days       SMALLINT NOT NULL DEFAULT 62 CHECK (delivery_days BETWEEN 1 AND 127),
  is_enabled          BOOLEAN NOT NULL DEFAULT TRUE,
  -- Timestamp of last successful delivery
  last_delivered_at   TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)    -- one delivery config per user for now
);

CREATE TRIGGER delivery_settings_updated_at
  BEFORE UPDATE ON public.delivery_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- DIGEST HISTORY
-- Archive of every generated digest.
-- ============================================================
CREATE TYPE public.digest_status AS ENUM (
  'pending',    -- scheduled, not yet generated
  'generating', -- in progress
  'ready',      -- generated, not yet delivered
  'delivered',  -- sent to user
  'failed'      -- generation or delivery error
);

CREATE TABLE IF NOT EXISTS public.digest_history (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  digest_profile_id   UUID NOT NULL REFERENCES public.digest_profiles(id) ON DELETE CASCADE,
  status              public.digest_status NOT NULL DEFAULT 'pending',
  -- Rendered HTML content of the digest
  content_html        TEXT,
  -- Structured JSON snapshot of the digest data (for re-rendering / debugging)
  content_json        JSONB,
  -- Date this digest is for (not the same as created_at if generated early)
  digest_date         DATE NOT NULL DEFAULT CURRENT_DATE,
  scheduled_for       TIMESTAMPTZ,
  generated_at        TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,
  -- Error message if status = 'failed'
  error               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX digest_history_user_date_idx ON public.digest_history (user_id, digest_date DESC);
CREATE INDEX digest_history_status_idx ON public.digest_history (status) WHERE status IN ('pending', 'generating');

CREATE TRIGGER digest_history_updated_at
  BEFORE UPDATE ON public.digest_history
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digest_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digest_sections    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digest_history     ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own rows
CREATE POLICY "users: own row only"
  ON public.users FOR ALL
  USING (auth.uid() = id);

CREATE POLICY "digest_profiles: own rows only"
  ON public.digest_profiles FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "digest_sections: own rows only"
  ON public.digest_sections FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "delivery_settings: own rows only"
  ON public.delivery_settings FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "digest_history: own rows only"
  ON public.digest_history FOR ALL
  USING (auth.uid() = user_id);
