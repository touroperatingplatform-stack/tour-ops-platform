-- ============================================================
-- COMPLETE RLS POLICY FIX FOR DEMO DATA
-- Run this ONCE in Supabase SQL Editor as postgres/admin
-- ============================================================

-- ============================================================
-- 1. VEHICLES TABLE
-- ============================================================
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "super_admin_insert_vehicles" ON vehicles;
DROP POLICY IF EXISTS "authenticated_select_vehicles" ON vehicles;
DROP POLICY IF EXISTS "All authenticated users can view vehicles" ON vehicles;
DROP POLICY IF EXISTS "Admins can manage vehicles" ON vehicles;
DROP POLICY IF EXISTS "Allow operations to view vehicles" ON vehicles;
DROP POLICY IF EXISTS "Operations staff can view vehicles" ON vehicles;

-- Super admin can INSERT
CREATE POLICY "vehicles_insert_super_admin"
  ON vehicles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- All authenticated users can SELECT
CREATE POLICY "vehicles_select_authenticated"
  ON vehicles FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- 2. TOURS TABLE
-- ============================================================
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tours_insert_super_admin" ON tours;
DROP POLICY IF EXISTS "tours_select_authenticated" ON tours;
DROP POLICY IF EXISTS "Super admins can insert tours" ON tours;
DROP POLICY IF EXISTS "Super admins can select tours" ON tours;
DROP POLICY IF EXISTS "Super admins can delete tours" ON tours;
DROP POLICY IF EXISTS "Allow authenticated insert for demo" ON tours;
DROP POLICY IF EXISTS "Allow authenticated delete for demo" ON tours;

-- Super admin can INSERT/DELETE
CREATE POLICY "tours_insert_super_admin"
  ON tours FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "tours_delete_super_admin"
  ON tours FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- All authenticated users can SELECT
CREATE POLICY "tours_select_authenticated"
  ON tours FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- 3. GUESTS TABLE
-- ============================================================
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guests_insert_super_admin" ON guests;
DROP POLICY IF EXISTS "guests_select_authenticated" ON guests;
DROP POLICY IF EXISTS "guests_delete_super_admin" ON guests;
DROP POLICY IF EXISTS "Allow authenticated insert for demo" ON guests;
DROP POLICY IF EXISTS "Allow authenticated delete for demo" ON guests;

CREATE POLICY "guests_insert_super_admin"
  ON guests FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "guests_delete_super_admin"
  ON guests FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "guests_select_authenticated"
  ON guests FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- 4. PICKUP_STOPS TABLE
-- ============================================================
ALTER TABLE pickup_stops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pickup_stops_insert_super_admin" ON pickup_stops;
DROP POLICY IF EXISTS "pickup_stops_select_authenticated" ON pickup_stops;
DROP POLICY IF EXISTS "pickup_stops_delete_super_admin" ON pickup_stops;
DROP POLICY IF EXISTS "Allow authenticated insert for demo" ON pickup_stops;

CREATE POLICY "pickup_stops_insert_super_admin"
  ON pickup_stops FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "pickup_stops_delete_super_admin"
  ON pickup_stops FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "pickup_stops_select_authenticated"
  ON pickup_stops FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- 5. GUIDE_CHECKINS TABLE
-- ============================================================
ALTER TABLE guide_checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guide_checkins_insert_super_admin" ON guide_checkins;
DROP POLICY IF EXISTS "guide_checkins_select_authenticated" ON guide_checkins;
DROP POLICY IF EXISTS "guide_checkins_delete_super_admin" ON guide_checkins;
DROP POLICY IF EXISTS "Allow authenticated insert for demo" ON guide_checkins;

CREATE POLICY "guide_checkins_insert_super_admin"
  ON guide_checkins FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "guide_checkins_delete_super_admin"
  ON guide_checkins FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "guide_checkins_select_authenticated"
  ON guide_checkins FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- 6. INCIDENTS TABLE
-- ============================================================
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "incidents_insert_super_admin" ON incidents;
DROP POLICY IF EXISTS "incidents_select_authenticated" ON incidents;
DROP POLICY IF EXISTS "incidents_delete_super_admin" ON incidents;
DROP POLICY IF EXISTS "Allow authenticated insert for demo" ON incidents;

CREATE POLICY "incidents_insert_super_admin"
  ON incidents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "incidents_delete_super_admin"
  ON incidents FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "incidents_select_authenticated"
  ON incidents FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- 7. TOUR_EXPENSES TABLE
-- ============================================================
ALTER TABLE tour_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tour_expenses_insert_super_admin" ON tour_expenses;
DROP POLICY IF EXISTS "tour_expenses_select_authenticated" ON tour_expenses;
DROP POLICY IF EXISTS "tour_expenses_delete_super_admin" ON tour_expenses;
DROP POLICY IF EXISTS "Allow authenticated insert for demo" ON tour_expenses;

CREATE POLICY "tour_expenses_insert_super_admin"
  ON tour_expenses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "tour_expenses_delete_super_admin"
  ON tour_expenses FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "tour_expenses_select_authenticated"
  ON tour_expenses FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- 8. GUEST_FEEDBACK TABLE
-- ============================================================
ALTER TABLE guest_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guest_feedback_insert_super_admin" ON guest_feedback;
DROP POLICY IF EXISTS "guest_feedback_select_authenticated" ON guest_feedback;
DROP POLICY IF EXISTS "guest_feedback_delete_super_admin" ON guest_feedback;
DROP POLICY IF EXISTS "Allow authenticated insert for demo" ON guest_feedback;

CREATE POLICY "guest_feedback_insert_super_admin"
  ON guest_feedback FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "guest_feedback_delete_super_admin"
  ON guest_feedback FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "guest_feedback_select_authenticated"
  ON guest_feedback FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- 9. ACTIVITY_FEED TABLE
-- ============================================================
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activity_feed_insert_super_admin" ON activity_feed;
DROP POLICY IF EXISTS "activity_feed_select_authenticated" ON activity_feed;
DROP POLICY IF EXISTS "activity_feed_delete_super_admin" ON activity_feed;
DROP POLICY IF EXISTS "Allow authenticated insert for demo" ON activity_feed;

CREATE POLICY "activity_feed_insert_super_admin"
  ON activity_feed FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "activity_feed_delete_super_admin"
  ON activity_feed FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "activity_feed_select_authenticated"
  ON activity_feed FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- 10. PROFILES TABLE (for guide lookups)
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_authenticated" ON profiles;
DROP POLICY IF EXISTS "Operations staff can view profiles" ON profiles;

CREATE POLICY "profiles_select_authenticated"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT tablename, policyname, cmd FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('vehicles', 'tours', 'guests', 'pickup_stops', 'guide_checkins', 'incidents', 'tour_expenses', 'guest_feedback', 'activity_feed', 'profiles')
ORDER BY tablename, policyname;
