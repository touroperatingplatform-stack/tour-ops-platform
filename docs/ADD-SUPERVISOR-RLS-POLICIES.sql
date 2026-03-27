-- ============================================
-- ADD SUPERVISOR/OPERATIONS RLS POLICIES
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop existing policies first (if they exist)
DROP POLICY IF EXISTS "Supervisors can view all tours" ON tours;
DROP POLICY IF EXISTS "Supervisors can view all guests" ON guests;
DROP POLICY IF EXISTS "Supervisors can view all guide check-ins" ON guide_checkins;
DROP POLICY IF EXISTS "Supervisors can view all incidents" ON incidents;
DROP POLICY IF EXISTS "Supervisors can view all tour expenses" ON tour_expenses;
DROP POLICY IF EXISTS "Supervisors can view all activity feed" ON activity_feed;
DROP POLICY IF EXISTS "Supervisors can view all pickup stops" ON pickup_stops;
DROP POLICY IF EXISTS "Supervisors can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Supervisors can view all vehicles" ON vehicles;

-- Supervisors need SELECT access to view dashboard data
-- These policies allow supervisors, managers, and operations roles to view data

-- 1. Tours - Allow supervisors to view all tours
CREATE POLICY "Supervisors can view all tours"
ON tours FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('supervisor', 'manager', 'operations', 'super_admin')
  )
);

-- 2. Guests - Allow supervisors to view all guests
CREATE POLICY "Supervisors can view all guests"
ON guests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('supervisor', 'manager', 'operations', 'super_admin')
  )
);

-- 3. Guide Check-ins - Allow supervisors to view all check-ins
CREATE POLICY "Supervisors can view all guide check-ins"
ON guide_checkins FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('supervisor', 'manager', 'operations', 'super_admin')
  )
);

-- 4. Incidents - Allow supervisors to view all incidents
CREATE POLICY "Supervisors can view all incidents"
ON incidents FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('supervisor', 'manager', 'operations', 'super_admin')
  )
);

-- 5. Tour Expenses - Allow supervisors to view all expenses
CREATE POLICY "Supervisors can view all tour expenses"
ON tour_expenses FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('supervisor', 'manager', 'operations', 'super_admin')
  )
);

-- 6. Activity Feed - Allow supervisors to view all activity
CREATE POLICY "Supervisors can view all activity feed"
ON activity_feed FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('supervisor', 'manager', 'operations', 'super_admin')
  )
);

-- 7. Pickup Stops - Allow supervisors to view all pickup stops
CREATE POLICY "Supervisors can view all pickup stops"
ON pickup_stops FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('supervisor', 'manager', 'operations', 'super_admin')
  )
);

-- 8. Profiles - Allow supervisors to view all profiles (for guide names)
CREATE POLICY "Supervisors can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('supervisor', 'manager', 'operations', 'super_admin')
  )
);

-- 9. Vehicles - Allow supervisors to view all vehicles
CREATE POLICY "Supervisors can view all vehicles"
ON vehicles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('supervisor', 'manager', 'operations', 'super_admin')
  )
);

-- ============================================
-- VERIFICATION
-- After running this, test with:
-- SELECT COUNT(*) FROM tours;
-- Should return 15 (not 0)
-- ============================================

-- Optional: Verify policies were created
SELECT 
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE policyname LIKE '%Supervisors%'
ORDER BY tablename, cmd;
