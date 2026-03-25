-- ============================================
-- USER SETUP SCRIPT
-- Run this AFTER creating auth users in Supabase Auth
-- ============================================

-- First, create the auth users in Supabase Dashboard:
-- Authentication → Users → Add User
-- Create these users with temporary passwords:
-- 1. gude@lifeoperations.com
-- 2. guide2@lifeoperations.com
-- 3. mariagar@lifeoperations.com
-- 4. sup@lifeoperations.com
-- 5. manager@lifeoperations.com

-- After creating auth users, get their UUIDs from the Auth panel
-- Then run this script with the REAL user IDs

-- ============================================
-- PROFILES (replace UUIDs with actual auth user IDs)
-- ============================================

-- Guide 1
INSERT INTO profiles (id, email, first_name, last_name, full_name, role, company_id, phone) VALUES
('0da9c371-5fe9-4e10-8122-1e3ee1836764', 'gude@lifeoperations.com', 'Guide', 'One', 'Guide One', 'guide', '6e046c69-93e2-48c9-a861-46c91fd2ae3b', '+52-998-000-0001')
ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  company_id = EXCLUDED.company_id;

-- Guide 2
INSERT INTO profiles (id, email, first_name, last_name, full_name, role, company_id, phone) VALUES
('efb510fa-ff1e-4a77-8737-a6395e4000c5', 'guide2@lifeoperations.com', 'Guide', 'Two', 'Guide Two', 'guide', '6e046c69-93e2-48c9-a861-46c91fd2ae3b', '+52-998-000-0002')
ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  company_id = EXCLUDED.company_id;

-- Guide 3 (Maria)
INSERT INTO profiles (id, email, first_name, last_name, full_name, role, company_id, phone) VALUES
('5c005430-27eb-4da2-ba4f-22c3e4d40397', 'mariagar@lifeoperations.com', 'Maria', 'Garcia', 'Maria Garcia', 'guide', '6e046c69-93e2-48c9-a861-46c91fd2ae3b', '+52-998-000-0003')
ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  company_id = EXCLUDED.company_id;

-- Supervisor
INSERT INTO profiles (id, email, first_name, last_name, full_name, role, company_id, phone) VALUES
('4c04e828-cb3d-4b94-aa1c-2f1573bc6ffd', 'sup@lifeoperations.com', 'Supervisor', 'Main', 'Supervisor Main', 'supervisor', '6e046c69-93e2-48c9-a861-46c91fd2ae3b', '+52-998-000-0004')
ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  company_id = EXCLUDED.company_id;

-- Manager
INSERT INTO profiles (id, email, first_name, last_name, full_name, role, company_id, phone) VALUES
('23f5d796-65f4-463f-9d14-405bb60425bf', 'manager@lifeoperations.com', 'Manager', 'Main', 'Manager Main', 'manager', '6e046c69-93e2-48c9-a861-46c91fd2ae3b', '+52-998-000-0005')
ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  company_id = EXCLUDED.company_id;

-- ============================================
-- VERIFY SETUP
-- ============================================

-- Check all profiles
SELECT id, email, first_name, last_name, role, company_id 
FROM profiles 
WHERE role IN ('guide', 'supervisor', 'manager')
ORDER BY role, email;

-- ============================================
-- RLS POLICIES FOR INCIDENTS (fix the error)
-- ============================================

-- Enable RLS
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can INSERT incidents
CREATE POLICY IF NOT EXISTS "Authenticated users can create incidents"
  ON incidents
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Users can view incidents (their own or if supervisor/manager)
CREATE POLICY IF NOT EXISTS "Users can view incidents"
  ON incidents
  FOR SELECT
  TO authenticated
  USING (
    reported_by = auth.uid() 
    OR 
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role IN ('supervisor', 'manager', 'admin')
    )
  );

-- Policy: Supervisors/managers can UPDATE incidents
CREATE POLICY IF NOT EXISTS "Supervisors can update incidents"
  ON incidents
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role IN ('supervisor', 'manager', 'admin')
    )
  )
  WITH CHECK (true);
