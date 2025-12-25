/*
  # Create Initial CFO Competition Platform Schema

  ## Overview
  This migration creates the complete database schema for the CFO competition platform,
  replacing the MongoDB structure with PostgreSQL tables.

  ## New Tables
  
  ### 1. `user_profiles`
  Extends Supabase Auth with custom user data:
  - `id` (uuid, references auth.users) - User ID from Supabase Auth
  - `full_name` (text) - User's full name
  - `role` (text) - User role: participant, judge, or admin
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last profile update timestamp

  ### 2. `competitions`
  Competition details and management:
  - `id` (uuid, primary key) - Competition unique identifier
  - `title` (text) - Competition title
  - `description` (text) - Detailed competition description
  - `start_date` (timestamptz) - Competition start date
  - `end_date` (timestamptz) - Competition end date
  - `registration_deadline` (timestamptz) - Last date to register
  - `max_teams` (integer) - Maximum teams allowed (default 8)
  - `registered_teams` (integer) - Current registered team count (default 0)
  - `status` (text) - Competition status: upcoming, registration_open, in_progress, completed
  - `created_at` (timestamptz) - Competition creation timestamp

  ### 3. `competition_participants`
  Tracks individual user registrations for competitions:
  - `id` (uuid, primary key) - Registration unique identifier
  - `competition_id` (uuid, foreign key) - References competitions table
  - `user_id` (uuid, foreign key) - References auth.users
  - `user_name` (text) - Cached user full name
  - `user_email` (text) - Cached user email
  - `registration_date` (timestamptz) - Registration timestamp
  - `status` (text) - Registration status (default 'registered')

  ### 4. `teams`
  Team structure and metadata:
  - `id` (uuid, primary key) - Team unique identifier
  - `team_name` (text) - Team display name
  - `competition_id` (uuid, foreign key) - References competitions table
  - `leader_id` (uuid, foreign key) - References auth.users (team leader)
  - `max_members` (integer) - Maximum team size (default 5)
  - `status` (text) - Team status: forming, complete, disqualified
  - `created_at` (timestamptz) - Team creation timestamp

  ### 5. `team_members`
  Individual team memberships with roles:
  - `id` (uuid, primary key) - Membership unique identifier
  - `team_id` (uuid, foreign key) - References teams table
  - `user_id` (uuid, foreign key) - References auth.users
  - `user_name` (text) - Cached user full name
  - `team_role` (text) - Member role: Leader, Analyst, Designer, Strategist, Communicator
  - `joined_at` (timestamptz) - Membership timestamp

  ### 6. `chat_messages`
  Team communication messages:
  - `id` (uuid, primary key) - Message unique identifier
  - `team_id` (uuid, foreign key) - References teams table
  - `user_id` (uuid, foreign key) - References auth.users
  - `user_name` (text) - Cached user full name
  - `message_type` (text) - Message type: text, image, file, system
  - `content` (text) - Message content/text
  - `file_url` (text, optional) - Attached file URL
  - `file_name` (text, optional) - Original file name
  - `file_size` (integer, optional) - File size in bytes
  - `timestamp` (timestamptz) - Message timestamp
  - `edited` (boolean) - Whether message was edited (default false)
  - `edited_at` (timestamptz, optional) - Last edit timestamp

  ## Security
  
  All tables have Row Level Security (RLS) enabled with the following policies:
  
  ### User Profiles
  - Users can read all profiles (needed for team member info)
  - Users can update only their own profile
  - Users can insert their own profile on signup
  
  ### Competitions
  - Anyone can read competitions
  - Only admins can create/update/delete competitions
  
  ### Competition Participants
  - Anyone can read participant lists
  - Users can register themselves
  - Only admins can delete registrations
  
  ### Teams
  - Anyone can read teams
  - Authenticated users can create teams
  - Only team leaders can update their team
  - Only team leaders can delete their team
  
  ### Team Members
  - Anyone can read team memberships
  - Users can add themselves to teams (via join)
  - Team leaders can update member roles
  - Users can remove themselves from teams
  
  ### Chat Messages
  - Only team members can read team messages
  - Only team members can send messages
  - Only message author can update/delete their messages

  ## Indexes
  - Foreign key indexes for optimal query performance
  - Competition status and dates for filtering
  - Team competition relationships
  - Chat message timestamps for chronological ordering
*/

-- Create custom types (enums)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('participant', 'judge', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE team_member_role AS ENUM ('Leader', 'Analyst', 'Designer', 'Strategist', 'Communicator');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE team_status AS ENUM ('forming', 'complete', 'disqualified');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE competition_status AS ENUM ('upcoming', 'registration_open', 'in_progress', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE message_type AS ENUM ('text', 'image', 'file', 'system');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1. User Profiles (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role user_role NOT NULL DEFAULT 'participant',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Competitions
CREATE TABLE IF NOT EXISTS competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  registration_deadline timestamptz NOT NULL,
  max_teams integer NOT NULL DEFAULT 8,
  registered_teams integer NOT NULL DEFAULT 0,
  status competition_status NOT NULL DEFAULT 'upcoming',
  created_at timestamptz DEFAULT now()
);

-- 3. Competition Participants
CREATE TABLE IF NOT EXISTS competition_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  user_email text NOT NULL,
  registration_date timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'registered',
  UNIQUE(competition_id, user_id)
);

-- 4. Teams
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name text NOT NULL,
  competition_id uuid NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  leader_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  max_members integer NOT NULL DEFAULT 5,
  status team_status NOT NULL DEFAULT 'forming',
  created_at timestamptz DEFAULT now()
);

-- 5. Team Members
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  team_role team_member_role,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- 6. Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  message_type message_type NOT NULL DEFAULT 'text',
  content text NOT NULL,
  file_url text,
  file_name text,
  file_size integer,
  timestamp timestamptz DEFAULT now(),
  edited boolean DEFAULT false,
  edited_at timestamptz
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_competition_participants_competition ON competition_participants(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_participants_user ON competition_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_teams_competition ON teams(competition_id);
CREATE INDEX IF NOT EXISTS idx_teams_leader ON teams(leader_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_team ON chat_messages(team_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_competitions_status ON competitions(status);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Anyone can read user profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for competitions
CREATE POLICY "Anyone can read competitions"
  ON competitions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert competitions"
  ON competitions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update competitions"
  ON competitions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete competitions"
  ON competitions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- RLS Policies for competition_participants
CREATE POLICY "Anyone can read participants"
  ON competition_participants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can register themselves"
  ON competition_participants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own registration"
  ON competition_participants FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for teams
CREATE POLICY "Anyone can read teams"
  ON teams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create teams"
  ON teams FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = leader_id);

CREATE POLICY "Leaders can update their team"
  ON teams FOR UPDATE
  TO authenticated
  USING (auth.uid() = leader_id)
  WITH CHECK (auth.uid() = leader_id);

CREATE POLICY "Leaders can delete their team"
  ON teams FOR DELETE
  TO authenticated
  USING (auth.uid() = leader_id);

-- RLS Policies for team_members
CREATE POLICY "Anyone can read team members"
  ON team_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join teams"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Leaders can update member roles"
  ON team_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND teams.leader_id = auth.uid()
    )
  );

CREATE POLICY "Users can leave teams"
  ON team_members FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND teams.leader_id = auth.uid()
    )
  );

-- RLS Policies for chat_messages
CREATE POLICY "Team members can read team messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = chat_messages.team_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can send messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = chat_messages.team_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Authors can update own messages"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authors can delete own messages"
  ON chat_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
