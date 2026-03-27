-- ============================================
-- DIAGNOSE DEMO DATA LINKING ISSUES
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Check what tours exist and their dates
SELECT 
  id,
  name,
  tour_date,
  start_time,
  status,
  guide_id,
  brand_id,
  guest_count,
  created_at
FROM tours
ORDER BY created_at DESC
LIMIT 20;

-- 2. Check incidents and their tour_id links
SELECT 
  i.id,
  i.tour_id,
  i.type,
  i.severity,
  i.description,
  i.created_at,
  t.name as tour_name,
  t.tour_date as tour_date
FROM incidents i
LEFT JOIN tours t ON t.id = i.tour_id
ORDER BY i.created_at DESC
LIMIT 20;

-- 3. Check if tour_date matches today (both Cancun and UTC)
SELECT 
  COUNT(*) as total_tours,
  tour_date,
  COUNT(*) as tours_per_date
FROM tours
GROUP BY tour_date
ORDER BY tour_date DESC;

-- 4. Check guests and their tour_id links
SELECT 
  g.id,
  g.tour_id,
  g.first_name,
  g.last_name,
  t.name as tour_name
FROM guests g
LEFT JOIN tours t ON t.id = g.tour_id
ORDER BY g.created_at DESC
LIMIT 20;

-- 5. Check guide_checkins and their tour_id links
SELECT 
  gc.id,
  gc.tour_id,
  gc.guide_id,
  gc.checkin_type,
  gc.checked_in_at,
  t.name as tour_name,
  p.first_name as guide_first_name,
  p.last_name as guide_last_name
FROM guide_checkins gc
LEFT JOIN tours t ON t.id = gc.tour_id
LEFT JOIN profiles p ON p.id = gc.guide_id
ORDER BY gc.checked_in_at DESC
LIMIT 20;

-- 6. Check vehicles (operations dashboard needs these)
SELECT 
  id,
  model,
  plate_number,
  status,
  capacity,
  created_at
FROM vehicles
ORDER BY created_at DESC
LIMIT 20;

-- 7. Check today's date in both timezones
SELECT 
  NOW() as utc_now,
  NOW() AT TIME ZONE 'America/Cancun' as cancun_now,
  DATE(NOW()) as utc_date,
  DATE(NOW() AT TIME ZONE 'America/Cancun') as cancun_date;

-- 8. Check RLS policies on tours table
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
WHERE tablename = 'tours';

-- ============================================
-- KEY QUESTIONS TO ANSWER:
-- 1. Do tours have tour_date = '2026-03-26' or '2026-03-27'?
-- 2. Do incidents/guests/checkins have tour_id set (not NULL)?
-- 3. Do the tour_ids actually exist in tours table?
-- 4. Are vehicles in the database?
-- 5. Are RLS policies blocking the queries?
-- ============================================
