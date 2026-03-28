-- Driver Feature Migration
-- Adds driver role and driver-specific tables

-- 1. Add driver_id to tours table
ALTER TABLE tours ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES profiles(id);
CREATE INDEX IF NOT EXISTS idx_tours_driver ON tours(driver_id);

-- 2. Create driver_profiles table (extends profiles with driving-specific fields)
CREATE TABLE IF NOT EXISTS driver_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  license_number TEXT,
  license_expiry DATE,
  driver_type TEXT CHECK (driver_type IN ('employee', 'freelance')),
  hire_date DATE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  vehicle_certifications JSONB, -- e.g., {"van": true, "bus": false}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_profiles_profile ON driver_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_company ON driver_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_status ON driver_profiles(status);

-- 3. Create driver_checkins table (vehicle inspections)
CREATE TABLE IF NOT EXISTS driver_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID REFERENCES tours(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES profiles(id),
  vehicle_id UUID REFERENCES vehicles(id),
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  mileage_start INTEGER,
  mileage_end INTEGER,
  fuel_level_before TEXT CHECK (fuel_level_before IN ('empty', '1/4', '1/2', '3/4', 'full')),
  fuel_level_after TEXT CHECK (fuel_level_after IN ('empty', '1/4', '1/2', '3/4', 'full')),
  vehicle_condition TEXT, -- 'good', 'fair', 'poor'
  issues TEXT, -- free text for any problems
  inspection_data JSONB, -- structured checklist: {tires: 'ok', brakes: 'ok', ac: 'issue', cleanliness: 'good'}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_checkins_tour ON driver_checkins(tour_id);
CREATE INDEX IF NOT EXISTS idx_driver_checkins_driver ON driver_checkins(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_checkins_vehicle ON driver_checkins(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_driver_checkins_date ON driver_checkins(checked_in_at);

-- 4. RLS for driver_profiles
ALTER TABLE driver_profiles ENABLE ROW LEVEL SECURITY;

-- Drivers can view their own profile
CREATE POLICY "Drivers can view own profile"
  ON driver_profiles FOR SELECT
  USING (profile_id = auth.uid());

-- Operations/Admins can view all driver profiles
CREATE POLICY "Operations can view all driver profiles"
  ON driver_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('operations', 'supervisor', 'manager', 'company_admin', 'super_admin')
    )
  );

-- Admins can manage driver profiles
CREATE POLICY "Admins can manage driver profiles"
  ON driver_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('manager', 'company_admin', 'super_admin')
    )
  );

-- 5. RLS for driver_checkins
ALTER TABLE driver_checkins ENABLE ROW LEVEL SECURITY;

-- Drivers can view their own check-ins
CREATE POLICY "Drivers can view own check-ins"
  ON driver_checkins FOR SELECT
  USING (driver_id = auth.uid());

-- Drivers can create check-ins
CREATE POLICY "Drivers can create check-ins"
  ON driver_checkins FOR INSERT
  WITH CHECK (driver_id = auth.uid());

-- Operations/Supervisors can view all check-ins
CREATE POLICY "Operations can view all check-ins"
  ON driver_checkins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('operations', 'supervisor', 'manager', 'company_admin', 'super_admin')
    )
  );

-- 6. Update tours RLS to allow drivers to view their assigned tours
CREATE POLICY "Drivers can view assigned tours"
  ON tours FOR SELECT
  USING (
    driver_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.company_id = tours.company_id
    )
  );

-- 7. Trigger for driver_profiles updated_at
CREATE TRIGGER driver_profiles_updated_at
  BEFORE UPDATE ON driver_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Comment documenting the driver role
COMMENT ON COLUMN profiles.role IS 'Roles: super_admin, company_admin, manager, operations, supervisor, guide, driver';
