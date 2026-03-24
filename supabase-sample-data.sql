-- Tour Ops Platform - Sample Data
-- Run this AFTER creating the tables

-- ============================================
-- SAMPLE VEHICLES
-- ============================================
INSERT INTO vehicles (plate_number, make, model, year, capacity, status) VALUES
  ('ABC-123', 'Toyota', 'Hiace', 2022, 14, 'active'),
  ('XYZ-789', 'Mercedes', 'Sprinter', 2021, 12, 'active'),
  ('DEF-456', 'Ford', 'Transit', 2020, 10, 'maintenance')
ON CONFLICT (plate_number) DO NOTHING;

-- ============================================
-- SAMPLE EXPENSES
-- ============================================
INSERT INTO expenses (amount, category, description, date) VALUES
  (150.00, 'fuel', 'Weekly fuel refill', CURRENT_DATE - 7),
  (500.00, 'maintenance', 'Oil change and tires', CURRENT_DATE - 14),
  (50.00, 'meals', 'Guide lunch during tour', CURRENT_DATE - 1),
  (75.00, 'tolls', 'Highway tolls for tour', CURRENT_DATE - 3),
  (200.00, 'supplies', 'Water and snacks stock', CURRENT_DATE - 5)
ON CONFLICT DO NOTHING;

-- ============================================
-- SAMPLE INCIDENTS
-- Replace 'YOUR-USER-ID' with an actual user ID from your profiles table
-- ============================================
-- First, get a user ID to use as reported_by
-- SELECT id FROM profiles WHERE role IN ('guide', 'supervisor') LIMIT 1;

-- Then use that ID in the inserts below:
INSERT INTO incidents (type, severity, title, description, status, reported_by) 
SELECT 'medical', 'high', 'Guest injured during tour', 'Guest slipped and fell at archaeological site', 'open', id
FROM profiles WHERE role IN ('guide', 'supervisor') LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO incidents (type, severity, title, description, status, reported_by, resolution_notes, resolved_at) 
SELECT 'vehicle', 'medium', 'Van broke down', 'AC not working, needs repair', 'resolved', id, 'Called mechanic, fixed same day', NOW() - INTERVAL '2 days'
FROM profiles WHERE role IN ('guide', 'supervisor') LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO incidents (type, severity, title, description, status, reported_by) 
SELECT 'guest', 'low', 'Customer complaint', 'Guest unhappy with tour timing', 'open', id
FROM profiles WHERE role IN ('guide', 'supervisor') LIMIT 1
ON CONFLICT DO NOTHING;
