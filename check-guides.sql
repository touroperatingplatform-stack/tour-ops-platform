-- Check existing guide users
SELECT id, email, first_name, last_name, role 
FROM profiles 
WHERE role IN ('guide', 'supervisor', 'manager', 'admin')
ORDER BY email;
