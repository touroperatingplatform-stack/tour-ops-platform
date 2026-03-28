-- Setup Test Driver Profiles
-- Run this in Supabase SQL Editor after creating auth users

-- First, get the user IDs for the test drivers
-- You may need to replace the UUIDs below with actual IDs from auth.users

-- Find user IDs (run this first to get actual IDs)
SELECT id, email, role 
FROM auth.users 
WHERE email IN (
  'driver1@lifeoperations.com',
  'driver2@lifeoperations.com', 
  'driver3@lifeoperations.com',
  'felipe@lifeoperations.com'
);

-- Once you have the IDs, update the profiles table role to 'driver'
UPDATE profiles 
SET role = 'driver'
WHERE email IN (
  'driver1@lifeoperations.com',
  'driver2@lifeoperations.com', 
  'driver3@lifeoperations.com',
  'felipe@lifeoperations.com'
);

-- Create driver_profiles records
-- REPLACE THE UUIDs BELOW with actual IDs from the SELECT query above

-- Felipe (External/Freelance)
INSERT INTO driver_profiles (profile_id, license_number, license_expiry, driver_type, hire_date, status)
SELECT 
  id,
  'LIC-FEL-001',
  '2027-12-31',
  'freelance',
  '2025-01-15',
  'active'
FROM profiles 
WHERE email = 'felipe@lifeoperations.com'
ON CONFLICT DO NOTHING;

-- Driver 1 (Internal/Employee)
INSERT INTO driver_profiles (profile_id, license_number, license_expiry, driver_type, hire_date, status)
SELECT 
  id,
  'LIC-DRV1-001',
  '2027-06-30',
  'employee',
  '2025-03-01',
  'active'
FROM profiles 
WHERE email = 'driver1@lifeoperations.com'
ON CONFLICT DO NOTHING;

-- Driver 2 (Internal/Employee)
INSERT INTO driver_profiles (profile_id, license_number, license_expiry, driver_type, hire_date, status)
SELECT 
  id,
  'LIC-DRV2-001',
  '2027-08-15',
  'employee',
  '2025-04-10',
  'active'
FROM profiles 
WHERE email = 'driver2@lifeoperations.com'
ON CONFLICT DO NOTHING;

-- Driver 3 (Internal/Employee)
INSERT INTO driver_profiles (profile_id, license_number, license_expiry, driver_type, hire_date, status)
SELECT 
  id,
  'LIC-DRV3-001',
  '2027-09-20',
  'employee',
  '2025-05-01',
  'active'
FROM profiles 
WHERE email = 'driver3@lifeoperations.com'
ON CONFLICT DO NOTHING;

-- Verify setup
SELECT 
  p.email,
  p.role,
  dp.driver_type,
  dp.license_number,
  dp.license_expiry,
  dp.status as driver_status
FROM profiles p
LEFT JOIN driver_profiles dp ON dp.profile_id = p.id
WHERE p.email IN (
  'driver1@lifeoperations.com',
  'driver2@lifeoperations.com', 
  'driver3@lifeoperations.com',
  'felipe@lifeoperations.com'
);
