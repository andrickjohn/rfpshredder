-- supabase/migrations/001_initial_schema.sql
-- Purpose: Initial database schema for RFP Shredder
-- Tables: profiles, shred_log
-- Security: RLS enabled on all tables

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'trial'
    CHECK (subscription_status IN ('trial', 'active', 'canceled', 'past_due')),
  subscription_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'solo', 'team', 'enterprise')),
  stripe_customer_id TEXT UNIQUE,
  subscription_price INTEGER,  -- cents, for MRR calculation
  trial_shreds_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Service role can insert profiles (used by trigger)
CREATE POLICY "Service role inserts profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- SHRED LOG (metadata only — NEVER stores document content)
-- ============================================================
CREATE TABLE shred_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  page_count INTEGER NOT NULL,
  requirement_count INTEGER NOT NULL,
  obligation_breakdown JSONB,  -- {"shall": 15, "must": 8, "should": 3, "may": 1}
  processing_time_ms INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'success'
    CHECK (status IN ('success', 'failed', 'partial')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies for shred_log
ALTER TABLE shred_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own shreds"
  ON shred_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System inserts shreds"
  ON shred_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_shred_log_user_id ON shred_log(user_id);
CREATE INDEX idx_shred_log_created_at ON shred_log(created_at);
CREATE INDEX idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- AUTO-UPDATE updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
