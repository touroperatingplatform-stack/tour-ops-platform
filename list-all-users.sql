-- Get ALL users from profiles table with their roles
-- Run this in Supabase SQL Editor to see who we have

SELECT 
  id,
  first_name,
  last_name,
  email,
  role,
  company_id,
  created_at
FROM profiles
ORDER BY role, first_name;

-- Count by role
SELECT role, COUNT(*) as count
FROM profiles
GROUP BY role
ORDER BY count DESC;