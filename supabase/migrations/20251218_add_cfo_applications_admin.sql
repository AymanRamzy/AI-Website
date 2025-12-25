-- ModEX Platform - CFO Applications & Admin Schema
-- Run this AFTER the initial schema migration

-- Add is_cfo_qualified flag to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_cfo_qualified BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS job_title TEXT;

-- Create CFO application status enum values for reference
-- Statuses: pending, auto_rejected, shortlisted, approved, rejected, waitlisted

-- Create cfo_applications table
CREATE TABLE IF NOT EXISTS cfo_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  
  -- CV and documents
  cv_file_path TEXT,
  cv_filename TEXT,
  
  -- Application questionnaire data
  years_experience INTEGER NOT NULL DEFAULT 0,
  job_title TEXT,
  industry TEXT,
  certifications TEXT[] DEFAULT '{}',
  education_level TEXT,
  
  -- Leadership questionnaire answers (stored as JSON)
  leadership_answers JSONB DEFAULT '{}',
  
  -- Scoring
  auto_score DECIMAL(5,2) DEFAULT 0,
  manual_score DECIMAL(5,2),
  final_score DECIMAL(5,2) DEFAULT 0,
  
  -- Availability commitment (1-10 scale)
  availability_score INTEGER DEFAULT 5,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  admin_notes TEXT,
  reviewed_by UUID REFERENCES user_profiles(id),
  reviewed_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, competition_id)
);

-- Create judge_assignments table
CREATE TABLE IF NOT EXISTS judge_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES user_profiles(id),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE(competition_id, judge_id)
);

-- Create tasks table for competition tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT DEFAULT 'submission',
  max_points INTEGER DEFAULT 100,
  deadline TIMESTAMP,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  file_path TEXT,
  file_name TEXT,
  notes TEXT,
  status TEXT DEFAULT 'submitted',
  submitted_by UUID REFERENCES user_profiles(id),
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE(task_id, team_id)
);

-- Create scores table for judge scoring
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Scoring criteria (stored as JSON for flexibility)
  criteria_scores JSONB DEFAULT '{}',
  total_score DECIMAL(5,2) DEFAULT 0,
  feedback TEXT,
  
  is_final BOOLEAN DEFAULT FALSE,
  scored_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE(submission_id, judge_id)
);

-- Create admin_audit_log for tracking admin actions
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES user_profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cfo_applications_user ON cfo_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_cfo_applications_competition ON cfo_applications(competition_id);
CREATE INDEX IF NOT EXISTS idx_cfo_applications_status ON cfo_applications(status);
CREATE INDEX IF NOT EXISTS idx_cfo_applications_score ON cfo_applications(final_score DESC);
CREATE INDEX IF NOT EXISTS idx_judge_assignments_competition ON judge_assignments(competition_id);
CREATE INDEX IF NOT EXISTS idx_judge_assignments_judge ON judge_assignments(judge_id);
CREATE INDEX IF NOT EXISTS idx_tasks_competition ON tasks(competition_id);
CREATE INDEX IF NOT EXISTS idx_submissions_task ON submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_submissions_team ON submissions(team_id);
CREATE INDEX IF NOT EXISTS idx_scores_submission ON scores(submission_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_entity ON admin_audit_log(entity_type, entity_id);

-- Update function for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_cfo_applications_updated_at ON cfo_applications;
CREATE TRIGGER update_cfo_applications_updated_at
    BEFORE UPDATE ON cfo_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
