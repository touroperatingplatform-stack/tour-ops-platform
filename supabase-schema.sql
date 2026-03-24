-- Tour Ops Platform - Supabase Schema
-- Run this in Supabase SQL Editor to create missing tables

-- ============================================
-- INCIDENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'other',
  severity TEXT NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  location TEXT,
  action_taken TEXT,
  tour_id UUID REFERENCES tours(id),
  reported_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS incidents_status_idx ON incidents(status);
CREATE INDEX IF NOT EXISTS incidents_reported_by_idx ON incidents(reported_by);
CREATE INDEX IF NOT EXISTS incidents_tour_id_idx ON incidents(tour_id);

-- ============================================
-- EXPENSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  tour_id UUID REFERENCES tours(id),
  receipt_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS expenses_category_idx ON expenses(category);
CREATE INDEX IF NOT EXISTS expenses_date_idx ON expenses(date);
CREATE INDEX IF NOT EXISTS expenses_tour_id_idx ON expenses(tour_id);

-- ============================================
-- VEHICLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number TEXT NOT NULL UNIQUE,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'active',
  last_inspection DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS vehicles_status_idx ON vehicles(status);

-- ============================================
-- SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (key, value) VALUES
  ('company', '{"name": "Tour Ops Platform", "timezone": "America/Cancun", "currency": "USD"}'),
  ('notifications', '{"email": "", "enabled": true}'),
  ('operations', '{"auto_dispatch": false, "require_checklist": true}')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Incidents RLS
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view incidents they reported"
  ON incidents FOR SELECT
  USING (auth.uid() = reported_by);

CREATE POLICY "Supervisors can view all incidents"
  ON incidents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'company_admin', 'supervisor')
    )
  );

CREATE POLICY "Users can create incidents"
  ON incidents FOR INSERT
  WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Supervisors can update incidents"
  ON incidents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'company_admin', 'supervisor')
    )
  );

-- Expenses RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all expenses"
  ON expenses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'company_admin')
    )
  );

CREATE POLICY "Users can create expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update/delete expenses"
  ON expenses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'company_admin')
    )
  );

-- Vehicles RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view vehicles"
  ON vehicles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage vehicles"
  ON vehicles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'company_admin')
    )
  );

-- Settings RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view settings"
  ON settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'company_admin')
    )
  );

CREATE POLICY "Admins can update settings"
  ON settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'company_admin')
    )
  );

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Sample vehicles
INSERT INTO vehicles (plate_number, model, year, capacity, status) VALUES
  ('ABC-123', 'Toyota Hiace', 2022, 14, 'active'),
  ('XYZ-789', 'Mercedes Sprinter', 2021, 12, 'active'),
  ('DEF-456', 'Ford Transit', 2020, 10, 'maintenance')
ON CONFLICT (plate_number) DO NOTHING;

-- Sample incidents
INSERT INTO incidents (type, severity, title, description, status, reported_by) VALUES
  ('medical', 'high', 'Guest injured during tour', 'Guest slipped and fell at archaeological site', 'open', (SELECT id FROM profiles LIMIT 1)),
  ('vehicle', 'medium', 'Van broke down', 'AC not working, needs repair', 'resolved', (SELECT id FROM profiles LIMIT 1))
ON CONFLICT DO NOTHING;

-- Sample expenses
INSERT INTO expenses (amount, category, description, date) VALUES
  (150.00, 'fuel', 'Weekly fuel refill', CURRENT_DATE - 7),
  (500.00, 'maintenance', 'Oil change and tires', CURRENT_DATE - 14),
  (50.00, 'meals', 'Guide lunch during tour', CURRENT_DATE - 1)
ON CONFLICT DO NOTHING;
