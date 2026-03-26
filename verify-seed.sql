-- ==========================================
-- VERIFY SEED DATA IS COMPLETE
-- Run this to check all seed data was created
-- ==========================================

-- Check 1: Users with profiles
SELECT 'USERS' as check_type, 
  (SELECT COUNT(*) FROM profiles WHERE email LIKE '%@tour-ops.com' OR email LIKE '%@lifeoperations.com') as expected_10,
  (SELECT COUNT(*) FROM profiles WHERE role = 'guide') as guides,
  (SELECT COUNT(*) FROM profiles WHERE role = 'supervisor') as supervisors,
  (SELECT COUNT(*) FROM profiles WHERE role = 'operations') as operations,
  (SELECT COUNT(*) FROM profiles WHERE role = 'admin') as admins;

-- Check 2: Vehicles
SELECT 'VEHICLES' as check_type,
  (SELECT COUNT(*) FROM vehicles WHERE model LIKE '[TEST]%') as test_vehicles,
  (SELECT string_agg(make || ' ' || model, ', ') FROM vehicles WHERE model LIKE '[TEST]%') as vehicles_list;

-- Check 3: Tours for today
SELECT 'TOURS' as check_type,
  (SELECT COUNT(*) FROM tours WHERE name LIKE '[TEST]%' AND tour_date = CURRENT_DATE) as test_tours,
  (SELECT COUNT(*) FROM tours WHERE name LIKE '[TEST]%' AND status = 'in_progress' AND tour_date = CURRENT_DATE) as in_progress,
  (SELECT COUNT(*) FROM tours WHERE name LIKE '[TEST]%' AND status = 'scheduled' AND tour_date = CURRENT_DATE) as scheduled;

-- Check 4: Guide check-ins
SELECT 'GUIDE_CHECKINS' as check_type,
  (SELECT COUNT(*) FROM guide_checkins WHERE notes LIKE '[TEST]%') as test_checkins,
  (SELECT COUNT(*) FROM guide_checkins WHERE notes LIKE '[TEST]%' AND guide_id IN (SELECT id FROM profiles WHERE email = 'carlos@tour-ops.com')) as carlos_checkins,
  (SELECT COUNT(*) FROM guide_checkins WHERE notes LIKE '[TEST]%' AND guide_id IN (SELECT id FROM profiles WHERE email = 'maria@tour-ops.com')) as maria_checkins;

-- Check 5: Incidents
SELECT 'INCIDENTS' as check_type,
  (SELECT COUNT(*) FROM incidents WHERE description LIKE '[TEST]%') as test_incidents,
  (SELECT COUNT(*) FROM incidents WHERE description LIKE '[TEST]%' AND status = 'reported') as reported,
  (SELECT COUNT(*) FROM incidents WHERE description LIKE '[TEST]%' AND status = 'acknowledged') as acknowledged,
  (SELECT COUNT(*) FROM incidents WHERE description LIKE '[TEST]%' AND status = 'closed') as closed;

-- Check 6: Expenses
SELECT 'EXPENSES' as check_type,
  (SELECT COUNT(*) FROM expenses WHERE description LIKE '[TEST]%') as test_expenses,
  (SELECT COUNT(*) FROM expenses WHERE description LIKE '[TEST]%' AND status = 'pending') as pending,
  (SELECT COUNT(*) FROM expenses WHERE description LIKE '[TEST]%' AND status = 'approved') as approved,
  (SELECT COUNT(*) FROM expenses WHERE description LIKE '[TEST]%' AND status = 'rejected') as rejected;

-- Summary: Show actual data
SELECT '=== TOURS TODAY ===' as section;
SELECT name, status, guide_id, guest_count, start_time 
FROM tours 
WHERE name LIKE '[TEST]%' AND tour_date = CURRENT_DATE
ORDER BY start_time;

SELECT '=== INCIDENTS ===' as section;
SELECT i.type, i.severity, i.status, p.full_name as guide_name
FROM incidents i
JOIN profiles p ON i.guide_id = p.id
WHERE i.description LIKE '[TEST]%'
ORDER BY i.created_at;

SELECT '=== EXPENSES ===' as section;
SELECT e.amount, e.expense_type, e.status, p.full_name as guide_name
FROM expenses e
JOIN profiles p ON e.guide_id = p.id
WHERE e.description LIKE '[TEST]%'
ORDER BY e.created_at;

SELECT '=== CHECK-INS ===' as section;
SELECT p.full_name, gc.latitude, gc.longitude, gc.checked_in_at
FROM guide_checkins gc
JOIN profiles p ON gc.guide_id = p.id
WHERE gc.notes LIKE '[TEST]%'
ORDER BY gc.checked_in_at;