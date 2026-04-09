-- Add SELECT policy for reservation_manifest so company users can view their data
CREATE POLICY "Company users can view reservation_manifest"
ON reservation_manifest FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.company_id = reservation_manifest.company_id
  )
);
