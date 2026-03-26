-- ============================================
-- USER ROLE UPDATE SCRIPT
-- Demo Configuration for Trial Day
-- ============================================
-- Run this in Supabase SQL Editor
-- Date: 2026-03-26
-- ============================================

-- Update Super Admin (1 user)
UPDATE profiles 
SET role = 'super_admin' 
WHERE email = 'super@lifeoperations.com';

-- Update Supervisor (1 user)
UPDATE profiles 
SET role = 'supervisor' 
WHERE email = 'sup@lifeoperations.com';

-- Update Manager (1 user)
UPDATE profiles 
SET role = 'manager' 
WHERE email = 'manager@lifeoperations.com';

-- Update all others to guide role
UPDATE profiles 
SET role = 'guide' 
WHERE email NOT IN (
  'super@lifeoperations.com',
  'sup@lifeoperations.com',
  'manager@lifeoperations.com'
);

-- Verify the changes
SELECT 
  role, 
  COUNT(*) as count,
  array_agg(email) as users
FROM profiles
GROUP BY role
ORDER BY role;

-- ============================================
-- EXPECTED RESULT:
-- super_admin: 1
-- supervisor: 1
-- manager: 1
-- guide: 15
-- ============================================
