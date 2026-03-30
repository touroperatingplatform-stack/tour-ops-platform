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
  last_name,
  role,
  status
FROM profiles
WHERE role = 'guide'
AND status = 'active'
ORDER BY first_name;

-- List all drivers
SELECT 
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  dp.license_number,
  dp.driver_type
FROM profiles p
JOIN driver_profiles dp ON p.id = dp.profile_id
WHERE p.role = 'driver'
AND p.status = 'active'
ORDER BY p.first_name;

-- List all supervisors
SELECT 
  id,
  email,
  first_name,
  last_name
FROM profiles
WHERE role = 'supervisor'
AND status = 'active'
ORDER BY first_name;

-- List all ops directors
SELECT 
  id,
  email,
  first_name,
  last_name
FROM profiles
WHERE role = 'ops_director'
AND status = 'active'
ORDER BY first_name;

-- Summary: Total active users
SELECT COUNT(*) as total_active_users FROM profiles WHERE status = 'active';
