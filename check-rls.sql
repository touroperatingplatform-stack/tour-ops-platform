-- Check ALL policies on tours
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'tours';

-- Check if RLS is enabled
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'tours';
