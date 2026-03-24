-- Guide availability and scheduling
CREATE TABLE guide_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  schedule_date DATE NOT NULL,
  is_available BOOLEAN DEFAULT true,
  start_time TIME,
  end_time TIME,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guide_id, schedule_date)
);

CREATE INDEX idx_guide_schedules_guide ON guide_schedules(guide_id);
CREATE INDEX idx_guide_schedules_date ON guide_schedules(schedule_date);

-- Vacation/time off requests
CREATE TABLE time_off_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'denied'
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_time_off_guide ON time_off_requests(guide_id);
CREATE INDEX idx_time_off_status ON time_off_requests(status);

-- Triggers
CREATE TRIGGER guide_schedules_updated_at
  BEFORE UPDATE ON guide_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER time_off_requests_updated_at
  BEFORE UPDATE ON time_off_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE guide_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;

-- Guides can manage their own schedules
CREATE POLICY "Guides can manage own schedules"
  ON guide_schedules FOR ALL
  USING (guide_id = auth.uid());

-- Admins can view all schedules
CREATE POLICY "Admins can view all schedules"
  ON guide_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'company_admin', 'manager', 'supervisor')
    )
  );

-- Time off policies
CREATE POLICY "Guides can manage own time off"
  ON time_off_requests FOR ALL
  USING (guide_id = auth.uid());

CREATE POLICY "Admins can manage all time off"
  ON time_off_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'company_admin', 'manager', 'supervisor')
    )
  );
