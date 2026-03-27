-- ============================================
-- CLEAR ALL DEMO DATA (Bypass RLS)
-- Run this in Supabase SQL Editor
-- ============================================

-- Delete in correct order (child tables first)
DELETE FROM activity_feed WHERE created_at >= '2026-03-26';
DELETE FROM incident_comments WHERE created_at >= '2026-03-26';
DELETE FROM guest_feedback WHERE created_at >= '2026-03-26';
DELETE FROM push_notifications WHERE created_at >= '2026-03-26';
DELETE FROM external_bookings WHERE created_at >= '2026-03-26';
DELETE FROM cash_confirmations WHERE created_at >= '2026-03-26';
DELETE FROM payments WHERE created_at >= '2026-03-26';
DELETE FROM checklist_completions WHERE created_at >= '2026-03-26';
DELETE FROM tour_expenses WHERE created_at >= '2026-03-26';
DELETE FROM guide_checkins WHERE created_at >= '2026-03-26';
DELETE FROM pickup_stops WHERE created_at >= '2026-03-26';
DELETE FROM guests WHERE created_at >= '2026-03-26';
DELETE FROM incidents WHERE created_at >= '2026-03-26';

-- Delete tours from today/yesterday
DELETE FROM tours WHERE tour_date IN ('2026-03-26', '2026-03-27');

-- Optional: Reset vehicle fleet (if needed)
-- DELETE FROM vehicles WHERE plate_number LIKE 'TEST%' OR plate_number IN ('YXZ-123', 'ABC-456', 'DEF-789', 'GHI-012', 'JKL-345', 'MNO-678');

-- Verify counts
SELECT 'guest_feedback' as table_name, COUNT(*) as count FROM guest_feedback
UNION ALL
SELECT 'guests', COUNT(*) FROM guests
UNION ALL
SELECT 'tours', COUNT(*) FROM tours;
