-- Add RLS policy for staff to view all guide_checkins in their company
-- Run this in Supabase SQL Editor

-- Policy: Staff (supervisor, operations, admin, manager) can view ALL checkins for their company
CREATE POLICY "Staff can view all checkins"
  ON guide_checkins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN brands ON brands.company_id = profiles.company_id
      WHERE profiles.id = auth.uid()
      AND brands.id = guide_checkins.brand_id
      AND profiles.role IN ('supervisor', 'operations', 'admin', 'manager', 'company_admin', 'super_admin')
    )
  );

-- Verify the policy was created
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'guide_checkins';
