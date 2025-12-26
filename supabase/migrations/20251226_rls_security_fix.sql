-- ============================================
-- CRITICAL SECURITY FIX: RLS for All Sensitive Tables
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. ENABLE RLS ON ALL TABLES (idempotent)
ALTER TABLE IF EXISTS cfo_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS global_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS team_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS competitions ENABLE ROW LEVEL SECURITY;

-- 2. DROP OLD PERMISSIVE POLICIES
DROP POLICY IF EXISTS "Allow all for now" ON cfo_applications;
DROP POLICY IF EXISTS "Allow all" ON chat_messages;
DROP POLICY IF EXISTS "Allow all" ON global_chat_messages;
DROP POLICY IF EXISTS "Allow all" ON team_members;
DROP POLICY IF EXISTS "Allow all" ON team_submissions;
DROP POLICY IF EXISTS "anon_access" ON cfo_applications;
DROP POLICY IF EXISTS "public_access" ON chat_messages;

-- ============================================
-- CFO_APPLICATIONS (SENSITIVE)
-- ============================================
DROP POLICY IF EXISTS "Service role full access on cfo_applications" ON cfo_applications;
DROP POLICY IF EXISTS "Users read own applications" ON cfo_applications;
DROP POLICY IF EXISTS "Users insert own applications" ON cfo_applications;

CREATE POLICY "service_role_cfo_apps"
  ON cfo_applications FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "users_read_own_cfo_apps"
  ON cfo_applications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_cfo_apps"
  ON cfo_applications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- CHAT_MESSAGES (Team Chat)
-- ============================================
DROP POLICY IF EXISTS "service_role_chat" ON chat_messages;
DROP POLICY IF EXISTS "team_members_read_chat" ON chat_messages;
DROP POLICY IF EXISTS "team_members_insert_chat" ON chat_messages;

CREATE POLICY "service_role_chat"
  ON chat_messages FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Users can read messages from teams they belong to
CREATE POLICY "team_members_read_chat"
  ON chat_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = chat_messages.team_id 
      AND team_members.user_id = auth.uid()
    )
  );

-- Users can insert messages to teams they belong to
CREATE POLICY "team_members_insert_chat"
  ON chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = chat_messages.team_id 
      AND team_members.user_id = auth.uid()
    )
  );

-- ============================================
-- GLOBAL_CHAT_MESSAGES
-- ============================================
DROP POLICY IF EXISTS "service_role_global_chat" ON global_chat_messages;
DROP POLICY IF EXISTS "authenticated_read_global_chat" ON global_chat_messages;
DROP POLICY IF EXISTS "authenticated_insert_global_chat" ON global_chat_messages;

CREATE POLICY "service_role_global_chat"
  ON global_chat_messages FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- All authenticated users can read global chat
CREATE POLICY "authenticated_read_global_chat"
  ON global_chat_messages FOR SELECT TO authenticated
  USING (true);

-- All authenticated users can post to global chat
CREATE POLICY "authenticated_insert_global_chat"
  ON global_chat_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

-- ============================================
-- TEAM_MEMBERS
-- ============================================
DROP POLICY IF EXISTS "service_role_team_members" ON team_members;
DROP POLICY IF EXISTS "authenticated_read_team_members" ON team_members;

CREATE POLICY "service_role_team_members"
  ON team_members FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Authenticated users can read team members (for team display)
CREATE POLICY "authenticated_read_team_members"
  ON team_members FOR SELECT TO authenticated
  USING (true);

-- ============================================
-- TEAM_SUBMISSIONS
-- ============================================
DROP POLICY IF EXISTS "service_role_submissions" ON team_submissions;
DROP POLICY IF EXISTS "team_members_read_submissions" ON team_submissions;
DROP POLICY IF EXISTS "team_members_insert_submissions" ON team_submissions;

CREATE POLICY "service_role_submissions"
  ON team_submissions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Team members can read their team's submissions
CREATE POLICY "team_members_read_submissions"
  ON team_submissions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = team_submissions.team_id 
      AND team_members.user_id = auth.uid()
    )
  );

-- Team members can submit for their team
CREATE POLICY "team_members_insert_submissions"
  ON team_submissions FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid()::text = submitted_by AND
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = team_submissions.team_id 
      AND team_members.user_id = auth.uid()
    )
  );

-- ============================================
-- TEAMS
-- ============================================
DROP POLICY IF EXISTS "service_role_teams" ON teams;
DROP POLICY IF EXISTS "authenticated_read_teams" ON teams;

CREATE POLICY "service_role_teams"
  ON teams FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_read_teams"
  ON teams FOR SELECT TO authenticated
  USING (true);

-- ============================================
-- COMPETITIONS (Public read, admin write)
-- ============================================
DROP POLICY IF EXISTS "service_role_competitions" ON competitions;
DROP POLICY IF EXISTS "public_read_competitions" ON competitions;

CREATE POLICY "service_role_competitions"
  ON competitions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Anyone can read competitions (public listing)
CREATE POLICY "public_read_competitions"
  ON competitions FOR SELECT TO authenticated, anon
  USING (true);

-- ============================================
-- USER_PROFILES
-- ============================================
DROP POLICY IF EXISTS "service_role_profiles" ON user_profiles;
DROP POLICY IF EXISTS "users_read_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON user_profiles;

CREATE POLICY "service_role_profiles"
  ON user_profiles FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "users_read_own_profile"
  ON user_profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_update_own_profile"
  ON user_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- VERIFY RLS IS ENABLED
-- ============================================
-- Run this to check:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
