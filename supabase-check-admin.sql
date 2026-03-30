-- Check if admin@lifeoperations.com exists and get their role
-- Run this in Supabase SQL Editor

-- 1. Check profile for admin@lifeoperations.com
SELECT 
  p.id,
  p.email,
  p.role,
  p.first_name,
  p.last_name,
  p.created_at,
  p.company_id
FROM profiles p
WHERE p.email = 'admin@lifeoperations.com';

-- 2. Check by UID if you know it
SELECT 
  p.id,
  p.email,
  p.role,
  p.first_name,
  p.last_name
FROM profiles p
WHERE p.id = '7b0d216f-7a23-44ea-b075-cb919b5424c1';

-- 3. List all users with super_admin role
SELECT 
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.created_at
FROM profiles p
WHERE p.role = 'super_admin';

-- 4. If user exists but wrong role, update to super_admin:
-- UPDATE profiles SET role = 'super_admin' WHERE id = '7b0d216f-7a23-44ea-b075-cb919b5424c1';

-- 5. Check auth.users table (requires proper permissions)
SELECT 
  id,
  email,
  created_at
FROM auth.users
WHERE email = 'admin@lifeoperations.com';
