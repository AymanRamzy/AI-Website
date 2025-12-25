-- Competition Registrations Table
-- Run this in Supabase SQL Editor

-- Create competitions table if not exists (minimal version)
CREATE TABLE IF NOT EXISTS competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  registration_start TIMESTAMPTZ,
  registration_end TIMESTAMPTZ,
  competition_start TIMESTAMPTZ,
  competition_end TIMESTAMPTZ,
  max_teams INTEGER DEFAULT 8,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_profiles table if not exists
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'participant',
  is_cfo_qualified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create competition_registrations table (minimal as specified)
CREATE TABLE IF NOT EXISTS competition_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (competition_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_competition_registrations_competition ON competition_registrations(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_registrations_user ON competition_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_competitions_status ON competitions(status);

-- Insert a test competition with status='open'
INSERT INTO competitions (title, description, status, registration_start, registration_end, competition_start, competition_end, max_teams)
VALUES (
  'CFO Excellence Competition 2025',
  'Join the premier CFO competition and showcase your financial leadership skills.',
  'open',
  NOW(),
  NOW() + INTERVAL '25 days',
  NOW() + INTERVAL '30 days',
  NOW() + INTERVAL '60 days',
  8
) ON CONFLICT DO NOTHING;
