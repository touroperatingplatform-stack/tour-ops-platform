-- ============================================
-- EXPORT CURRENT DATA FOR DEMO FILES
-- Run this to get UUIDs for CSV imports
-- ============================================

-- Get all tours with guide info
SELECT 
  t.id as tour_uuid,
  t.name as tour_name,
  t.tour_date,
  t.start_time,
  t.status,
  t.tour_type,
  p.email as guide_email,
  b.name as brand_name,
  b.id as brand_uuid
FROM tours t
LEFT JOIN profiles p ON t.guide_id = p.id
LEFT JOIN brands b ON t.brand_id = b.id
ORDER BY t.tour_date, t.start_time;

-- Get all pickup stops with tour info
SELECT 
  ps.id as stop_uuid,
  ps.tour_id as tour_uuid,
  t.name as tour_name,
  ps.sort_order,
  ps.location_name,
  ps.scheduled_time,
  ps.guest_count
FROM pickup_stops ps
LEFT JOIN tours t ON ps.tour_id = t.id
ORDER BY ps.tour_id, ps.sort_order;

-- Get all incidents with guide info
SELECT 
  i.id as incident_uuid,
  i.tour_id as tour_uuid,
  t.name as tour_name,
  p.email as guide_email,
  i.type,
  i.severity,
  i.status,
  i.created_at
FROM incidents i
LEFT JOIN tours t ON i.tour_id = t.id
LEFT JOIN profiles p ON i.reported_by = p.id
ORDER BY i.created_at DESC;

-- Get all expenses with guide info
SELECT 
  te.id as expense_uuid,
  te.tour_id as tour_uuid,
  t.name as tour_name,
  p.email as guide_email,
  te.category,
  te.amount,
  te.status,
  te.created_at
FROM tour_expenses te
LEFT JOIN tours t ON te.tour_id = t.id
LEFT JOIN profiles p ON te.guide_id = p.id
ORDER BY te.created_at DESC;

-- Get all guide checkins
SELECT 
  gc.id as checkin_uuid,
  gc.tour_id as tour_uuid,
  t.name as tour_name,
  p.email as guide_email,
  gc.checkin_type,
  gc.checked_in_at,
  gc.minutes_early_or_late
FROM guide_checkins gc
LEFT JOIN tours t ON gc.tour_id = t.id
LEFT JOIN profiles p ON gc.guide_id = p.id
ORDER BY gc.checked_in_at DESC;
