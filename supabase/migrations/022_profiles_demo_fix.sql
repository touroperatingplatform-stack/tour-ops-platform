-- Migration: Fix profiles for demo data operations
-- 1. Add email index (required for Supabase REST filtering)
-- 2. Allow super_admins to view all profiles (not just same company)

-- Add index on email for filtering
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Update RLS to allow super_admins to view all profiles
-- This is a permissive policy that works alongside existing policies
CREATE POLICY "Super admins can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

-- Also allow super_admins to update all profiles (needed for setting driver roles)
CREATE POLICY "Super admins can update all profiles"
ON profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);
