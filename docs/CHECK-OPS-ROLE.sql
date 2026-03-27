-- Check the ops@lifeoperations.com user role
-- Run this in Supabase SQL Editor

-- Check auth user metadata
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as auth_role
FROM auth.users 
WHERE email = 'ops@lifeoperations.com';

-- Check profiles table
SELECT 
  id,
  email,
  role,
  first_name,
  last_name
FROM profiles 
WHERE email = 'ops@lifeoperations.com';

-- Check if profile exists but role is wrong
SELECT 
  p.id,
  p.email,
  p.role as profile_role,
  u.raw_user_meta_data->>'role' as auth_role
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE p.email = 'ops@lifeoperations.com';
