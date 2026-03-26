-- ============================================================
-- DIAGNOSE RLS POLICIES
-- Run this in Supabase SQL Editor to see current policies
-- ============================================================

-- Show all RLS policies on our tables
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_condition,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'tours', 'guests', 'pickup_stops', 'guide_checkins',
    'incidents', 'tour_expenses', 'guest_feedback', 
    'activity_feed'
  )
ORDER BY tablename, policyname;

-- ============================================================
-- Check the profiles table to see user roles
-- ============================================================
SELECT 
  id,
  email,
  role,
  status,
  created_at
FROM profiles
WHERE email LIKE '%lifeoperations%'
ORDER BY created_at;

-- ============================================================
-- Check if tours table has any foreign key constraints
-- that might be blocking inserts
-- ============================================================
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'tours';

-- ============================================================
-- Check RLS status on each table
-- ============================================================
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'tours', 'guests', 'pickup_stops', 'guide_checkins',
    'incidents', 'tour_expenses', 'guest_feedback', 
    'activity_feed'
  )
ORDER BY tablename;
