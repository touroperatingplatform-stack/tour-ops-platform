-- Check what's actually in the database for admin@lifeoperations.com

-- 1. Check if auth user exists
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'admin@lifeoperations.com';

-- 2. Check if profile exists
SELECT id, email, role 
FROM profiles 
WHERE email = 'admin@lifeoperations.com';

-- 3. Check by the UID you provided
SELECT id, email, role 
FROM profiles 
WHERE id = '7b0d216f-7a23-44ea-b075-cb919b5424c1';

-- 4. List all company_admin users
SELECT id, email, role, first_name, last_name
FROM profiles 
WHERE role = 'company_admin';

-- 5. If profile doesn't exist, create it:
INSERT INTO profiles (id, email, role, created_at)
VALUES ('7b0d216f-7a23-44ea-b075-cb919b5424c1', 'admin@lifeoperations.com', 'company_admin', NOW());
