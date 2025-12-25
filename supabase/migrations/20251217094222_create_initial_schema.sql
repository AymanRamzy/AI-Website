-- ModEX Platform Database Schema
-- Run this in Supabase SQL Editor

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'participant',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create competitions table
CREATE TABLE IF NOT EXISTS competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming',
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  registration_deadline TIMESTAMP,
  max_teams INTEGER DEFAULT 8,
  registered_teams INTEGER DEFAULT 0,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create competition_participants table (for user registration to competitions)
CREATE TABLE IF NOT EXISTS competition_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  registration_date TIMESTAMP NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'registered',
  UNIQUE(competition_id, user_id)
);

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name TEXT NOT NULL,
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  leader_id UUID NOT NULL REFERENCES user_profiles(id),
  max_members INTEGER DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'forming',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  team_role TEXT,
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_competitions_status ON competitions(status);
CREATE INDEX IF NOT EXISTS idx_competition_participants_competition ON competition_participants(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_participants_user ON competition_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_teams_competition_id ON teams(competition_id);
CREATE INDEX IF NOT EXISTS idx_teams_leader_id ON teams(leader_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

-- Insert a sample competition for testing
INSERT INTO competitions (title, description, status, start_date, end_date, registration_deadline, max_teams)
VALUES (
  'CFO Excellence Competition 2025',
  'Join the premier CFO competition and showcase your financial leadership skills. Teams will work on real-world case studies and present solutions to industry experts.',
  'registration_open',
  NOW() + INTERVAL '30 days',
  NOW() + INTERVAL '60 days',
  NOW() + INTERVAL '25 days',
  8
) ON CONFLICT DO NOTHING;
