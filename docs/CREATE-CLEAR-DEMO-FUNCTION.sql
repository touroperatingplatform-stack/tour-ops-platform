-- ============================================
-- CREATE FUNCTION TO CLEAR DEMO DATA
-- Run this ONCE in Supabase SQL Editor
-- This function bypasses RLS safely using SECURITY DEFINER
-- ============================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS clear_demo_data();

-- Create the function with SECURITY DEFINER (runs with elevated privileges)
CREATE OR REPLACE FUNCTION clear_demo_data()
RETURNS TABLE (
  table_name TEXT,
  deleted_count BIGINT,
  status TEXT
) AS $$
DECLARE
  tour_ids UUID[];
  today_date TEXT;
  yesterday_date TEXT;
BEGIN
  -- Get today's date in Cancun timezone (UTC-5)
  today_date := (NOW() AT TIME ZONE 'America/Cancun')::DATE::TEXT;
  yesterday_date := ((NOW() AT TIME ZONE 'America/Cancun') - INTERVAL '1 day')::DATE::TEXT;
  
  -- Get tour IDs to delete
  SELECT ARRAY(
    SELECT id FROM tours 
    WHERE tour_date IN (today_date::DATE, yesterday_date::DATE)
  ) INTO tour_ids;
  
  -- Delete in correct order (child tables first, vehicles last)
  RETURN QUERY
  SELECT 'activity_feed'::TEXT, COUNT(*)::BIGINT, 'deleted'::TEXT FROM (DELETE FROM activity_feed WHERE created_at >= (NOW() - INTERVAL '30 days')) t
  UNION ALL
  SELECT 'incident_comments', COUNT(*), 'deleted' FROM (DELETE FROM incident_comments WHERE created_at >= (NOW() - INTERVAL '30 days')) t
  UNION ALL
  SELECT 'guest_feedback', COUNT(*), 'deleted' FROM (DELETE FROM guest_feedback WHERE created_at >= (NOW() - INTERVAL '30 days')) t
  UNION ALL
  SELECT 'push_notifications', COUNT(*), 'deleted' FROM (DELETE FROM push_notifications WHERE created_at >= (NOW() - INTERVAL '30 days')) t
  UNION ALL
  SELECT 'external_bookings', COUNT(*), 'deleted' FROM (DELETE FROM external_bookings WHERE created_at >= (NOW() - INTERVAL '30 days')) t
  UNION ALL
  SELECT 'cash_confirmations', COUNT(*), 'deleted' FROM (DELETE FROM cash_confirmations WHERE created_at >= (NOW() - INTERVAL '30 days')) t
  UNION ALL
  SELECT 'payments', COUNT(*), 'deleted' FROM (DELETE FROM payments WHERE created_at >= (NOW() - INTERVAL '30 days')) t
  UNION ALL
  SELECT 'checklist_completions', COUNT(*), 'deleted' FROM (DELETE FROM checklist_completions WHERE created_at >= (NOW() - INTERVAL '30 days')) t
  UNION ALL
  SELECT 'tour_expenses', COUNT(*), 'deleted' FROM (DELETE FROM tour_expenses WHERE created_at >= (NOW() - INTERVAL '30 days')) t
  UNION ALL
  SELECT 'guide_checkins', COUNT(*), 'deleted' FROM (DELETE FROM guide_checkins WHERE created_at >= (NOW() - INTERVAL '30 days')) t
  UNION ALL
  SELECT 'pickup_stops', COUNT(*), 'deleted' FROM (DELETE FROM pickup_stops WHERE tour_id = ANY(tour_ids)) t
  UNION ALL
  SELECT 'guests', COUNT(*), 'deleted' FROM (DELETE FROM guests WHERE tour_id = ANY(tour_ids)) t
  UNION ALL
  SELECT 'incidents', COUNT(*), 'deleted' FROM (DELETE FROM incidents WHERE tour_id = ANY(tour_ids)) t
  UNION ALL
  SELECT 'tours', COUNT(*), 'deleted' FROM (DELETE FROM tours WHERE id = ANY(tour_ids)) t
  UNION ALL
  SELECT 'vehicles', COUNT(*), 'deleted' FROM (DELETE FROM vehicles WHERE company_id = (SELECT id FROM companies LIMIT 1)) t;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION clear_demo_data() TO authenticated;

-- Test the function (optional - comment out after testing)
-- SELECT * FROM clear_demo_data();
