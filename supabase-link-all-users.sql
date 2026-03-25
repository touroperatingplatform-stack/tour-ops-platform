-- TOUR OPS - USER PROFILE SETUP
-- Links existing auth users to profiles table

-- Company ID: 6e046c69-93e2-48c9-a861-46c91fd2ae3b

-- Diego
INSERT INTO profiles (id, email, first_name, last_name, full_name, role, company_id)
VALUES ('34ef0245-f2be-4c3d-a870-d5d081296046', 'diego@tour-ops.com', 'Diego', '', 'Diego', 'guide', '6e046c69-93e2-48c9-a861-46c91fd2ae3b')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role, company_id = EXCLUDED.company_id;

-- Juan
INSERT INTO profiles (id, email, first_name, last_name, full_name, role, company_id)
VALUES ('d68d3488-1a30-4970-8aff-90e62e605c57', 'juan@tour-ops.com', 'Juan', '', 'Juan', 'guide', '6e046c69-93e2-48c9-a861-46c91fd2ae3b')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role, company_id = EXCLUDED.company_id;

-- Ana
INSERT INTO profiles (id, email, first_name, last_name, full_name, role, company_id)
VALUES ('2fdb9d2b-dc40-4ec9-a0dd-d266bb3c24d8', 'ana@tour-ops.com', 'Ana', '', 'Ana', 'guide', '6e046c69-93e2-48c9-a861-46c91fd2ae3b')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role, company_id = EXCLUDED.company_id;

-- Maria
INSERT INTO profiles (id, email, first_name, last_name, full_name, role, company_id)
VALUES ('cbbb22ba-178a-4a1d-ba49-d9f412f88b03', 'maria@tour-ops.com', 'Maria', '', 'Maria', 'guide', '6e046c69-93e2-48c9-a861-46c91fd2ae3b')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role, company_id = EXCLUDED.company_id;

-- Elena
INSERT INTO profiles (id, email, first_name, last_name, full_name, role, company_id)
VALUES ('4c9d2d29-699c-4f1a-9417-cc8b43987de6', 'elena@tour-ops.com', 'Elena', '', 'Elena', 'supervisor', '6e046c69-93e2-48c9-a861-46c91fd2ae3b')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role, company_id = EXCLUDED.company_id;

-- Carlos
INSERT INTO profiles (id, email, first_name, last_name, full_name, role, company_id)
VALUES ('d2cda25c-35c2-49ac-949c-bc52486d27a0', 'carlos@tour-ops.com', 'Carlos', '', 'Carlos', 'guide', '6e046c69-93e2-48c9-a861-46c91fd2ae3b')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role, company_id = EXCLUDED.company_id;

-- Roberto
INSERT INTO profiles (id, email, first_name, last_name, full_name, role, company_id)
VALUES ('bcf3d261-aec7-4ea6-b06d-c1756d197ea5', 'roberto@tour-ops.com', 'Roberto', '', 'Roberto', 'manager', '6e046c69-93e2-48c9-a861-46c91fd2ae3b')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role, company_id = EXCLUDED.company_id;

-- FIX RLS POLICIES FOR INCIDENTS TABLE
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_create_incidents" ON incidents;
DROP POLICY IF EXISTS "auth_view_incidents" ON incidents;
DROP POLICY IF EXISTS "auth_update_incidents" ON incidents;

-- All authenticated users can INSERT incidents
CREATE POLICY "auth_create_incidents" ON incidents
FOR INSERT TO authenticated
WITH CHECK (true);

-- Users can view their own incidents OR if supervisor/manager
CREATE POLICY "auth_view_incidents" ON incidents
FOR SELECT TO authenticated
USING (
  reported_by = auth.uid() 
  OR 
  auth.uid() IN (
    SELECT id FROM profiles WHERE role IN ('supervisor', 'manager', 'admin')
  )
);

-- Supervisors/managers can UPDATE incidents
CREATE POLICY "auth_update_incidents" ON incidents
FOR UPDATE TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role IN ('supervisor', 'manager', 'admin')
  )
)
WITH CHECK (true);
