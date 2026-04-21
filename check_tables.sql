-- Run this in Supabase SQL Editor to check tables before applying RLS

-- Check if tables exist and see their structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name IN ('platform_settings', 'company_configs')
ORDER BY table_name, ordinal_position;

-- Check existing policies on these tables
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('platform_settings', 'company_configs');

-- Check if RLS is enabled
SELECT 
    relname as table_name,
    relrowsecurity as rls_enabled
FROM pg_class
WHERE relname IN ('platform_settings', 'company_configs');
