-- ============================================
-- PHASE 2-4: Levels 2-4 Engine Implementation
-- ============================================

-- 1. ADD LEVEL SUPPORT TO COMPETITIONS
ALTER TABLE competitions 
ADD COLUMN IF NOT EXISTS current_level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS leaderboard_mode VARCHAR(20) DEFAULT 'cumulative';

COMMENT ON COLUMN competitions.current_level IS 'Current active level (1-4)';
COMMENT ON COLUMN competitions.leaderboard_mode IS 'level = per-level scores, cumulative = total across levels';

-- 2. ADD LEVEL TO TASKS
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS allowed_file_types TEXT[] DEFAULT ARRAY['pdf', 'xlsx', 'docx'],
ADD COLUMN IF NOT EXISTS max_file_size_mb INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS constraints_text TEXT,
ADD COLUMN IF NOT EXISTS assumptions_policy TEXT,
ADD COLUMN IF NOT EXISTS requirements_text TEXT;

COMMENT ON COLUMN tasks.level IS 'Competition level this task belongs to (1-4)';
COMMENT ON COLUMN tasks.allowed_file_types IS 'Array of allowed file extensions';
COMMENT ON COLUMN tasks.constraints_text IS 'Constraints shown to teams (Level 3)';
COMMENT ON COLUMN tasks.assumptions_policy IS 'What is allowed/not allowed';

-- 3. SCORING CRITERIA TABLE
CREATE TABLE IF NOT EXISTS scoring_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    weight DECIMAL(5,2) NOT NULL DEFAULT 0,
    max_score INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    applies_to_levels INTEGER[] DEFAULT ARRAY[1,2,3,4],
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default criteria from competition doc
INSERT INTO scoring_criteria (name, description, weight, applies_to_levels, display_order) VALUES
('Accuracy of Analysis', 'Correctness of calculations, data interpretation, and conclusions', 25.00, ARRAY[2,3,4], 1),
('Financial Logic', 'Sound financial reasoning and methodology', 20.00, ARRAY[2,3,4], 2),
('Model Structure', 'Organization, clarity, and usability of financial models', 20.00, ARRAY[2,3,4], 3),
('Strategic Thinking', 'Quality of strategic analysis and decision-making', 20.00, ARRAY[2,3,4], 4),
('Video Presentation', 'Clarity, depth, storytelling, executive presence', 15.00, ARRAY[4], 5)
ON CONFLICT DO NOTHING;

-- 4. SCORE ENTRIES TABLE (per submission per criterion per judge)
CREATE TABLE IF NOT EXISTS score_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    criterion_id UUID NOT NULL REFERENCES scoring_criteria(id) ON DELETE CASCADE,
    judge_id UUID NOT NULL REFERENCES user_profiles(id),
    score DECIMAL(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(submission_id, criterion_id, judge_id)
);

-- 5. ADD OVERALL FEEDBACK TO SCORES TABLE
ALTER TABLE scores
ADD COLUMN IF NOT EXISTS overall_feedback TEXT,
ADD COLUMN IF NOT EXISTS weighted_total DECIMAL(6,2);

-- 6. ADD VIDEO METADATA TO SUBMISSIONS
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS declared_duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS video_validated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS level INTEGER;

-- 7. COMPETITION RESULTS TABLE
CREATE TABLE IF NOT EXISTS competition_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    level INTEGER NOT NULL,
    total_score DECIMAL(6,2) NOT NULL DEFAULT 0,
    rank INTEGER,
    level_2_score DECIMAL(6,2) DEFAULT 0,
    level_3_score DECIMAL(6,2) DEFAULT 0,
    level_4_score DECIMAL(6,2) DEFAULT 0,
    cumulative_score DECIMAL(6,2) DEFAULT 0,
    show_comments BOOLEAN DEFAULT false,
    calculated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(competition_id, team_id, level)
);

-- 8. JUDGE ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS judge_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    judge_id UUID NOT NULL REFERENCES user_profiles(id),
    assigned_at TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(competition_id, judge_id)
);

-- 9. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_tasks_level ON tasks(competition_id, level);
CREATE INDEX IF NOT EXISTS idx_score_entries_submission ON score_entries(submission_id);
CREATE INDEX IF NOT EXISTS idx_score_entries_judge ON score_entries(judge_id);
CREATE INDEX IF NOT EXISTS idx_submissions_level ON submissions(level);
CREATE INDEX IF NOT EXISTS idx_competition_results_comp ON competition_results(competition_id);
CREATE INDEX IF NOT EXISTS idx_judge_assignments_comp ON judge_assignments(competition_id);

-- 10. RLS POLICIES FOR NEW TABLES
ALTER TABLE scoring_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_assignments ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "service_scoring_criteria" ON scoring_criteria FOR ALL TO service_role USING (true);
CREATE POLICY "service_score_entries" ON score_entries FOR ALL TO service_role USING (true);
CREATE POLICY "service_competition_results" ON competition_results FOR ALL TO service_role USING (true);
CREATE POLICY "service_judge_assignments" ON judge_assignments FOR ALL TO service_role USING (true);

-- Authenticated users can read criteria
CREATE POLICY "read_scoring_criteria" ON scoring_criteria FOR SELECT TO authenticated USING (true);

-- Judges can read/write their own score entries
CREATE POLICY "judges_manage_scores" ON score_entries FOR ALL TO authenticated
USING (judge_id = auth.uid());

-- Teams can see published results
CREATE POLICY "teams_read_results" ON competition_results FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM competitions c 
        WHERE c.id = competition_results.competition_id 
        AND c.results_published = true
    )
);

-- 11. FUNCTION TO CALCULATE WEIGHTED SCORE
CREATE OR REPLACE FUNCTION calculate_weighted_score(p_submission_id UUID)
RETURNS DECIMAL(6,2) AS $$
DECLARE
    total_weighted DECIMAL(6,2) := 0;
    total_weight DECIMAL(5,2) := 0;
BEGIN
    SELECT 
        COALESCE(SUM(se.score * (sc.weight / 100)), 0),
        COALESCE(SUM(sc.weight), 0)
    INTO total_weighted, total_weight
    FROM score_entries se
    JOIN scoring_criteria sc ON se.criterion_id = sc.id
    WHERE se.submission_id = p_submission_id
    AND sc.is_active = true;
    
    IF total_weight > 0 THEN
        RETURN total_weighted;
    END IF;
    
    RETURN 0;
END;
$$ LANGUAGE plpgsql;
