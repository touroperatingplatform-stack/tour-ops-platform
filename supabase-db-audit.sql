-- ============================================
-- DATABASE AUDIT SCRIPT
-- Run this in Supabase SQL Editor to get full schema info
-- ============================================

-- 1. LIST ALL TABLES
-- ============================================
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. COUNT RECORDS IN KEY TABLES
-- ============================================
SELECT 'companies' as table_name, count(*) as row_count FROM companies
UNION ALL
SELECT 'brands', count(*) FROM brands
UNION ALL
SELECT 'profiles', count(*) FROM profiles
UNION ALL
SELECT 'tours', count(*) FROM tours
UNION ALL
SELECT 'vehicles', count(*) FROM vehicles
UNION ALL
SELECT 'incidents', count(*) FROM incidents
UNION ALL
SELECT 'expenses', count(*) FROM expenses
UNION ALL
SELECT 'settings', count(*) FROM settings
ORDER BY table_name;

-- 3. COMPANIES TABLE STRUCTURE
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'companies'
ORDER BY ordinal_position;

-- 4. BRANDS TABLE STRUCTURE
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'brands'
ORDER BY ordinal_position;

-- 5. PROFILES TABLE STRUCTURE
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 6. TOURS TABLE STRUCTURE
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'tours'
ORDER BY ordinal_position;

-- 7. VEHICLES TABLE STRUCTURE
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'vehicles'
ORDER BY ordinal_position;

-- 8. INCIDENTS TABLE STRUCTURE
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'incidents'
ORDER BY ordinal_position;

-- 9. EXPENSES TABLE STRUCTURE
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'expenses'
ORDER BY ordinal_position;

-- 10. SETTINGS TABLE STRUCTURE
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'settings'
ORDER BY ordinal_position;

-- 11. FOREIGN KEY CONSTRAINTS
-- ============================================
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS referenced_table,
  a.attname AS column_name,
  af.attname AS referenced_column
FROM pg_constraint c
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
JOIN pg_attribute af ON af.attrelid = c.confrelid AND af.attnum = ANY(c.confkey)
WHERE c.contype = 'f'
  AND c.connamespace = 'public'::regnamespace
ORDER BY conrelid::regclass::text, constraint_name;

-- 12. UNIQUE CONSTRAINTS
-- ============================================
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  a.attname AS column_name
FROM pg_constraint c
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
WHERE c.contype = 'u'
  AND c.connamespace = 'public'::regnamespace
ORDER BY conrelid::regclass::text, constraint_name;

-- 13. SAMPLE DATA - COMPANIES
-- ============================================
SELECT 'companies' as table_name, id, name FROM companies LIMIT 3;

-- 14. SAMPLE DATA - BRANDS
-- ============================================
SELECT 'brands' as table_name, id, name FROM brands LIMIT 3;

-- 15. SAMPLE DATA - PROFILES
-- ============================================
SELECT 'profiles' as table_name, id, first_name, last_name, role FROM profiles LIMIT 3;
