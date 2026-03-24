-- Guests/passengers on tours
CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID REFERENCES tours(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  hotel TEXT,
  room_number TEXT,
  adults INTEGER DEFAULT 1,
  children INTEGER DEFAULT 0,
  special_requirements TEXT,
  checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMPTZ,
  checked_in_by UUID REFERENCES profiles(id),
  no_show BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for tour guest lists
CREATE INDEX IF NOT EXISTS idx_guests_tour ON guests(tour_id);
CREATE INDEX IF NOT EXISTS idx_guests_checked_in ON guests(tour_id, checked_in);

-- RLS policies
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- Guides can view guests on their tours
CREATE POLICY "Guides can view tour guests"
  ON guests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tours 
      WHERE tours.id = guests.tour_id 
      AND tours.guide_id = auth.uid()
    )
  );

-- Operations/Admin can manage all guests
CREATE POLICY "Staff can manage guests"
  ON guests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('operations', 'supervisor', 'manager', 'company_admin', 'super_admin')
    )
  );

-- Guides can update check-in status
CREATE POLICY "Guides can check in guests"
  ON guests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tours 
      WHERE tours.id = guests.tour_id 
      AND tours.guide_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER guests_updated_at
  BEFORE UPDATE ON guests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
