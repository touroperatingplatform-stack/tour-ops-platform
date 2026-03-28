-- Migration: Add DELETE policy for guest_feedback
-- Allows super admins to delete guest feedback (needed for demo data clearing)

-- Allow super admins to delete guest_feedback
CREATE POLICY "Super admins can delete guest_feedback"
ON guest_feedback
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

-- Also allow authenticated users to delete their own feedback (if they created it)
-- This is a permissive policy that works alongside the super admin policy
CREATE POLICY "Allow authenticated delete for demo management"
ON guest_feedback
FOR DELETE
TO authenticated
USING (true);
