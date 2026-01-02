-- ============================================
-- ModEX CFO COMPETITION PLATFORM
-- PHASES 5-10: STRATEGIC ENHANCEMENT SUITE
-- Non-destructive, additive migrations
-- ============================================

-- ============================================
-- PHASE 5: TEAM GOVERNANCE & REALISM
-- ============================================

-- 5.1 Team Member Approval Workflow
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'approved' 
    CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES user_profiles(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejected_reason TEXT,
ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ DEFAULT now();

COMMENT ON COLUMN team_members.approval_status IS 'Member approval status: pending (awaiting leader approval), approved, rejected';

-- 5.2 Team Leadership Enhancement
ALTER TABLE teams
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_pending_requests INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS team_settings JSONB DEFAULT '{}';

COMMENT ON COLUMN teams.requires_approval IS 'If true, new members need leader approval';

-- 5.3 Team Join Requests Table (for tracking)
CREATE TABLE IF NOT EXISTS team_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id),
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
    reviewed_by UUID REFERENCES user_profiles(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(team_id, user_id, status)
);

CREATE INDEX IF NOT EXISTS idx_join_requests_team ON team_join_requests(team_id, status);
CREATE INDEX IF NOT EXISTS idx_join_requests_user ON team_join_requests(user_id);

-- ============================================
-- PHASE 6: ADMIN GOVERNANCE & OBSERVER MODE
-- ============================================

-- 6.1 Activity Timeline / Event Log
CREATE TABLE IF NOT EXISTS team_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    competition_id UUID REFERENCES competitions(id),
    actor_id UUID REFERENCES user_profiles(id),
    actor_name TEXT,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'team_created',
        'member_joined',
        'member_approved',
        'member_rejected',
        'member_removed',
        'member_left',
        'role_changed',
        'submission_uploaded',
        'submission_replaced',
        'submission_locked',
        'scoring_started',
        'scoring_completed',
        'results_published',
        'chat_message',
        'settings_changed',
        'leader_transferred'
    )),
    event_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_team ON team_activity_log(team_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_competition ON team_activity_log(competition_id);
CREATE INDEX IF NOT EXISTS idx_activity_type ON team_activity_log(event_type);

-- 6.2 Admin View Audit (tracks admin observations)
CREATE TABLE IF NOT EXISTS admin_view_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES user_profiles(id),
    view_type VARCHAR(50) NOT NULL CHECK (view_type IN (
        'competition_list',
        'competition_detail',
        'team_list',
        'team_detail',
        'team_members',
        'team_chat',
        'team_submissions',
        'team_scores',
        'user_profile',
        'leaderboard',
        'audit_log'
    )),
    entity_type VARCHAR(50),
    entity_id UUID,
    competition_id UUID REFERENCES competitions(id),
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_view_admin ON admin_view_log(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_view_entity ON admin_view_log(entity_type, entity_id);

-- ============================================
-- PHASE 7: MULTI-TASK & MULTI-LEVEL (Already Created)
-- task_submissions table exists from previous migration
-- ============================================

-- Ensure task_submissions has all required fields
ALTER TABLE task_submissions
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS replaced_submission_id UUID REFERENCES task_submissions(id),
ADD COLUMN IF NOT EXISTS validation_status VARCHAR(20) DEFAULT 'valid' 
    CHECK (validation_status IN ('valid', 'invalid', 'pending_review'));

-- ============================================
-- PHASE 8: JUDGING, SCORING & FAIRNESS (Enhanced)
-- ============================================

-- 8.1 Judge Competition Restrictions
ALTER TABLE judge_assignments
ADD COLUMN IF NOT EXISTS can_view_team_names BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_view_member_profiles BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS blind_judging BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS max_submissions_per_day INTEGER DEFAULT 50;

-- 8.2 Scoring Lock Mechanism
CREATE TABLE IF NOT EXISTS scoring_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id),
    level INTEGER,
    locked_by UUID REFERENCES user_profiles(id),
    locked_at TIMESTAMPTZ DEFAULT now(),
    reason TEXT,
    UNIQUE(competition_id, task_id)
);

-- 8.3 Score Appeals (Fairness)
CREATE TABLE IF NOT EXISTS score_appeals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL,
    submission_type VARCHAR(20) DEFAULT 'task' CHECK (submission_type IN ('task', 'team')),
    team_id UUID NOT NULL REFERENCES teams(id),
    competition_id UUID NOT NULL REFERENCES competitions(id),
    appellant_id UUID NOT NULL REFERENCES user_profiles(id),
    original_score DECIMAL(6,2),
    appeal_reason TEXT NOT NULL,
    appeal_status VARCHAR(20) DEFAULT 'pending' CHECK (appeal_status IN ('pending', 'under_review', 'upheld', 'adjusted', 'rejected')),
    reviewed_by UUID REFERENCES user_profiles(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    adjusted_score DECIMAL(6,2),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appeals_competition ON score_appeals(competition_id, appeal_status);
CREATE INDEX IF NOT EXISTS idx_appeals_team ON score_appeals(team_id);

-- ============================================
-- PHASE 9: TALENT MARKETPLACE (FIFA-STYLE)
-- ============================================

-- 9.1 Talent Profiles
CREATE TABLE IF NOT EXISTS talent_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Profile Settings
    is_public BOOLEAN DEFAULT false,
    is_open_to_offers BOOLEAN DEFAULT false,
    preferred_roles TEXT[] DEFAULT ARRAY['CFO', 'Finance Director', 'Controller'],
    preferred_industries TEXT[] DEFAULT '{}',
    preferred_locations TEXT[] DEFAULT '{}',
    remote_preference VARCHAR(20) DEFAULT 'hybrid' CHECK (remote_preference IN ('remote', 'hybrid', 'onsite', 'flexible')),
    
    -- Calculated Metrics (updated after each competition)
    overall_rating DECIMAL(3,1) DEFAULT 0 CHECK (overall_rating >= 0 AND overall_rating <= 10),
    market_value INTEGER DEFAULT 0, -- In platform currency/points
    competitions_participated INTEGER DEFAULT 0,
    competitions_won INTEGER DEFAULT 0,
    total_score_earned DECIMAL(8,2) DEFAULT 0,
    average_rank DECIMAL(5,2),
    
    -- Skill Ratings (0-100)
    skill_financial_modeling INTEGER DEFAULT 0,
    skill_strategic_thinking INTEGER DEFAULT 0,
    skill_data_analysis INTEGER DEFAULT 0,
    skill_communication INTEGER DEFAULT 0,
    skill_leadership INTEGER DEFAULT 0,
    skill_risk_management INTEGER DEFAULT 0,
    
    -- Badges & Achievements (JSONB array)
    badges JSONB DEFAULT '[]',
    achievements JSONB DEFAULT '[]',
    
    -- Activity
    last_active_at TIMESTAMPTZ,
    profile_views INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_talent_rating ON talent_profiles(overall_rating DESC) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_talent_market_value ON talent_profiles(market_value DESC) WHERE is_open_to_offers = true;
CREATE INDEX IF NOT EXISTS idx_talent_user ON talent_profiles(user_id);

-- 9.2 Talent Transfer Market
CREATE TABLE IF NOT EXISTS talent_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Parties
    talent_id UUID NOT NULL REFERENCES user_profiles(id),
    company_id UUID NOT NULL REFERENCES user_profiles(id), -- Recruiter/Company account
    
    -- Offer Details
    offer_type VARCHAR(20) DEFAULT 'job' CHECK (offer_type IN ('job', 'contract', 'consultation', 'mentorship')),
    role_title VARCHAR(100) NOT NULL,
    role_description TEXT,
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency VARCHAR(3) DEFAULT 'USD',
    location TEXT,
    remote_option BOOLEAN DEFAULT true,
    
    -- Terms
    contract_duration_months INTEGER,
    start_date DATE,
    benefits JSONB DEFAULT '{}',
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'negotiating', 'accepted', 'rejected', 'withdrawn', 'expired')),
    expires_at TIMESTAMPTZ,
    
    -- Responses
    talent_response TEXT,
    talent_responded_at TIMESTAMPTZ,
    counter_offer JSONB,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_offers_talent ON talent_offers(talent_id, status);
CREATE INDEX IF NOT EXISTS idx_offers_company ON talent_offers(company_id, status);

-- 9.3 Transfer Windows (Seasonal)
CREATE TABLE IF NOT EXISTS transfer_windows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    season VARCHAR(20), -- e.g., "2025-Q1"
    competition_id UUID REFERENCES competitions(id), -- Optional: linked to specific competition
    opens_at TIMESTAMPTZ NOT NULL,
    closes_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT false,
    rules JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9.4 Company/Recruiter Profiles
CREATE TABLE IF NOT EXISTS company_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES user_profiles(id), -- Admin/recruiter account
    company_name VARCHAR(200) NOT NULL,
    company_type VARCHAR(50) CHECK (company_type IN ('corporation', 'startup', 'consulting', 'investment', 'other')),
    industry VARCHAR(100),
    company_size VARCHAR(20) CHECK (company_size IN ('1-50', '51-200', '201-1000', '1001-5000', '5000+')),
    headquarters_location TEXT,
    website_url TEXT,
    logo_url TEXT,
    description TEXT,
    
    -- Hiring Budget (Platform Currency)
    hiring_budget INTEGER DEFAULT 0,
    budget_spent INTEGER DEFAULT 0,
    
    -- Verification
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES user_profiles(id),
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_verified ON company_profiles(is_verified) WHERE is_verified = true;

-- ============================================
-- PHASE 10: SPONSORS, GAMIFICATION & SCALE
-- ============================================

-- 10.1 Sponsor Accounts
CREATE TABLE IF NOT EXISTS sponsors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id), -- Optional: linked account
    name VARCHAR(200) NOT NULL,
    logo_url TEXT,
    website_url TEXT,
    description TEXT,
    tier VARCHAR(20) DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'title')),
    is_active BOOLEAN DEFAULT true,
    
    -- Permissions
    can_view_leaderboard BOOLEAN DEFAULT true,
    can_view_talent_profiles BOOLEAN DEFAULT false,
    can_create_challenges BOOLEAN DEFAULT false,
    can_brand_competition BOOLEAN DEFAULT false,
    
    -- Branding
    brand_colors JSONB DEFAULT '{}',
    custom_badge_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10.2 Sponsor Challenges (Micro-cases)
CREATE TABLE IF NOT EXISTS sponsor_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_id UUID NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
    competition_id UUID REFERENCES competitions(id),
    
    title VARCHAR(200) NOT NULL,
    description TEXT,
    challenge_type VARCHAR(50) DEFAULT 'case_study' CHECK (challenge_type IN ('case_study', 'quick_analysis', 'presentation', 'quiz')),
    
    -- Rewards
    reward_type VARCHAR(20) DEFAULT 'badge' CHECK (reward_type IN ('badge', 'points', 'certificate', 'interview', 'prize')),
    reward_value INTEGER DEFAULT 0,
    reward_description TEXT,
    
    -- Timing
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    
    -- Content
    case_data JSONB DEFAULT '{}',
    attachments JSONB DEFAULT '[]',
    
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sponsor_challenges_active ON sponsor_challenges(is_active, starts_at);

-- 10.3 Gamification: Badges & Achievements
CREATE TABLE IF NOT EXISTS badge_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'achievement' CHECK (category IN ('achievement', 'skill', 'participation', 'leadership', 'special', 'sponsor')),
    icon_url TEXT,
    rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    points_value INTEGER DEFAULT 10,
    
    -- Criteria (JSONB for flexible rules)
    criteria JSONB DEFAULT '{}',
    -- e.g., {"type": "competitions_won", "threshold": 3}
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Pre-populate badges
INSERT INTO badge_definitions (code, name, description, category, rarity, points_value, criteria) VALUES
('first_competition', 'First Steps', 'Participated in your first competition', 'participation', 'common', 10, '{"type": "competitions_participated", "threshold": 1}'),
('winner', 'Champion', 'Won a CFO competition', 'achievement', 'epic', 100, '{"type": "rank", "threshold": 1}'),
('top_3', 'Podium Finish', 'Finished in top 3', 'achievement', 'rare', 50, '{"type": "rank", "threshold": 3}'),
('top_10', 'Elite Performer', 'Finished in top 10', 'achievement', 'uncommon', 25, '{"type": "rank", "threshold": 10}'),
('fast_submitter', 'Speed Demon', 'First team to submit in a level', 'skill', 'rare', 30, '{"type": "first_submission", "threshold": 1}'),
('perfect_score', 'Flawless', 'Achieved a perfect score on any task', 'achievement', 'legendary', 200, '{"type": "score", "threshold": 100}'),
('team_leader', 'Commander', 'Led a team to completion', 'leadership', 'uncommon', 20, '{"type": "team_leader", "threshold": 1}'),
('veteran', 'Veteran', 'Participated in 5+ competitions', 'participation', 'rare', 40, '{"type": "competitions_participated", "threshold": 5}'),
('analyst', 'Data Wizard', 'Scored 90+ on financial modeling', 'skill', 'rare', 35, '{"type": "skill_score", "skill": "financial_modeling", "threshold": 90}'),
('strategist', 'Strategic Mind', 'Scored 90+ on strategic thinking', 'skill', 'rare', 35, '{"type": "skill_score", "skill": "strategic_thinking", "threshold": 90}')
ON CONFLICT (code) DO NOTHING;

-- 10.4 User Badges (Earned)
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badge_definitions(id),
    competition_id UUID REFERENCES competitions(id), -- Where it was earned
    earned_at TIMESTAMPTZ DEFAULT now(),
    meta JSONB DEFAULT '{}', -- Additional context
    UNIQUE(user_id, badge_id, competition_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges ON user_badges(user_id);

-- 10.5 Points & Seasons
CREATE TABLE IF NOT EXISTS user_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    season VARCHAR(20) NOT NULL, -- e.g., "2025-S1"
    total_points INTEGER DEFAULT 0,
    competition_points INTEGER DEFAULT 0,
    badge_points INTEGER DEFAULT 0,
    challenge_points INTEGER DEFAULT 0,
    rank_in_season INTEGER,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, season)
);

CREATE INDEX IF NOT EXISTS idx_user_points_season ON user_points(season, total_points DESC);

-- 10.6 Seasons Definition
CREATE TABLE IF NOT EXISTS seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL, -- e.g., "2025-S1"
    name VARCHAR(100) NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT false,
    prizes JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE team_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_view_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "service_team_join_requests" ON team_join_requests FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_team_activity_log" ON team_activity_log FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_admin_view_log" ON admin_view_log FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_scoring_locks" ON scoring_locks FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_score_appeals" ON score_appeals FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_talent_profiles" ON talent_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_talent_offers" ON talent_offers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_transfer_windows" ON transfer_windows FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_company_profiles" ON company_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_sponsors" ON sponsors FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_sponsor_challenges" ON sponsor_challenges FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_badge_definitions" ON badge_definitions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_user_badges" ON user_badges FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_user_points" ON user_points FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_seasons" ON seasons FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Team members can view their team's join requests
CREATE POLICY "team_view_join_requests" ON team_join_requests FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM team_members tm 
        WHERE tm.team_id = team_join_requests.team_id 
        AND tm.user_id = auth.uid()
        AND tm.role IN ('leader', 'co-leader')
    )
    OR user_id = auth.uid()
);

-- Team members can view their activity log
CREATE POLICY "team_view_activity" ON team_activity_log FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM team_members tm 
        WHERE tm.team_id = team_activity_log.team_id 
        AND tm.user_id = auth.uid()
    )
);

-- Public talent profiles
CREATE POLICY "public_talent_profiles" ON talent_profiles FOR SELECT TO authenticated
USING (is_public = true OR user_id = auth.uid());

-- Users can manage their own talent profile
CREATE POLICY "own_talent_profile" ON talent_profiles FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Talent can see their offers
CREATE POLICY "talent_view_offers" ON talent_offers FOR SELECT TO authenticated
USING (talent_id = auth.uid() OR company_id = auth.uid());

-- Public badge definitions
CREATE POLICY "public_badges" ON badge_definitions FOR SELECT TO authenticated USING (is_active = true);

-- Users can see their badges
CREATE POLICY "user_view_badges" ON user_badges FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Public seasons
CREATE POLICY "public_seasons" ON seasons FOR SELECT TO authenticated USING (true);

-- Public sponsor challenges
CREATE POLICY "public_challenges" ON sponsor_challenges FOR SELECT TO authenticated USING (is_active = true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to log team activity
CREATE OR REPLACE FUNCTION log_team_activity(
    p_team_id UUID,
    p_competition_id UUID,
    p_actor_id UUID,
    p_actor_name TEXT,
    p_event_type VARCHAR(50),
    p_event_data JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO team_activity_log (team_id, competition_id, actor_id, actor_name, event_type, event_data)
    VALUES (p_team_id, p_competition_id, p_actor_id, p_actor_name, p_event_type, p_event_data)
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate talent market value
CREATE OR REPLACE FUNCTION calculate_market_value(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_base INTEGER := 1000;
    v_multiplier DECIMAL := 1.0;
    v_profile talent_profiles%ROWTYPE;
BEGIN
    SELECT * INTO v_profile FROM talent_profiles WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN v_base;
    END IF;
    
    -- Base multipliers
    v_multiplier := v_multiplier + (v_profile.competitions_won * 0.5);
    v_multiplier := v_multiplier + (v_profile.overall_rating * 0.2);
    v_multiplier := v_multiplier + (v_profile.competitions_participated * 0.05);
    
    -- Skill bonuses
    v_multiplier := v_multiplier + (GREATEST(
        v_profile.skill_financial_modeling,
        v_profile.skill_strategic_thinking,
        v_profile.skill_leadership
    ) / 100.0 * 0.3);
    
    RETURN FLOOR(v_base * v_multiplier);
END;
$$ LANGUAGE plpgsql;

-- Function to update talent profile after competition
CREATE OR REPLACE FUNCTION update_talent_after_competition(
    p_user_id UUID,
    p_competition_id UUID,
    p_rank INTEGER,
    p_score DECIMAL
) RETURNS VOID AS $$
BEGIN
    -- Upsert talent profile
    INSERT INTO talent_profiles (user_id, competitions_participated, total_score_earned)
    VALUES (p_user_id, 1, p_score)
    ON CONFLICT (user_id) DO UPDATE SET
        competitions_participated = talent_profiles.competitions_participated + 1,
        competitions_won = CASE WHEN p_rank = 1 THEN talent_profiles.competitions_won + 1 ELSE talent_profiles.competitions_won END,
        total_score_earned = talent_profiles.total_score_earned + p_score,
        average_rank = (COALESCE(talent_profiles.average_rank, 0) * talent_profiles.competitions_participated + p_rank) / (talent_profiles.competitions_participated + 1),
        overall_rating = LEAST(10, (talent_profiles.total_score_earned + p_score) / (talent_profiles.competitions_participated + 1) / 10),
        updated_at = now();
    
    -- Update market value
    UPDATE talent_profiles 
    SET market_value = calculate_market_value(p_user_id)
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- GRANTS
-- ============================================
GRANT ALL ON team_join_requests TO service_role;
GRANT ALL ON team_activity_log TO service_role;
GRANT ALL ON admin_view_log TO service_role;
GRANT ALL ON scoring_locks TO service_role;
GRANT ALL ON score_appeals TO service_role;
GRANT ALL ON talent_profiles TO service_role;
GRANT ALL ON talent_offers TO service_role;
GRANT ALL ON transfer_windows TO service_role;
GRANT ALL ON company_profiles TO service_role;
GRANT ALL ON sponsors TO service_role;
GRANT ALL ON sponsor_challenges TO service_role;
GRANT ALL ON badge_definitions TO service_role;
GRANT ALL ON user_badges TO service_role;
GRANT ALL ON user_points TO service_role;
GRANT ALL ON seasons TO service_role;

GRANT SELECT, INSERT, UPDATE ON team_join_requests TO authenticated;
GRANT SELECT ON team_activity_log TO authenticated;
GRANT SELECT, INSERT, UPDATE ON talent_profiles TO authenticated;
GRANT SELECT, UPDATE ON talent_offers TO authenticated;
GRANT SELECT ON transfer_windows TO authenticated;
GRANT SELECT ON company_profiles TO authenticated;
GRANT SELECT ON sponsors TO authenticated;
GRANT SELECT ON sponsor_challenges TO authenticated;
GRANT SELECT ON badge_definitions TO authenticated;
GRANT SELECT ON user_badges TO authenticated;
GRANT SELECT ON user_points TO authenticated;
GRANT SELECT ON seasons TO authenticated;
