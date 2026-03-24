-- Tours table
CREATE TABLE IF NOT EXISTS tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  tour_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 120,
  capacity INTEGER DEFAULT 0,
  pickup_location TEXT,
  dropoff_location TEXT,
  guide_id UUID REFERENCES profiles(id),
  vehicle_id UUID REFERENCES vehicles(id),
  brand_id UUID REFERENCES brands(id),
  template_id UUID REFERENCES tour_templates(id),
  price DECIMAL(10,2),
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  guest_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tours_company ON tours(company_id);
CREATE INDEX IF NOT EXISTS idx_tours_date ON tours(tour_date);
CREATE INDEX IF NOT EXISTS idx_tours_guide ON tours(guide_id);
CREATE INDEX IF NOT EXISTS idx_tours_vehicle ON tours(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_tours_status ON tours(status);

-- RLS policies
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view tours"
  ON tours FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.company_id = tours.company_id
    )
  );

CREATE POLICY "Admin can manage tours"
  ON tours FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.company_id = tours.company_id
      AND profiles.role IN ('manager', 'company_admin', 'super_admin', 'operations')
    )
  );

-- Guides can update their assigned tours
CREATE POLICY "Guides can update assigned tours"
  ON tours FOR UPDATE
  USING (guide_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER tours_updated_at
  BEFORE UPDATE ON tours
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
