-- ModEX Platform - Chat Messages Table
-- Supports team chat functionality

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  content TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_team ON chat_messages(team_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);
