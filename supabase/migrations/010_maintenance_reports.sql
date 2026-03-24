-- Vehicle maintenance tracking
CREATE TABLE IF NOT EXISTS vehicle_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'oil_change', 'tire_rotation', 'inspection', 'repair', 'other'
  description TEXT NOT NULL,
  scheduled_date DATE,
  completed_date DATE,
  cost DECIMAL(10,2),
  mileage INTEGER,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON vehicle_maintenance(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON vehicle_maintenance(status, scheduled_date);

-- Daily/weekly reports cache
CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  report_date DATE NOT NULL UNIQUE,
  total_tours INTEGER DEFAULT 0,
  completed_tours INTEGER DEFAULT 0,
  cancelled_tours INTEGER DEFAULT 0,
  total_guests INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  incidents_count INTEGER DEFAULT 0,
  no_shows INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_date ON daily_reports(report_date);

-- RLS for maintenance
ALTER TABLE vehicle_maintenance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view maintenance"
  ON vehicle_maintenance FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Operations can manage maintenance"
  ON vehicle_maintenance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('operations', 'supervisor', 'manager', 'company_admin', 'super_admin')
    )
  );

-- RLS for reports
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view reports"
  ON daily_reports FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage reports"
  ON daily_reports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('manager', 'company_admin', 'super_admin')
    )
  );
