-- Phase 3: Global User Profile Migration (FINAL)
-- Run this in Supabase SQL Editor

-- ============================================
-- ADD NEW COLUMNS TO user_profiles TABLE
-- ============================================

-- Profile completion flag
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;

-- Personal & Contact
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS country TEXT;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS mobile_number TEXT;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT FALSE;

-- Professional Snapshot
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS job_title TEXT;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS company_name TEXT;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS industry TEXT;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS years_of_experience TEXT;

-- Professional Presence
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- Certifications (stored as JSON array)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb;

-- ============================================
-- CREATE INDEX FOR FAST LOOKUPS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_profile_completed 
ON user_profiles(profile_completed);

-- ============================================
-- VERIFY MIGRATION
-- ============================================

SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- ============================================
-- EXPECTED COLUMNS AFTER MIGRATION:
-- ============================================
-- id (uuid)
-- email (text)
-- full_name (text)
-- role (text)
-- created_at (timestamp)
-- updated_at (timestamp)
-- profile_completed (boolean, default false)
-- country (text)
-- preferred_language (text, default 'en')
-- mobile_number (text)
-- whatsapp_enabled (boolean, default false)
-- job_title (text)
-- company_name (text)
-- industry (text)
-- years_of_experience (text)
-- linkedin_url (text)
-- certifications (jsonb, default '[]')
