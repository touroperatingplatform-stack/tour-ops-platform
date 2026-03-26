-- ============================================================
-- CREATE PROPER RLS POLICIES FOR DEMO MANAGEMENT
-- Run this in Supabase SQL Editor
-- ============================================================
-- This creates role-based policies that allow super_admins
-- to manage demo data while keeping RLS enabled and secure.
-- ============================================================

-- ============================================================
-- 1. TOURS TABLE
-- ============================================================
DO $$
BEGIN
  -- Ensure RLS is enabled
  ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
  
  -- Drop existing demo policies
  DROP POLICY IF EXISTS "Super admins can insert tours" ON tours;
  DROP POLICY IF EXISTS "Super admins can delete tours" ON tours;
  DROP POLICY IF EXISTS "Super admins can select tours" ON tours;
  
  -- Create policy: Super admins can insert tours
  CREATE POLICY "Super admins can insert tours"
    ON tours
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
      )
    );
  
  -- Create policy: Super admins can delete tours
  CREATE POLICY "Super admins can delete tours"
    ON tours
    FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
      )
    );
  
  -- Create policy: Super admins can select all tours
  CREATE POLICY "Super admins can select tours"
    ON tours
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
      )
    );
  
  RAISE NOTICE 'tours policies created for super_admin';
END $$;

-- ============================================================
-- 2. GUESTS TABLE
-- ============================================================
DO $$
BEGIN
  ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "Super admins can insert guests" ON guests;
  DROP POLICY IF EXISTS "Super admins can delete guests" ON guests;
  DROP POLICY IF EXISTS "Super admins can select guests" ON guests;
  
  CREATE POLICY "Super admins can insert guests"
    ON guests
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
      )
    );
  
  CREATE POLICY "Super admins can delete guests"
    ON guests
    FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
      )
    );
  
  CREATE POLICY "Super admins can select guests"
    ON guests
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
      )
    );
  
  RAISE NOTICE 'guests policies created for super_admin';
END $$;

-- ============================================================
-- 3. PICKUP_STOPS TABLE
-- ============================================================
DO $$
BEGIN
  ALTER TABLE pickup_stops ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "Super admins can insert pickup_stops" ON pickup_stops;
  DROP POLICY IF EXISTS "Super admins can select pickup_stops" ON pickup_stops;
  
  CREATE POLICY "Super admins can insert pickup_stops"
    ON pickup_stops
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
      )
    );
  
  CREATE POLICY "Super admins can select pickup_stops"
    ON pickup_stops
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
      )
    );
  
  RAISE NOTICE 'pickup_stops policies created for super_admin';
END $$;

-- ============================================================
-- 4. GUIDE_CHECKINS TABLE
-- ============================================================
DO $$
BEGIN
  ALTER TABLE guide_checkins ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "Super admins can insert guide_checkins" ON guide_checkins;
  DROP POLICY IF EXISTS "Super admins can select guide_checkins" ON guide_checkins;
  
  CREATE POLICY "Super admins can insert guide_checkins"
    ON guide_checkins
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
      )
    );
  
  CREATE POLICY "Super admins can select guide_checkins"
    ON guide_checkins
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
      )
    );
  
  RAISE NOTICE 'guide_checkins policies created for super_admin';
END $$;

-- ============================================================
-- 5. TOUR_EXPENSES TABLE
-- ============================================================
DO $$
BEGIN
  ALTER TABLE tour_expenses ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "Super admins can insert tour_expenses" ON tour_expenses;
  DROP POLICY IF EXISTS "Super admins can select tour_expenses" ON tour_expenses;
  
  CREATE POLICY "Super admins can insert tour_expenses"
    ON tour_expenses
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
      )
    );
  
  CREATE POLICY "Super admins can select tour_expenses"
    ON tour_expenses
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
      )
    );
  
  RAISE NOTICE 'tour_expenses policies created for super_admin';
END $$;

-- ============================================================
-- 6. INCIDENTS TABLE
-- ============================================================
DO $$
BEGIN
  ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "Super admins can insert incidents" ON incidents;
  DROP POLICY IF EXISTS "Super admins can select incidents" ON incidents;
  
  CREATE POLICY "Super admins can insert incidents"
    ON incidents
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
      )
    );
  
  CREATE POLICY "Super admins can select incidents"
    ON incidents
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
      )
    );
  
  RAISE NOTICE 'incidents policies created for super_admin';
END $$;

-- ============================================================
-- 7. GUEST_FEEDBACK TABLE
-- ============================================================
DO $$
BEGIN
  ALTER TABLE guest_feedback ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "Super admins can insert guest_feedback" ON guest_feedback;
  DROP POLICY IF EXISTS "Super admins can select guest_feedback" ON guest_feedback;
  
  -- Check if guest_id column exists, if not create without it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'guest_feedback' 
    AND column_name = 'guest_id'
  ) THEN
    CREATE POLICY "Super admins can insert guest_feedback"
      ON guest_feedback
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'super_admin'
        )
      );
  ELSE
    CREATE POLICY "Super admins can insert guest_feedback"
      ON guest_feedback
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'super_admin'
        )
      );
  END IF;
  
  CREATE POLICY "Super admins can select guest_feedback"
    ON guest_feedback
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
      )
    );
  
  RAISE NOTICE 'guest_feedback policies created for super_admin';
END $$;

-- ============================================================
-- 8. ACTIVITY_FEED TABLE
-- ============================================================
DO $$
BEGIN
  ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "Super admins can insert activity_feed" ON activity_feed;
  DROP POLICY IF EXISTS "Super admins can select activity_feed" ON activity_feed;
  
  CREATE POLICY "Super admins can insert activity_feed"
    ON activity_feed
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
      )
    );
  
  CREATE POLICY "Super admins can select activity_feed"
    ON activity_feed
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
      )
    );
  
  RAISE NOTICE 'activity_feed policies created for super_admin';
END $$;

-- ============================================================
-- VERIFICATION: Show all policies
-- ============================================================
SELECT 
  tablename,
  policyname,
  cmd as command,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'tours', 'guests', 'pickup_stops', 'guide_checkins',
    'incidents', 'tour_expenses', 'guest_feedback', 
    'activity_feed'
  )
ORDER BY tablename, policyname;

-- ============================================================
-- SUMMARY
-- ============================================================
-- These policies allow users with role='super_admin' in the
-- profiles table to manage demo data while keeping RLS enabled.
-- This is secure and production-ready.
-- ============================================================
