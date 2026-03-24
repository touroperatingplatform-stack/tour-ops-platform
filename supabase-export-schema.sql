-- Export Current Database Schema
-- Run this in Supabase SQL Editor and copy the results

-- ============================================
-- LIST ALL TABLES
-- ============================================
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================
-- GET COLUMN DETAILS FOR EACH TABLE
-- ============================================
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- ============================================
-- GET CONSTRAINTS (PRIMARY KEYS, UNIQUE, etc)
-- ============================================
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  contype AS constraint_type,
  conkey AS columns
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
ORDER BY conrelid::regclass::text, contype;

-- ============================================
-- GET PROFILES TABLE STRUCTURE (most important)
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- ============================================
-- GET TOURS TABLE STRUCTURE
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'tours'
ORDER BY ordinal_position;

-- ============================================
-- GET VEHICLES TABLE STRUCTURE
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'vehicles'
ORDER BY ordinal_position;

-- ============================================
-- SAMPLE DATA FROM KEY TABLES
-- ============================================
SELECT 'profiles' as table_name, count(*) as row_count FROM profiles
UNION ALL
SELECT 'tours', count(*) FROM tours
UNION ALL
SELECT 'vehicles', count(*) FROM vehicles
UNION ALL
SELECT 'incidents', count(*) FROM incidents
UNION ALL
SELECT 'expenses', count(*) FROM expenses
UNION ALL
SELECT 'settings', count(*) FROM settings;
