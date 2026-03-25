-- Check tour access for gude
SELECT t.id, t.name, t.status, p.email
FROM tours t
JOIN profiles p ON t.guide_id = p.id
WHERE p.email = 'gude@lifeoperations.com'
AND t.tour_date = CURRENT_DATE;

-- Check RLS policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'tours';
