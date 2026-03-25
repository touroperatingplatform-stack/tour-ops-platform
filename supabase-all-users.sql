-- ALL USERS PROFILE SETUP
-- Creates profiles for all auth users

-- Admin
INSERT INTO profiles (id, email, first_name, last_name, full_name, role, company_id)
VALUES ('7b0d216f-7a23-44ea-b075-cb919b5424c1', 'admin@lifeoperations.com', 'Admin', '', 'Admin', 'admin', '6e046c69-93e2-48c9-a861-46c91fd2ae3b')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

-- Terry Planning
INSERT INTO profiles (id, email, first_name, last_name, full_name, role, company_id)
VALUES ('dd546e0a-bec5-406a-af41-405eb3d5abe4', 'terryplanning@proton.me', 'Terry', 'Planning', 'Terry Planning', 'admin', '6e046c69-93e2-48c9-a861-46c91fd2ae3b')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

-- Super
INSERT INTO profiles (id, email, first_name, last_name, full_name, role, company_id)
VALUES ('11307abc-2f53-46c7-a361-591426024a6c', 'super@lifeoperations.com', 'Super', '', 'Super', 'supervisor', '6e046c69-93e2-48c9-a861-46c91fd2ae3b')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

-- Ops
INSERT INTO profiles (id, email, first_name, last_name, full_name, role, company_id)
VALUES ('3b8727c0-2f58-4137-8975-0c4d420ffedb', 'ops@lifeoperations.com', 'Ops', '', 'Ops', 'operations', '6e046c69-93e2-48c9-a861-46c91fd2ae3b')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

-- Manager
INSERT INTO profiles (id, email, first_name, last_name, full_name, role, company_id)
VALUES ('23f5d796-65f4-463f-9d14-405bb60425bf', 'manager@lifeoperations.com', 'Manager', '', 'Manager', 'manager', '6e046c69-93e2-48c9-a861-46c91fd2ae3b')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

-- Terry Smith
INSERT INTO profiles (id, email, first_name, last_name, full_name, role, company_id)
VALUES ('a3862fb2-cd0c-4b74-b9da-aa08a9306137', 'terrysmith@lifeoperations.com', 'Terry', 'Smith', 'Terry Smith', 'admin', '6e046c69-93e2-48c9-a861-46c91fd2ae3b')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

-- Maria Garcia
INSERT INTO profiles (id, email, first_name, last_name, full_name, role, company_id)
VALUES ('5c005430-27eb-4da2-ba4f-22c3e4d40397', 'mariagar@lifeoperations.com', 'Maria', 'Garcia', 'Maria Garcia', 'guide', '6e046c69-93e2-48c9-a861-46c91fd2ae3b')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

-- Guide 1
INSERT INTO profiles (id, email, first_name, last_name, full_name, role, company_id)
VALUES ('0da9c371-5fe9-4e10-8122-1e3ee1836764', 'gude@lifeoperations.com', 'Guide', 'One', 'Guide One', 'guide', '6e046c69-93e2-48c9-a861-46c91fd2ae3b')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

-- Guide 2
INSERT INTO profiles (id, email, first_name, last_name, full_name, role, company_id)
VALUES ('efb510fa-ff1e-4a77-8737-a6395e4000c5', 'guide2@lifeoperations.com', 'Guide', 'Two', 'Guide Two', 'guide', '6e046c69-93e2-48c9-a861-46c91fd2ae3b')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

-- Sup
INSERT INTO profiles (id, email, first_name, last_name, full_name, role, company_id)
VALUES ('4c04e828-cb3d-4b94-aa1c-2f1573bc6ffd', 'sup@lifeoperations.com', 'Supervisor', '', 'Supervisor', 'supervisor', '6e046c69-93e2-48c9-a861-46c91fd2ae3b')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

-- Ops D
INSERT INTO profiles (id, email, first_name, last_name, full_name, role, company_id)
VALUES ('594fe2ba-92ca-4870-9e0a-b0d468901f76', 'opsd@lifeoperations.com', 'Ops', 'D', 'Ops D', 'operations', '6e046c69-93e2-48c9-a861-46c91fd2ae3b')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

-- Juan
INSERT INTO profiles (id, email, first_name, last_name, full_name, role, company_id)
VALUES ('d68d3488-1a30-4970-8aff-90e62e605c57', 'juan@tour-ops.com', 'Juan', '', 'Juan', 'guide', '6e046c69-93e2-48c9-a861-46c91fd2ae3b')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

-- Maria Tour
INSERT INTO profiles (id, email, first_name, last_name, full_name, role, company_id)
VALUES ('cbbb22ba-178a-4a1d-ba49-d9f412f88b03', 'maria@tour-ops.com', 'Maria', '', 'Maria', 'guide', '6e046c69-93e2-48c9-a861-46c91fd2ae3b')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

-- Carlos
INSERT INTO profiles (id, email, first_name, last_name, full_name, role, company_id)
VALUES ('d2cda25c-35c2-49ac-949c-bc52486d27a0', 'carlos@tour-ops.com', 'Carlos', '', 'Carlos', 'guide', '6e046c69-93e2-48c9-a861-46c91fd2ae3b')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

-- Ana
INSERT INTO profiles (id, email, first_name, last_name, full_name, role, company_id)
VALUES ('2fdb9d2b-dc40-4ec9-a0dd-d266bb3c24d8', 'ana@tour-ops.com', 'Ana', '', 'Ana', 'guide', '6e046c69-93e2-48c9-a861-46c91fd2ae3b')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

-- Roberto
INSERT INTO profiles (id, email, first_name, last_name, full_name, role, company_id)
VALUES ('bcf3d261-aec7-4ea6-b06d-c1756d197ea5', 'roberto@tour-ops.com', 'Roberto', '', 'Roberto', 'manager', '6e046c69-93e2-48c9-a861-46c91fd2ae3b')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

-- Elena
INSERT INTO profiles (id, email, first_name, last_name, full_name, role, company_id)
VALUES ('4c9d2d29-699c-4f1a-9417-cc8b43987de6', 'elena@tour-ops.com', 'Elena', '', 'Elena', 'supervisor', '6e046c69-93e2-48c9-a861-46c91fd2ae3b')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

-- Diego
INSERT INTO profiles (id, email, first_name, last_name, full_name, role, company_id)
VALUES ('34ef0245-f2be-4c3d-a870-d5d081296046', 'diego@tour-ops.com', 'Diego', '', 'Diego', 'guide', '6e046c69-93e2-48c9-a861-46c91fd2ae3b')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
