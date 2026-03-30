-- Update admin@lifeoperations.com to company_admin role
-- Run this in Supabase SQL Editor

UPDATE profiles 
SET role = 'company_admin' 
WHERE email = 'admin@lifeoperations.com';

-- Verify the update
SELECT 
  id,
  email,
  role,
  first_name,
  last_name
FROM profiles 
WHERE email = 'admin@lifeoperations.com';
