-- Fix missing admin policy for guide_schedules
-- Admins need ALL permission, not just SELECT

DROP POLICY IF EXISTS "Admins can manage guide schedules" ON guide_schedules;

CREATE POLICY "Admins can manage guide schedules"
  ON guide_schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'company_admin', 'manager', 'supervisor', 'operations')
    )
  );
