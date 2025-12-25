-- Fix chat_messages table for production use
-- Run this in Supabase SQL Editor

-- 1. Enable realtime for chat_messages table
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- 2. Disable RLS temporarily (or create proper policies)
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;

-- 3. Enable replica identity for realtime to work properly
ALTER TABLE chat_messages REPLICA IDENTITY FULL;

-- 4. Grant necessary permissions
GRANT ALL ON chat_messages TO authenticated;
GRANT ALL ON chat_messages TO service_role;
GRANT ALL ON chat_messages TO anon;

-- 5. If table doesn't exist, create it
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  content TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ
);

-- 6. Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_team ON chat_messages(team_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);
