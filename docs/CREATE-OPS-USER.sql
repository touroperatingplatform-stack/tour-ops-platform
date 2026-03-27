-- Create an operations user for testing
-- Run this in Supabase SQL Editor

-- Step 1: Create auth user (use a real email you can access)
-- You'll need to confirm the email or use invite link

-- Option A: If you want to create via SQL (requires email confirmation)
SELECT auth.admin_create_user(
  'operations@test.com',
  'operations123',
  'operations@test.com'
);

-- Option B: Easier - just sign up via the login page with operations@test.com
-- Then run this to set the role:

-- Step 2: Set the role (run after user signs up or is created)
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "operations"}'::jsonb
WHERE email = 'operations@test.com';

-- Also update profiles table
UPDATE profiles 
SET role = 'operations'
WHERE email = 'operations@test.com';

-- Verify
SELECT email, raw_user_meta_data->>'role' as role 
FROM auth.users 
WHERE email = 'operations@test.com';
