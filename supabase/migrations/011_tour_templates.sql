-- Tour templates for recurring tours
CREATE TABLE IF NOT EXISTS tour_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  capacity INTEGER DEFAULT 0,
  pickup_location TEXT,
  dropoff_location TEXT,
  default_guide_id UUID REFERENCES profiles(id),
  default_vehicle_id UUID REFERENCES vehicles(id),
  checklist_template_id UUID REFERENCES checklists(id),
  brand_id UUID REFERENCES brands(id),
  price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tour_templates_company ON tour_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_tour_templates_active ON tour_templates(is_active);

-- Template schedule (for auto-generating tours)
CREATE TABLE IF NOT EXISTS tour_template_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES tour_templates(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
  start_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_template_schedules_template ON tour_template_schedules(template_id);

-- RLS for tour templates
ALTER TABLE tour_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_template_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view templates"
  ON tour_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.company_id = tour_templates.company_id
    )
  );

CREATE POLICY "Admin can manage templates"
  ON tour_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.company_id = tour_templates.company_id
      AND profiles.role IN ('manager', 'company_admin', 'super_admin')
    )
  );

CREATE POLICY "Staff can view schedules"
  ON tour_template_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tour_templates
      WHERE tour_templates.id = tour_template_schedules.template_id
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.company_id = tour_templates.company_id
      )
    )
  );

CREATE POLICY "Admin can manage schedules"
  ON tour_template_schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tour_templates
      WHERE tour_templates.id = tour_template_schedules.template_id
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.company_id = tour_templates.company_id
        AND profiles.role IN ('manager', 'company_admin', 'super_admin')
      )
    )
  );

-- Triggers for updated_at
CREATE TRIGGER tour_templates_updated_at
  BEFORE UPDATE ON tour_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
