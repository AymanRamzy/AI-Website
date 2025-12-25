-- Team Submissions Table
-- Stores team submissions for competition cases
-- Created: 2025-12-25

-- Create team_submissions table
CREATE TABLE IF NOT EXISTS team_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  file_name TEXT,
  file_path TEXT NOT NULL,
  file_url TEXT,
  file_size INTEGER,
  submitted_by UUID NOT NULL REFERENCES user_profiles(id),
  submitted_by_name TEXT,
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  -- Only one submission per team per competition
  UNIQUE(team_id, competition_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_submissions_team_id ON team_submissions(team_id);
CREATE INDEX IF NOT EXISTS idx_team_submissions_competition_id ON team_submissions(competition_id);
CREATE INDEX IF NOT EXISTS idx_team_submissions_submitted_by ON team_submissions(submitted_by);

-- Enable RLS
ALTER TABLE team_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_submissions

-- Policy: Team members can view their team's submission
CREATE POLICY "team_members_can_view_submission" ON team_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_submissions.team_id
      AND team_members.user_id = auth.uid()
    )
  );

-- Policy: Team members can insert submission for their team
CREATE POLICY "team_members_can_insert_submission" ON team_submissions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_submissions.team_id
      AND team_members.user_id = auth.uid()
    )
  );

-- Policy: Admins can view all submissions
CREATE POLICY "admins_can_view_all_submissions" ON team_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Create storage bucket for team submissions (run in Supabase Dashboard if needed)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('team-submissions', 'team-submissions', false)
-- ON CONFLICT DO NOTHING;
