-- Debug: Check if tables exist and what columns they have

-- 1. Check checklist_completions
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'checklist_completions'
ORDER BY ordinal_position;

-- 2. Check cash_confirmations  
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'cash_confirmations'
ORDER BY ordinal_position;

-- 3. Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('checklist_completions', 'cash_confirmations');

-- 4. Check RLS policies
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('checklist_completions', 'cash_confirmations');

-- 5. Test INSERT as anon (simulating client insert)
-- This will fail if RLS blocks it
