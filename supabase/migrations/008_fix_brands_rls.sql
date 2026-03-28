-- Fix: Enable RLS on brands table (security issue)
-- This ensures the brands table has proper row-level security

-- Enable RLS if not already enabled
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Staff can view brands" ON brands;
DROP POLICY IF EXISTS "Admin can manage brands" ON brands;
DROP POLICY IF EXISTS "Public can view brands" ON brands;

-- Recreate policies
-- 1. Authenticated users can view active brands
CREATE POLICY "Staff can view brands"
  ON brands FOR SELECT
  USING (
    auth.role() = 'authenticated' OR
    is_active = true
  );

-- 2. Admins can manage all brands
CREATE POLICY "Admin can manage brands"
  ON brands FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('manager', 'company_admin', 'super_admin')
    )
  );

-- 3. Allow public read access to active brands (for public-facing pages if needed)
CREATE POLICY "Public can view active brands"
  ON brands FOR SELECT
  USING (is_active = true);
