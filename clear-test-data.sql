-- Clear test data (handles existing tables only)

-- 1. Delete expenses first (references tours)
DELETE FROM expenses WHERE true;

-- 2. Delete incidents (references tours)
DELETE FROM incidents WHERE true;

-- 3. Delete tours (delete after child tables)
DELETE FROM tours WHERE true;

-- Verify
SELECT 'expenses' as table_name, COUNT(*) as count FROM expenses
UNION ALL SELECT 'incidents', COUNT(*) FROM incidents
UNION ALL SELECT 'tours', COUNT(*) FROM tours;
