-- ============================================
-- CLEAR ALL DEMO DATA
-- Run this in Supabase SQL Editor
-- ============================================
-- This deletes all demo/test data while preserving:
-- - Users/auth
-- - Companies, brands, vehicles
-- - Tour templates
-- ============================================

-- Delete in order (respecting foreign keys)
DELETE FROM guest_feedback;
DELETE FROM cash_confirmations;
DELETE FROM payments;
DELETE FROM checklist_completions;
DELETE FROM tour_expenses;
DELETE FROM incident_comments;
DELETE FROM incidents;
DELETE FROM guide_checkins;
DELETE FROM pickup_stops;
DELETE FROM guests;
DELETE FROM external_bookings;
DELETE FROM activity_feed;
DELETE FROM notifications;
DELETE FROM offline_sync_queue;

-- Reset tour reports (keep tours, clear report data)
UPDATE tours SET
  status = 'scheduled',
  started_at = NULL,
  completed_at = NULL,
  report_weather = NULL,
  report_guest_satisfaction = NULL,
  report_incident = NULL,
  report_guest_count = NULL,
  report_highlights = NULL,
  report_issues = NULL,
  report_photos = NULL,
  report_cash_received = NULL,
  report_cash_spent = NULL,
  report_cash_to_return = NULL,
  report_ticket_count = NULL,
  report_expense_receipts = NULL,
  report_forgotten_items = FALSE,
  report_forgotten_items_notes = NULL,
  equipment_photo_url = NULL,
  van_photo_url = NULL
WHERE 1=1;

-- Verify deletion
SELECT 
  'guests' as table_name, COUNT(*) as row_count FROM guests
UNION ALL SELECT 'guide_checkins', COUNT(*) FROM guide_checkins
UNION ALL SELECT 'pickup_stops', COUNT(*) FROM pickup_stops
UNION ALL SELECT 'incidents', COUNT(*) FROM incidents
UNION ALL SELECT 'tour_expenses', COUNT(*) FROM tour_expenses
UNION ALL SELECT 'checklist_completions', COUNT(*) FROM checklist_completions
UNION ALL SELECT 'guest_feedback', COUNT(*) FROM guest_feedback
UNION ALL SELECT 'activity_feed', COUNT(*) FROM activity_feed;

-- Should all show 0
