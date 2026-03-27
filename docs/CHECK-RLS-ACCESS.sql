-- ============================================
-- CHECK RLS ACCESS FOR SUPERVISOR ROLE
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Check what role your current user has
SELECT 
  auth.uid() as current_user_id,
  role
FROM profiles
WHERE id = auth.uid();

-- 2. Check all RLS policies on tours table
SELECT 
  policyname,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'tours'
ORDER BY cmd, policyname;

-- 3. Test if current user can query tours
SELECT COUNT(*) as can_access_tours
FROM tours;

-- 4. Check if there's a policy for 'supervisor' role
SELECT 
  policyname,
  roles
FROM pg_policies
WHERE tablename = 'tours'
  AND roles::text LIKE '%supervisor%';

-- 5. Check all profiles and their roles
SELECT 
  id,
  email,
  role,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 20;

-- 6. Check if RLS is enabled on tours
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'tours';

-- ============================================
-- EXPECTED ISSUE:
-- If you're logged in as 'supervisor' role,
-- there's NO SELECT policy allowing supervisors
-- to view tours. Only super_admin and guides
-- (for their own tours) have access.
--
-- FIX: Add a policy like:
-- CREATE POLICY "Supervisors can view all tours"
-- ON tours FOR SELECT
-- TO authenticated
-- USING (
--   EXISTS (
--     SELECT 1 FROM profiles
--     WHERE profiles.id = auth.uid()
--     AND profiles.role IN ('supervisor', 'manager', 'operations')
--   )
-- );
-- ============================================
