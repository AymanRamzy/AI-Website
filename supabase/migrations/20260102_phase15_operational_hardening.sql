-- ============================================
-- PHASE 1.5: Operational Hardening
-- Database constraints to prevent edge-case failures
-- ============================================

-- 1. ADD EXPLICIT STATUS FLAGS TO COMPETITIONS
-- These flags are derived/set by admin actions, read-only for participants
ALTER TABLE competitions 
ADD COLUMN IF NOT EXISTS registration_open BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS submission_open BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS submissions_locked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS results_published BOOLEAN DEFAULT false;

-- 2. UNIQUE CONSTRAINT: One submission per team per task
-- Prevents race condition double submissions
ALTER TABLE submissions 
DROP CONSTRAINT IF EXISTS unique_team_task_submission;

ALTER TABLE submissions 
ADD CONSTRAINT unique_team_task_submission UNIQUE (team_id, task_id);

-- 3. FOREIGN KEY INTEGRITY
-- Ensure referential integrity between core tables

-- submissions → teams (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_submission_team'
    ) THEN
        ALTER TABLE submissions 
        ADD CONSTRAINT fk_submission_team 
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;
    END IF;
END $$;

-- submissions → tasks (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_submission_task'
    ) THEN
        ALTER TABLE submissions 
        ADD CONSTRAINT fk_submission_task 
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;
    END IF;
END $$;

-- scores → submissions (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_score_submission'
    ) THEN
        ALTER TABLE scores 
        ADD CONSTRAINT fk_score_submission 
        FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE;
    END IF;
END $$;

-- teams → competitions (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_team_competition'
    ) THEN
        ALTER TABLE teams 
        ADD CONSTRAINT fk_team_competition 
        FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. INDEX FOR LEADERBOARD QUERIES
CREATE INDEX IF NOT EXISTS idx_submissions_team_task ON submissions(team_id, task_id);
CREATE INDEX IF NOT EXISTS idx_scores_submission ON scores(submission_id);
CREATE INDEX IF NOT EXISTS idx_tasks_competition ON tasks(competition_id);

-- 5. CHECK CONSTRAINT: Score must be between 0 and max allowed
ALTER TABLE scores 
DROP CONSTRAINT IF EXISTS check_score_range;

ALTER TABLE scores 
ADD CONSTRAINT check_score_range CHECK (total_score >= 0 AND total_score <= 1000);

-- 6. DEFAULT STATUS SYNC FUNCTION
-- Automatically sets status flags based on competition state
CREATE OR REPLACE FUNCTION sync_competition_status() 
RETURNS TRIGGER AS $$
BEGIN
    -- If status changes, update corresponding flags
    IF NEW.status = 'registration' THEN
        NEW.registration_open := true;
        NEW.submission_open := false;
        NEW.submissions_locked := false;
        NEW.results_published := false;
    ELSIF NEW.status = 'active' THEN
        NEW.registration_open := false;
        NEW.submission_open := true;
        NEW.submissions_locked := false;
        NEW.results_published := false;
    ELSIF NEW.status = 'judging' THEN
        NEW.registration_open := false;
        NEW.submission_open := false;
        NEW.submissions_locked := true;
        NEW.results_published := false;
    ELSIF NEW.status = 'completed' THEN
        NEW.registration_open := false;
        NEW.submission_open := false;
        NEW.submissions_locked := true;
        NEW.results_published := true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS trigger_sync_competition_status ON competitions;
CREATE TRIGGER trigger_sync_competition_status
    BEFORE UPDATE ON competitions
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION sync_competition_status();

-- 7. COMMENT DOCUMENTATION
COMMENT ON COLUMN competitions.registration_open IS 'Read-only flag: true when registration is open';
COMMENT ON COLUMN competitions.submission_open IS 'Read-only flag: true when submissions are accepted';
COMMENT ON COLUMN competitions.submissions_locked IS 'Read-only flag: true after deadline, submissions immutable';
COMMENT ON COLUMN competitions.results_published IS 'Read-only flag: true when leaderboard is public';
