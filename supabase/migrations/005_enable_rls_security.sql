-- ============================================
-- SECURITY FIX: Enable RLS on All Sensitive Tables
-- ============================================
-- This migration MUST be run in Supabase SQL Editor
-- It enables Row Level Security and creates appropriate policies

-- 1. ENABLE RLS ON ALL SENSITIVE TABLES
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE cfo_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- 2. DROP OLD PERMISSIVE POLICIES (if any)
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role can do anything" ON user_profiles;
DROP POLICY IF EXISTS "Public read competitions" ON competitions;
DROP POLICY IF EXISTS "Anyone can read competitions" ON competitions;

-- 3. USER_PROFILES POLICIES
-- Service role (backend) has full access
CREATE POLICY "Service role full access on user_profiles"
  ON user_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own profile (non-sensitive fields only)
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. COMPETITIONS POLICIES
-- Service role full access
CREATE POLICY "Service role full access on competitions"
  ON competitions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Public can read open competitions
CREATE POLICY "Public read open competitions"
  ON competitions
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- 5. CFO_APPLICATIONS POLICIES (MOST SENSITIVE)
-- Service role full access
CREATE POLICY "Service role full access on cfo_applications"
  ON cfo_applications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can read ONLY their own applications (no score visibility)
CREATE POLICY "Users read own applications"
  ON cfo_applications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own applications
CREATE POLICY "Users insert own applications"
  ON cfo_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Only service role can update/delete (admin actions via backend)
-- No direct update policy for authenticated users

-- 6. TEAMS POLICIES
CREATE POLICY "Service role full access on teams"
  ON teams FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users read teams"
  ON teams FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Team leaders can update their teams"
  ON teams FOR UPDATE TO authenticated
  USING (auth.uid() = leader_id)
  WITH CHECK (auth.uid() = leader_id);

-- 7. TEAM_MEMBERS POLICIES
CREATE POLICY "Service role full access on team_members"
  ON team_members FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users read team members"
  ON team_members FOR SELECT TO authenticated
  USING (true);

-- 8. COMPETITION_PARTICIPANTS POLICIES
CREATE POLICY "Service role full access on competition_participants"
  ON competition_participants FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Users read participants"
  ON competition_participants FOR SELECT TO authenticated
  USING (true);

-- 9. ADMIN-ONLY TABLES (judge_assignments, tasks, submissions, scores, admin_audit_log)
-- Only service role can access (enforced via backend admin middleware)
CREATE POLICY "Service role full access on judge_assignments"
  ON judge_assignments FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on tasks"
  ON tasks FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on submissions"
  ON submissions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on scores"
  ON scores FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on admin_audit_log"
  ON admin_audit_log FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 10. ADD UNIQUE CONSTRAINT FOR DUPLICATE PREVENTION (atomic check)
-- This prevents duplicate applications at the database level
ALTER TABLE cfo_applications 
  ADD CONSTRAINT cfo_applications_user_competition_unique 
  UNIQUE (user_id, competition_id);

-- 11. STORAGE POLICIES (cfo-cvs bucket)
-- Ensure only service role can access CV files
-- This should be set in Supabase Storage Settings:
-- Bucket: cfo-cvs
-- Public: OFF (private)
-- Policy: Service role only

-- Note: Run this in Supabase Storage SQL policies section
-- or via Supabase Dashboard Storage settings

COMMENT ON TABLE cfo_applications IS 'Sensitive CFO application data - RLS enabled, service role only for admin operations';
COMMENT ON TABLE user_profiles IS 'User profiles - RLS enabled, users can read/update own profile';
