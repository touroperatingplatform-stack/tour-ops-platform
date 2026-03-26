-- ============================================================
-- FIX RLS POLICIES FOR DEMO DATA GENERATION
-- Run this in Supabase SQL Editor
-- ============================================================

-- This script allows authenticated users to insert demo data
-- Run once as postgres role or with admin privileges

-- ============================================================
-- 1. PICKUP_STOPS - Allow inserts for authenticated users
-- ============================================================
DO $$
BEGIN
  -- Enable RLS if not already enabled
  ALTER TABLE pickup_stops ENABLE ROW LEVEL SECURITY;
  
  -- Drop existing policy if it exists
  DROP POLICY IF EXISTS "Allow authenticated insert for demo" ON pickup_stops;
  
  -- Create policy allowing inserts
  CREATE POLICY "Allow authenticated insert for demo"
    ON pickup_stops
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
  
  -- Allow selects too (for stats)
  DROP POLICY IF EXISTS "Allow authenticated select" ON pickup_stops;
  CREATE POLICY "Allow authenticated select"
    ON pickup_stops
    FOR SELECT
    TO authenticated
    USING (true);
  
  RAISE NOTICE 'pickup_stops policies created';
END $$;

-- ============================================================
-- 2. GUIDE_CHECKINS - Allow inserts for authenticated users
-- ============================================================
DO $$
BEGIN
  ALTER TABLE guide_checkins ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "Allow authenticated insert for demo" ON guide_checkins;
  CREATE POLICY "Allow authenticated insert for demo"
    ON guide_checkins
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
  
  DROP POLICY IF EXISTS "Allow authenticated select" ON guide_checkins;
  CREATE POLICY "Allow authenticated select"
    ON guide_checkins
    FOR SELECT
    TO authenticated
    USING (true);
  
  RAISE NOTICE 'guide_checkins policies created';
END $$;

-- ============================================================
-- 3. TOUR_EXPENSES - Allow inserts for authenticated users
-- ============================================================
DO $$
BEGIN
  ALTER TABLE tour_expenses ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "Allow authenticated insert for demo" ON tour_expenses;
  CREATE POLICY "Allow authenticated insert for demo"
    ON tour_expenses
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
  
  DROP POLICY IF EXISTS "Allow authenticated select" ON tour_expenses;
  CREATE POLICY "Allow authenticated select"
    ON tour_expenses
    FOR SELECT
    TO authenticated
    USING (true);
  
  RAISE NOTICE 'tour_expenses policies created';
END $$;

-- ============================================================
-- 4. GUEST_FEEDBACK - Fix schema and allow inserts
-- ============================================================
DO $$
BEGIN
  ALTER TABLE guest_feedback ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "Allow authenticated insert for demo" ON guest_feedback;
  CREATE POLICY "Allow authenticated insert for demo"
    ON guest_feedback
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
  
  DROP POLICY IF EXISTS "Allow authenticated select" ON guest_feedback;
  CREATE POLICY "Allow authenticated select"
    ON guest_feedback
    FOR SELECT
    TO authenticated
    USING (true);
  
  RAISE NOTICE 'guest_feedback policies created';
END $$;

-- ============================================================
-- 5. ACTIVITY_FEED - Allow inserts for authenticated users
-- ============================================================
DO $$
BEGIN
  ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "Allow authenticated insert for demo" ON activity_feed;
  CREATE POLICY "Allow authenticated insert for demo"
    ON activity_feed
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
  
  DROP POLICY IF EXISTS "Allow authenticated select" ON activity_feed;
  CREATE POLICY "Allow authenticated select"
    ON activity_feed
    FOR SELECT
    TO authenticated
    USING (true);
  
  RAISE NOTICE 'activity_feed policies created';
END $$;

-- ============================================================
-- 6. TOURS - Allow deletes for demo cleanup
-- ============================================================
DO $$
BEGIN
  ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "Allow authenticated delete for demo" ON tours;
  CREATE POLICY "Allow authenticated delete for demo"
    ON tours
    FOR DELETE
    TO authenticated
    USING (true);
  
  DROP POLICY IF EXISTS "Allow authenticated insert for demo" ON tours;
  CREATE POLICY "Allow authenticated insert for demo"
    ON tours
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
  
  RAISE NOTICE 'tours policies created';
END $$;

-- ============================================================
-- 7. GUESTS - Allow inserts/deletes for demo
-- ============================================================
DO $$
BEGIN
  ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "Allow authenticated insert for demo" ON guests;
  CREATE POLICY "Allow authenticated insert for demo"
    ON guests
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
  
  DROP POLICY IF EXISTS "Allow authenticated delete for demo" ON guests;
  CREATE POLICY "Allow authenticated delete for demo"
    ON guests
    FOR DELETE
    TO authenticated
    USING (true);
  
  RAISE NOTICE 'guests policies created';
END $$;

-- ============================================================
-- 8. INCIDENTS - Allow inserts for demo
-- ============================================================
DO $$
BEGIN
  ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "Allow authenticated insert for demo" ON incidents;
  CREATE POLICY "Allow authenticated insert for demo"
    ON incidents
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
  
  DROP POLICY IF EXISTS "Allow authenticated select" ON incidents;
  CREATE POLICY "Allow authenticated select"
    ON incidents
    FOR SELECT
    TO authenticated
    USING (true);
  
  RAISE NOTICE 'incidents policies created';
END $$;

-- ============================================================
-- VERIFICATION QUERY
-- Run this after to check policies
-- ============================================================
-- SELECT 
--   schemaname,
--   tablename,
--   policyname,
--   permissive,
--   roles,
--   cmd
-- FROM pg_policies
-- WHERE tablename IN (
--   'pickup_stops', 'guide_checkins', 'tour_expenses', 
--   'guest_feedback', 'activity_feed', 'tours', 'guests', 'incidents'
-- )
-- ORDER BY tablename, policyname;

-- ============================================================
-- SUMMARY
-- ============================================================
-- This script creates permissive INSERT/SELECT/DELETE policies 
-- for authenticated users on demo-related tables.
--
-- For production, you should replace these with more restrictive
-- policies based on user roles (super_admin, manager, etc.)
-- ============================================================
