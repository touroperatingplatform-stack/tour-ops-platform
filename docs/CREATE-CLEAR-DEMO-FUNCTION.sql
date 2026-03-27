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
  company_id_val UUID;
BEGIN
  -- Get tour IDs to delete (tours from last 2 days)
  SELECT ARRAY(
    SELECT id FROM tours 
    WHERE tour_date >= (NOW() AT TIME ZONE 'America/Cancun')::DATE - INTERVAL '1 day'
  ) INTO tour_ids;
  
  -- Get company ID for vehicle deletion
  SELECT id INTO company_id_val FROM companies LIMIT 1;
  
  -- Delete and count each table
  DELETE FROM activity_feed WHERE created_at >= (NOW() - INTERVAL '30 days');
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'activity_feed'; status := 'deleted'; RETURN NEXT;
  
  DELETE FROM incident_comments WHERE created_at >= (NOW() - INTERVAL '30 days');
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'incident_comments'; status := 'deleted'; RETURN NEXT;
  
  DELETE FROM guest_feedback WHERE created_at >= (NOW() - INTERVAL '30 days');
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'guest_feedback'; status := 'deleted'; RETURN NEXT;
  
  DELETE FROM push_notifications WHERE created_at >= (NOW() - INTERVAL '30 days');
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'push_notifications'; status := 'deleted'; RETURN NEXT;
  
  DELETE FROM external_bookings WHERE created_at >= (NOW() - INTERVAL '30 days');
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'external_bookings'; status := 'deleted'; RETURN NEXT;
  
  DELETE FROM cash_confirmations WHERE created_at >= (NOW() - INTERVAL '30 days');
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'cash_confirmations'; status := 'deleted'; RETURN NEXT;
  
  DELETE FROM payments WHERE created_at >= (NOW() - INTERVAL '30 days');
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'payments'; status := 'deleted'; RETURN NEXT;
  
  DELETE FROM checklist_completions WHERE created_at >= (NOW() - INTERVAL '30 days');
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'checklist_completions'; status := 'deleted'; RETURN NEXT;
  
  DELETE FROM tour_expenses WHERE created_at >= (NOW() - INTERVAL '30 days');
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'tour_expenses'; status := 'deleted'; RETURN NEXT;
  
  DELETE FROM guide_checkins WHERE created_at >= (NOW() - INTERVAL '30 days');
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'guide_checkins'; status := 'deleted'; RETURN NEXT;
  
  DELETE FROM pickup_stops WHERE tour_id = ANY(tour_ids);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'pickup_stops'; status := 'deleted'; RETURN NEXT;
  
  DELETE FROM guests WHERE tour_id = ANY(tour_ids);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'guests'; status := 'deleted'; RETURN NEXT;
  
  DELETE FROM incidents WHERE tour_id = ANY(tour_ids);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'incidents'; status := 'deleted'; RETURN NEXT;
  
  DELETE FROM tours WHERE id = ANY(tour_ids);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'tours'; status := 'deleted'; RETURN NEXT;
  
  DELETE FROM vehicles WHERE company_id = company_id_val;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'vehicles'; status := 'deleted'; RETURN NEXT;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION clear_demo_data() TO authenticated;

-- Test the function (optional - comment out after testing)
-- SELECT * FROM clear_demo_data();
