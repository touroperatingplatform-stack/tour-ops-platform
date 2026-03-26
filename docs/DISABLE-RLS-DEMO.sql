-- ============================================================
-- DISABLE RLS FOR DEMO TABLES (TEMPORARY FIX)
-- Run this in Supabase SQL Editor
-- ============================================================
-- This completely disables Row Level Security on demo tables
-- so the demo data generator can work without restrictions.
--
-- WARNING: This is for DEVELOPMENT/DEMO only!
-- Re-enable RLS before production use.
-- ============================================================

-- ============================================================
-- DISABLE RLS ENTIRELY ON THESE TABLES
-- ============================================================

-- Tours table
ALTER TABLE tours DISABLE ROW LEVEL SECURITY;

-- Guests table  
ALTER TABLE guests DISABLE ROW LEVEL SECURITY;

-- Pickup stops table
ALTER TABLE pickup_stops DISABLE ROW LEVEL SECURITY;

-- Guide checkins table
ALTER TABLE guide_checkins DISABLE ROW LEVEL SECURITY;

-- Incidents table
ALTER TABLE incidents DISABLE ROW LEVEL SECURITY;

-- Tour expenses table
ALTER TABLE tour_expenses DISABLE ROW LEVEL SECURITY;

-- Guest feedback table
ALTER TABLE guest_feedback DISABLE ROW LEVEL SECURITY;

-- Activity feed table
ALTER TABLE activity_feed DISABLE ROW LEVEL SECURITY;

-- External bookings table
ALTER TABLE external_bookings DISABLE ROW LEVEL SECURITY;

-- Cash confirmations table
ALTER TABLE cash_confirmations DISABLE ROW LEVEL SECURITY;

-- Payments table
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- Checklist completions table
ALTER TABLE checklist_completions DISABLE ROW LEVEL SECURITY;

-- Incident comments table
ALTER TABLE incident_comments DISABLE ROW LEVEL SECURITY;

-- Push notifications table
ALTER TABLE push_notifications DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- VERIFICATION - Check RLS status
-- ============================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'tours', 'guests', 'pickup_stops', 'guide_checkins',
    'incidents', 'tour_expenses', 'guest_feedback', 
    'activity_feed', 'external_bookings', 'cash_confirmations',
    'payments', 'checklist_completions', 'incident_comments',
    'push_notifications'
  )
ORDER BY tablename;

-- ============================================================
-- RESULT SHOULD SHOW: rls_enabled = false for all tables
-- ============================================================
