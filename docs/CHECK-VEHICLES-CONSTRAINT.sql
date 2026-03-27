-- Check if unique constraint exists on vehicles.plate_number
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.vehicles'::regclass
AND contype = 'u';

-- Check current user's profile
SELECT 
  auth.uid() as current_user_id,
  p.id as profile_id,
  p.role as profile_role,
  p.email as profile_email
FROM profiles p
WHERE p.id = auth.uid();
