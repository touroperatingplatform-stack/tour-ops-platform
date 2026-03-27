-- Check RLS status and policies on guide_checkins table
-- Run this in Supabase SQL Editor to see current state

-- Check if RLS is enabled
SELECT 
  relname AS table_name,
  relrowsecurity AS rls_enabled,
  CASE WHEN relrowsecurity THEN 'ENABLED' ELSE 'DISABLED' END AS rls_status
FROM pg_class 
WHERE relname = 'guide_checkins';

-- Check existing policies
SELECT 
  policyname AS policy_name,
  permissive,
  cmd AS command,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'guide_checkins'
ORDER BY policyname;

-- Also check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'guide_checkins'
ORDER BY ordinal_position;
