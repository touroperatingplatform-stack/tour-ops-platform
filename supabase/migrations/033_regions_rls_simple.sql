-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Super admins can view regions" ON regions;
DROP POLICY IF EXISTS "Super admins can insert regions" ON regions;
DROP POLICY IF EXISTS "Super admins can update regions" ON regions;
DROP POLICY IF EXISTS "Super admins can delete regions" ON regions;

DROP POLICY IF EXISTS "Super admins can view pickup locations" ON pickup_locations_platform;
DROP POLICY IF EXISTS "Super admins can insert pickup locations" ON pickup_locations_platform;
DROP POLICY IF EXISTS "Super admins can update pickup locations" ON pickup_locations_platform;
DROP POLICY IF EXISTS "Super admins can delete pickup locations" ON pickup_locations_platform;

-- Simpler RLS policies using profile role directly
CREATE POLICY "enable_all_for_super_admin_regions"
  ON regions
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE profiles.id = auth.uid()) = 'super_admin'
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE profiles.id = auth.uid()) = 'super_admin'
  );

CREATE POLICY "enable_all_for_super_admin_pickup"
  ON pickup_locations_platform
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE profiles.id = auth.uid()) = 'super_admin'
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE profiles.id = auth.uid()) = 'super_admin'
  );
