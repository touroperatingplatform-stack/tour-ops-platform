-- Driver schedules and availability (mirrors guide_schedules)

CREATE TABLE driver_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  schedule_date DATE NOT NULL,
  is_available BOOLEAN DEFAULT true,
  start_time TIME,
  end_time TIME,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(driver_id, schedule_date)
);

CREATE INDEX idx_driver_schedules_driver ON driver_schedules(driver_id);
CREATE INDEX idx_driver_schedules_date ON driver_schedules(schedule_date);
CREATE INDEX idx_driver_schedules_company ON driver_schedules(company_id);

-- Trigger
CREATE TRIGGER driver_schedules_updated_at
  BEFORE UPDATE ON driver_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE driver_schedules ENABLE ROW LEVEL SECURITY;

-- Drivers can manage their own schedules
CREATE POLICY "Drivers can manage own schedules"
  ON driver_schedules FOR ALL
  USING (driver_id = auth.uid());

-- Admins can view all schedules
CREATE POLICY "Admins can view all driver schedules"
  ON driver_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'company_admin', 'manager', 'supervisor', 'operations')
    )
  );

-- Admins can manage all schedules
CREATE POLICY "Admins can manage driver schedules"
  ON driver_schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'company_admin', 'manager')
    )
  );
