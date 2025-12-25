-- CFO Application Board-Approved Changes Migration
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. ADD NEW COLUMN: cfo_readiness_commitment (merged question)
-- ============================================
ALTER TABLE cfo_applications
ADD COLUMN IF NOT EXISTS cfo_readiness_commitment TEXT;

-- ============================================
-- 2. ADD CV UPLOAD COLUMNS
-- ============================================
ALTER TABLE cfo_applications
ADD COLUMN IF NOT EXISTS cv_url TEXT;

ALTER TABLE cfo_applications
ADD COLUMN IF NOT EXISTS cv_uploaded_at TIMESTAMP WITH TIME ZONE;

-- ============================================
-- 3. CREATE STORAGE BUCKET FOR CVs
-- ============================================
-- IMPORTANT: Run this in Supabase Dashboard > Storage > Create bucket
-- Name: cfo-cvs
-- Public: false (PRIVATE - service role only)
--
-- OR run this SQL with storage admin rights:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cfo-cvs', 
  'cfo-cvs', 
  false, 
  5242880,  -- 5MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880;

-- ============================================
-- 4. STORAGE POLICY (Service Role Only Access)
-- ============================================
-- Delete any existing policies first
DROP POLICY IF EXISTS "Service role can manage CV files" ON storage.objects;

-- Create policy for service role only (backend uses service role key)
CREATE POLICY "Service role can manage CV files"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'cfo-cvs')
WITH CHECK (bucket_id = 'cfo-cvs');

-- ============================================
-- VERIFY MIGRATION
-- ============================================
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'cfo_applications'
AND column_name IN ('cfo_readiness_commitment', 'cv_url', 'cv_uploaded_at');

-- Verify bucket exists
SELECT id, name, public FROM storage.buckets WHERE id = 'cfo-cvs';
