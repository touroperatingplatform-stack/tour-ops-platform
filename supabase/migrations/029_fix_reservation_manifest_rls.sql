-- Fix: Add INSERT policy for reservation_manifest
-- The existing ALL policy uses auth.jwt() ->> 'role' which doesn't work
-- because role is in profiles table, not in JWT claims

-- Add INSERT policy for super_admin users
CREATE POLICY "Super admins can insert reservation_manifest"
ON reservation_manifest FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);
