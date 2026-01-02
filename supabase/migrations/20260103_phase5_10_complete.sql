-- ============================================
-- PHASE 5-10: Complete Multi-Level Competition Engine
-- Non-destructive migration - extends existing schema
-- Created: 2026-01-03
-- ============================================

-- ============================================
-- PHASE 5: Multi-Level Task Submissions
-- ============================================

-- 1. Create task_submissions table for Level 2-4 submissions
-- Keeps team_submissions intact for backward compatibility (Level 1)
CREATE TABLE IF NOT EXISTS task_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    level INTEGER NOT NULL CHECK (level >= 1 AND level <= 4),
    
    -- File fields
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT,
    file_size INTEGER,
    file_hash VARCHAR(64), -- SHA256 for anti-cheat
    
    -- Submission metadata
    submitted_by UUID NOT NULL REFERENCES user_profiles(id),
    submitted_by_name TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'locked', 'scored', 'invalidated')),
    is_locked BOOLEAN DEFAULT false,
    locked_at TIMESTAMPTZ,
    
    -- Video-specific fields (Level 4)
    declared_duration_seconds INTEGER,
    video_validated BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Only one submission per team per task
    UNIQUE(team_id, task_id)
);

COMMENT ON TABLE task_submissions IS 'Per-task submissions for Levels 2-4. team_submissions remains for Level 1 backward compatibility.';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_submissions_competition_level ON task_submissions(competition_id, level);
CREATE INDEX IF NOT EXISTS idx_task_submissions_team_task ON task_submissions(team_id, task_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_task ON task_submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_submitted_at ON task_submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_task_submissions_file_hash ON task_submissions(file_hash) WHERE file_hash IS NOT NULL;

-- 2. Add deadline to tasks if not exists
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- ============================================
-- PHASE 6: Judge Workflow & Scoring
-- ============================================

-- 3. Score entries for task_submissions (separate from legacy)
CREATE TABLE IF NOT EXISTS task_score_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_submission_id UUID NOT NULL REFERENCES task_submissions(id) ON DELETE CASCADE,
    criterion_id UUID NOT NULL REFERENCES scoring_criteria(id) ON DELETE CASCADE,
    judge_id UUID NOT NULL REFERENCES user_profiles(id),
    score DECIMAL(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(task_submission_id, criterion_id, judge_id)
);

CREATE INDEX IF NOT EXISTS idx_task_score_entries_submission ON task_score_entries(task_submission_id);
CREATE INDEX IF NOT EXISTS idx_task_score_entries_judge ON task_score_entries(judge_id);

-- 4. Task submission scores summary
CREATE TABLE IF NOT EXISTS task_submission_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_submission_id UUID NOT NULL REFERENCES task_submissions(id) ON DELETE CASCADE,
    judge_id UUID NOT NULL REFERENCES user_profiles(id),
    weighted_total DECIMAL(6,2) NOT NULL DEFAULT 0,
    overall_feedback TEXT,
    is_final BOOLEAN DEFAULT false,
    scored_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(task_submission_id, judge_id)
);

-- 5. Ensure judge_assignments exists with proper structure
-- (Already created in previous migration, but ensure columns exist)
ALTER TABLE judge_assignments ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES user_profiles(id);
ALTER TABLE judge_assignments ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================
-- PHASE 7: Results & Leaderboards
-- ============================================

-- 6. Team level scores (aggregated per level)
CREATE TABLE IF NOT EXISTS team_level_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    level INTEGER NOT NULL CHECK (level >= 1 AND level <= 4),
    total_score DECIMAL(6,2) DEFAULT 0,
    judge_count INTEGER DEFAULT 0,
    average_score DECIMAL(6,2) DEFAULT 0,
    rank_in_level INTEGER,
    calculated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(competition_id, team_id, level)
);

CREATE INDEX IF NOT EXISTS idx_team_level_scores_comp ON team_level_scores(competition_id, level);

-- 7. Leaderboard snapshots for published results
CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    team_name TEXT,
    final_rank INTEGER NOT NULL,
    level_2_score DECIMAL(6,2) DEFAULT 0,
    level_3_score DECIMAL(6,2) DEFAULT 0,
    level_4_score DECIMAL(6,2) DEFAULT 0,
    cumulative_score DECIMAL(6,2) DEFAULT 0,
    last_submission_at TIMESTAMPTZ,
    show_judge_comments BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_comp ON leaderboard_snapshots(competition_id);

-- ============================================
-- PHASE 8: Certificates
-- ============================================

CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id),
    team_id UUID REFERENCES teams(id),
    certificate_type VARCHAR(50) NOT NULL CHECK (certificate_type IN ('participation', 'finalist', 'winner', 'runner_up', 'honorable_mention')),
    rank INTEGER,
    certificate_url TEXT,
    certificate_data JSONB DEFAULT '{}',
    issued_at TIMESTAMPTZ DEFAULT now(),
    issued_by UUID REFERENCES user_profiles(id),
    UNIQUE(competition_id, user_id, certificate_type)
);

CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_team ON certificates(team_id);

-- ============================================
-- PHASE 9: Audit Trail
-- ============================================

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES user_profiles(id),
    actor_role VARCHAR(50),
    actor_email TEXT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    competition_id UUID REFERENCES competitions(id),
    meta JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_competition ON audit_log(competition_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);

-- ============================================
-- PHASE 10: Operational Support
-- ============================================

-- 8. Add competition-level deadlines
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS level_2_deadline TIMESTAMPTZ;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS level_3_deadline TIMESTAMPTZ;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS level_4_deadline TIMESTAMPTZ;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS show_judge_comments BOOLEAN DEFAULT false;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_score_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_submission_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_level_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "service_task_submissions" ON task_submissions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_task_score_entries" ON task_score_entries FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_task_submission_scores" ON task_submission_scores FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_team_level_scores" ON team_level_scores FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_leaderboard_snapshots" ON leaderboard_snapshots FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_certificates" ON certificates FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_audit_log" ON audit_log FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Team members can view their submissions
CREATE POLICY "team_view_task_submissions" ON task_submissions FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM team_members tm 
        WHERE tm.team_id = task_submissions.team_id 
        AND tm.user_id = auth.uid()
    )
);

-- Team members can insert submissions (checked via backend for locks/deadlines)
CREATE POLICY "team_insert_task_submissions" ON task_submissions FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM team_members tm 
        WHERE tm.team_id = task_submissions.team_id 
        AND tm.user_id = auth.uid()
    )
);

-- Judges can view submissions for their assigned competitions
CREATE POLICY "judge_view_task_submissions" ON task_submissions FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM judge_assignments ja
        WHERE ja.competition_id = task_submissions.competition_id
        AND ja.judge_id = auth.uid()
        AND ja.is_active = true
    )
);

-- Admins can view all submissions
CREATE POLICY "admin_view_task_submissions" ON task_submissions FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = auth.uid()
        AND up.role = 'admin'
    )
);

-- Judges manage their own score entries
CREATE POLICY "judge_manage_task_scores" ON task_score_entries FOR ALL TO authenticated
USING (judge_id = auth.uid())
WITH CHECK (judge_id = auth.uid());

-- Public leaderboard (only when published)
CREATE POLICY "public_leaderboard" ON leaderboard_snapshots FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM competitions c
        WHERE c.id = leaderboard_snapshots.competition_id
        AND c.results_published = true
    )
);

-- Users can view their own certificates
CREATE POLICY "user_view_certificates" ON certificates FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Admins can view audit log
CREATE POLICY "admin_view_audit" ON audit_log FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = auth.uid()
        AND up.role = 'admin'
    )
);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to calculate weighted score for task submission
CREATE OR REPLACE FUNCTION calculate_task_weighted_score(p_task_submission_id UUID, p_judge_id UUID)
RETURNS DECIMAL(6,2) AS $$
DECLARE
    v_level INTEGER;
    v_total DECIMAL(6,2) := 0;
BEGIN
    -- Get submission level
    SELECT level INTO v_level FROM task_submissions WHERE id = p_task_submission_id;
    
    -- Calculate weighted sum
    SELECT COALESCE(SUM(tse.score * (sc.weight / 100)), 0)
    INTO v_total
    FROM task_score_entries tse
    JOIN scoring_criteria sc ON tse.criterion_id = sc.id
    WHERE tse.task_submission_id = p_task_submission_id
    AND tse.judge_id = p_judge_id
    AND sc.is_active = true
    AND v_level = ANY(sc.applies_to_levels);
    
    RETURN v_total;
END;
$$ LANGUAGE plpgsql;

-- Function to get team submissions summary by level
CREATE OR REPLACE FUNCTION get_team_submissions_by_level(p_competition_id UUID, p_team_id UUID)
RETURNS TABLE (
    level INTEGER,
    submission_count BIGINT,
    total_tasks BIGINT,
    all_submitted BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.level,
        COUNT(ts.id) AS submission_count,
        COUNT(t.id) AS total_tasks,
        COUNT(ts.id) = COUNT(t.id) AS all_submitted
    FROM tasks t
    LEFT JOIN task_submissions ts ON t.id = ts.task_id AND ts.team_id = p_team_id
    WHERE t.competition_id = p_competition_id AND t.is_active = true
    GROUP BY t.level
    ORDER BY t.level;
END;
$$ LANGUAGE plpgsql;

-- Function to check if team can submit (locks, deadlines)
CREATE OR REPLACE FUNCTION can_team_submit(p_competition_id UUID, p_task_id UUID)
RETURNS TABLE (can_submit BOOLEAN, reason TEXT) AS $$
DECLARE
    v_locked BOOLEAN;
    v_deadline TIMESTAMPTZ;
    v_task_deadline TIMESTAMPTZ;
    v_current_level INTEGER;
    v_task_level INTEGER;
BEGIN
    -- Check competition lock
    SELECT submissions_locked, current_level
    INTO v_locked, v_current_level
    FROM competitions WHERE id = p_competition_id;
    
    IF v_locked = true THEN
        RETURN QUERY SELECT false, 'Competition submissions are locked'::TEXT;
        RETURN;
    END IF;
    
    -- Check task level vs current level
    SELECT level, deadline INTO v_task_level, v_task_deadline FROM tasks WHERE id = p_task_id;
    
    IF v_task_level > v_current_level THEN
        RETURN QUERY SELECT false, 'Task level not yet available'::TEXT;
        RETURN;
    END IF;
    
    -- Check task deadline
    IF v_task_deadline IS NOT NULL AND v_task_deadline < now() THEN
        RETURN QUERY SELECT false, 'Task deadline has passed'::TEXT;
        RETURN;
    END IF;
    
    -- Check level-specific deadline
    EXECUTE format(
        'SELECT level_%s_deadline FROM competitions WHERE id = $1',
        v_task_level
    ) INTO v_deadline USING p_competition_id;
    
    IF v_deadline IS NOT NULL AND v_deadline < now() THEN
        RETURN QUERY SELECT false, format('Level %s deadline has passed', v_task_level)::TEXT;
        RETURN;
    END IF;
    
    RETURN QUERY SELECT true, 'OK'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS task_submissions_updated_at ON task_submissions;
CREATE TRIGGER task_submissions_updated_at
    BEFORE UPDATE ON task_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS task_score_entries_updated_at ON task_score_entries;
CREATE TRIGGER task_score_entries_updated_at
    BEFORE UPDATE ON task_score_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- GRANT STATEMENTS
-- ============================================
GRANT ALL ON task_submissions TO service_role;
GRANT ALL ON task_score_entries TO service_role;
GRANT ALL ON task_submission_scores TO service_role;
GRANT ALL ON team_level_scores TO service_role;
GRANT ALL ON leaderboard_snapshots TO service_role;
GRANT ALL ON certificates TO service_role;
GRANT ALL ON audit_log TO service_role;

GRANT SELECT, INSERT ON task_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON task_score_entries TO authenticated;
GRANT SELECT ON team_level_scores TO authenticated;
GRANT SELECT ON leaderboard_snapshots TO authenticated;
GRANT SELECT ON certificates TO authenticated;
