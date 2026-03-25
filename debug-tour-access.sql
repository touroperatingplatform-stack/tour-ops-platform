-- Check tour access
SELECT t.id, t.name, t.status, t.guide_id, p.email as guide_email
FROM tours t
JOIN profiles p ON t.guide_id = p.id
WHERE t.name = 'Tulum Test Tour';

-- Check if there are RLS policies blocking access
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'tours';
