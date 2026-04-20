-- Add admin policy for driver_schedules (mirrors guide_schedules)
-- Allows admins to insert/update/delete driver availability

CREATE POLICY "Admins can insert update driver schedules"
  ON driver_schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'company_admin', 'manager', 'supervisor', 'operations')
    )
  );
