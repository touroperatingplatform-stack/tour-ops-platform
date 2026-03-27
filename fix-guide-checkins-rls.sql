-- Fix guide_checkins RLS to allow supervisors/ops/admins to view all checkins
-- Run this in Supabase SQL Editor

-- Enable RLS if not already enabled
ALTER TABLE guide_checkins ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Staff can view guide_checkins" ON guide_checkins;
DROP POLICY IF EXISTS "Guides can view own checkins" ON guide_checkins;

-- Policy: Staff (supervisor, operations, admin) can view all checkins for their company
CREATE POLICY "Staff can view guide_checkins"
  ON guide_checkins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN brands ON brands.id = guide_checkins.brand_id
      WHERE profiles.id = auth.uid()
      AND profiles.company_id = brands.company_id
      AND profiles.role IN ('supervisor', 'operations', 'manager', 'company_admin', 'super_admin', 'admin')
    )
  );

-- Policy: Guides can view their own checkins
CREATE POLICY "Guides can view own checkins"
  ON guide_checkins FOR SELECT
  USING (guide_id = auth.uid());

-- Policy: Guides can insert their own checkins
CREATE POLICY "Guides can insert own checkins"
  ON guide_checkins FOR INSERT
  WITH CHECK (guide_id = auth.uid());

-- Verify policies were created
SELECT policyname, permissive, cmd, qual
FROM pg_policies
WHERE tablename = 'guide_checkins';
