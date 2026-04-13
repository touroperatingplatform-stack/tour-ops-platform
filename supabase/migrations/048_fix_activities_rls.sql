-- Fix RLS policy to allow superadmins to edit system activities
DROP POLICY IF EXISTS "Admin can manage activities" ON activities;

-- Admin can manage activities in their company OR system activities (for superadmin)
CREATE POLICY "Admin can manage activities"
  ON activities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        -- Can manage company activities
        (profiles.company_id = activities.company_id AND profiles.role IN ('company_admin', 'manager'))
        OR
        -- Superadmins can manage system activities (NULL company_id)
        (activities.company_id IS NULL AND profiles.role = 'super_admin')
      )
    )
  );
