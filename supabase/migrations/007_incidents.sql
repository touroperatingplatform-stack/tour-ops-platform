-- Incidents table for reporting issues
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID REFERENCES tours(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- 'vehicle_breakdown', 'guest_injury', 'delay', 'no_show', 'other'
  severity TEXT NOT NULL DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'reported', -- 'reported', 'in_progress', 'resolved', 'closed'
  photo_url TEXT,
  gps_location JSONB, -- {lat: number, lng: number}
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for queries
CREATE INDEX IF NOT EXISTS idx_incidents_tour ON incidents(tour_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_reported_by ON incidents(reported_by);

-- RLS policies
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- Everyone can view incidents (for supervisors)
CREATE POLICY "Supervisors can view all incidents"
  ON incidents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('supervisor', 'manager', 'company_admin', 'super_admin')
    )
  );

-- Guides can view incidents they reported
CREATE POLICY "Guides can view own incidents"
  ON incidents FOR SELECT
  USING (reported_by = auth.uid());

-- Guides can create incidents
CREATE POLICY "Guides can create incidents"
  ON incidents FOR INSERT
  WITH CHECK (auth.uid() = reported_by);

-- Supervisors can update incidents
CREATE POLICY "Supervisors can update incidents"
  ON incidents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('supervisor', 'manager', 'company_admin', 'super_admin')
    )
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_incidents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_incidents_updated_at();
