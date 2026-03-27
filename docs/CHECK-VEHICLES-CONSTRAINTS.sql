-- Check vehicles table constraints
SELECT 
  conname as constraint_name,
  contype as type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.vehicles'::regclass;
