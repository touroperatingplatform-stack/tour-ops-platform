-- Check which columns exist in problematic tables
-- Run this in Supabase SQL Editor

-- pickup_stops columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'pickup_stops'
ORDER BY ordinal_position;

-- guest_feedback columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'guest_feedback'
ORDER BY ordinal_position;

-- Check if these tables have RLS enabled
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('pickup_stops', 'guest_feedback');
