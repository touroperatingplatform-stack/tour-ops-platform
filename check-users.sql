-- Count users by role
SELECT 
  role,
  COUNT(*) as user_count
FROM profiles
WHERE status = 'active'
GROUP BY role
ORDER BY user_count DESC;

-- List all guides
SELECT 
  id,
  email,
  first_name,
  last_name
FROM profiles
WHERE role = 'guide'
AND status = 'active'
ORDER BY first_name;

-- List all drivers
SELECT 
  p.email,
  p.first_name,
  p.last_name,
  dp.license_number
FROM profiles p
JOIN driver_profiles dp ON p.id = dp.profile_id
WHERE p.role = 'driver'
AND p.status = 'active';

-- Total active users
SELECT COUNT(*) as total FROM profiles WHERE status = 'active';
