-- Migration 039: Create activities system for tour management

-- Activity library (company-wide reusable activities)
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER DEFAULT 60,
  requires_checklist BOOLEAN DEFAULT true,
  default_checklist_template_id UUID REFERENCES checklist_templates(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_company ON activities(company_id);
CREATE INDEX IF NOT EXISTS idx_activities_active ON activities(is_active);

-- Link activities to tours
CREATE TABLE IF NOT EXISTS tour_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID REFERENCES tours(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  scheduled_time TIMETZ,
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed
  checklist_completed BOOLEAN DEFAULT false,
  guide_checkin_id UUID REFERENCES guide_checkins(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tour_activities_tour ON tour_activities(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_activities_activity ON tour_activities(activity_id);
CREATE INDEX IF NOT EXISTS idx_tour_activities_status ON tour_activities(status);

-- Servicio patterns for ORDEN import (remember activities per tour name)
CREATE TABLE IF NOT EXISTS servicio_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  servicio_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  activities JSONB DEFAULT '[]', -- Array of activity IDs
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, normalized_name)
);

CREATE INDEX IF NOT EXISTS idx_servicio_patterns_company ON servicio_patterns(company_id);
CREATE INDEX IF NOT EXISTS idx_servicio_patterns_normalized ON servicio_patterns(normalized_name);

-- RLS Policies
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicio_patterns ENABLE ROW LEVEL SECURITY;

-- Staff can view activities in their company
CREATE POLICY "Staff can view activities"
  ON activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.company_id = activities.company_id
    )
  );

-- Admin can manage activities
CREATE POLICY "Admin can manage activities"
  ON activities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.company_id = activities.company_id
      AND profiles.role IN ('company_admin', 'manager', 'super_admin')
    )
  );

-- Staff can view tour activities
CREATE POLICY "Staff can view tour activities"
  ON tour_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tours
      WHERE tours.id = tour_activities.tour_id
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.company_id = tours.company_id
      )
    )
  );

-- Guide can update tour activities (for check-ins)
CREATE POLICY "Guide can update tour activities"
  ON tour_activities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tours
      WHERE tours.id = tour_activities.tour_id
      AND tours.guide_id = auth.uid()
    )
  );

-- Staff can view servicio patterns
CREATE POLICY "Staff can view servicio patterns"
  ON servicio_patterns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.company_id = servicio_patterns.company_id
    )
  );

-- Admin can manage servicio patterns
CREATE POLICY "Admin can manage servicio patterns"
  ON servicio_patterns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.company_id = servicio_patterns.company_id
      AND profiles.role IN ('company_admin', 'manager', 'super_admin')
    )
  );

-- Triggers
CREATE TRIGGER activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tour_activities_updated_at
  BEFORE UPDATE ON tour_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER servicio_patterns_updated_at
  BEFORE UPDATE ON servicio_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
