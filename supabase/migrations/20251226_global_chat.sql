-- Global Chat Messages Table
-- For platform-wide chat accessible to all authenticated users
-- Created: 2025-12-26

-- Create table
CREATE TABLE IF NOT EXISTS global_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_global_chat_created_at ON global_chat_messages(created_at DESC);

-- Enable RLS
ALTER TABLE global_chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read all messages
CREATE POLICY "read_all" ON global_chat_messages
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert their own messages
CREATE POLICY "insert_authenticated" ON global_chat_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE global_chat_messages;
