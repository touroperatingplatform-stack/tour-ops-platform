-- Add owner_id to vehicles table for external/freelance driver vehicles
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id);

-- Index for quick lookup of external vehicles
CREATE INDEX IF NOT EXISTS idx_vehicles_owner ON vehicles(owner_id);

-- Comment for documentation
COMMENT ON COLUMN vehicles.owner_id IS 'Owner profile ID for external/freelance driver vehicles. NULL = company-owned.';

-- Update RLS policies to allow drivers to manage their own vehicles
CREATE POLICY "Drivers can manage own vehicles"
  ON vehicles FOR ALL
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('operations', 'manager', 'company_admin', 'super_admin')
    )
  );
