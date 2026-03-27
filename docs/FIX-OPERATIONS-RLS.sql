-- ============================================================
-- FIX RLS FOR OPERATIONS DASHBOARD
-- Run this in Supabase SQL Editor
-- ============================================================
-- Allows users with role 'operations', 'supervisor', 'manager' 
-- to read tours, vehicles, guides, and incidents
-- ============================================================

-- ============================================================
-- 1. VEHICLES TABLE - Operations staff can read all vehicles
-- ============================================================
DO $$
BEGIN
  ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
  
  -- Drop existing restrictive policies
  DROP POLICY IF EXISTS "Operations staff can view vehicles" ON vehicles;
  
  -- Create policy: Operations, supervisor, manager, super_admin can view all vehicles
  CREATE POLICY "Operations staff can view vehicles"
    ON vehicles
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('operations', 'supervisor', 'manager', 'super_admin')
      )
    );
  
  RAISE NOTICE 'vehicles SELECT policy created for operations roles';
END $$;

-- ============================================================
-- 2. TOURS TABLE - Operations staff can read all tours
-- ============================================================
DO $$
BEGIN
  ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "Operations staff can view tours" ON tours;
  
  CREATE POLICY "Operations staff can view tours"
    ON tours
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('operations', 'supervisor', 'manager', 'super_admin')
      )
    );
  
  RAISE NOTICE 'tours SELECT policy created for operations roles';
END $$;

-- ============================================================
-- 3. PROFILES TABLE - Operations staff can read guide info
-- ============================================================
DO $$
BEGIN
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "Operations staff can view profiles" ON profiles;
  
  CREATE POLICY "Operations staff can view profiles"
    ON profiles
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role IN ('operations', 'supervisor', 'manager', 'super_admin')
      )
    );
  
  RAISE NOTICE 'profiles SELECT policy created for operations roles';
END $$;

-- ============================================================
-- 4. GUIDE_CHECKINS TABLE - Operations staff can read check-ins
-- ============================================================
DO $$
BEGIN
  ALTER TABLE guide_checkins ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "Operations staff can view guide_checkins" ON guide_checkins;
  
  CREATE POLICY "Operations staff can view guide_checkins"
    ON guide_checkins
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('operations', 'supervisor', 'manager', 'super_admin')
      )
    );
  
  RAISE NOTICE 'guide_checkins SELECT policy created for operations roles';
END $$;

-- ============================================================
-- 5. INCIDENTS TABLE - Operations staff can read incidents
-- ============================================================
DO $$
BEGIN
  ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "Operations staff can view incidents" ON incidents;
  
  CREATE POLICY "Operations staff can view incidents"
    ON incidents
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('operations', 'supervisor', 'manager', 'super_admin')
      )
    );
  
  RAISE NOTICE 'incidents SELECT policy created for operations roles';
END $$;

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT 
  tablename,
  policyname,
  cmd as command
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('vehicles', 'tours', 'profiles', 'guide_checkins', 'incidents')
ORDER BY tablename, policyname;

-- ============================================================
-- TEST: Check current user role
-- ============================================================
-- Run this to verify your role:
-- SELECT role FROM profiles WHERE id = auth.uid();
-- ============================================================
