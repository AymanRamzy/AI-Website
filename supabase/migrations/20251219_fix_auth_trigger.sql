-- Fix for Supabase Auth 500 errors during signup
-- Run this in your Supabase SQL Editor

-- 1. Check for any triggers on auth.users that might be causing issues
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
AND event_object_table = 'users';

-- 2. If you have a trigger that creates a user_profile automatically, 
-- make sure it has SECURITY DEFINER set. Here's the correct way to do it:

-- First, drop any existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the function with SECURITY DEFINER (this allows it to bypass RLS)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'participant',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 4. Make sure RLS is configured correctly (or disabled for testing)
-- Option A: Disable RLS for now (for testing)
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE competitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE cfo_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE judge_assignments DISABLE ROW LEVEL SECURITY;

-- 5. Alternative: Enable RLS with proper policies
-- Uncomment these if you want RLS enabled:
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view their own profile" ON user_profiles
--   FOR SELECT USING (auth.uid() = id);
-- CREATE POLICY "Users can update their own profile" ON user_profiles
--   FOR UPDATE USING (auth.uid() = id);
-- CREATE POLICY "Service role can do anything" ON user_profiles
--   FOR ALL USING (current_setting('role') = 'service_role');

-- 6. Check Supabase Auth settings in Dashboard
-- Go to: Authentication > Settings
-- Make sure "Enable email confirmations" is OFF for testing
-- Or ensure SMTP is properly configured
