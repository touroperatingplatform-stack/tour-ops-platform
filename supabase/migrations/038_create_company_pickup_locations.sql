-- Migration 038: Create company_pickup_locations table
CREATE TABLE company_pickup_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text,
  latitude numeric,
  longitude numeric,
  zone text,
  status text DEFAULT 'active',
  flagged_for_review boolean DEFAULT true,
  platform_location_id uuid REFERENCES pickup_locations_platform(id),
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE company_pickup_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_admins_manage_pickup_locations" ON company_pickup_locations
 FOR ALL USING (
 EXISTS (
 SELECT 1 FROM profiles
 WHERE profiles.id = auth.uid()
 AND profiles.company_id = company_pickup_locations.company_id
 )
 );

CREATE POLICY "super_admins_full_access_company_pickup_locations" ON company_pickup_locations
 FOR ALL USING (
 (auth.jwt() ->> 'role'::text) = 'super_admin'::text
 );

-- Indexes
CREATE INDEX idx_company_pickup_locations_company_id ON company_pickup_locations(company_id);
CREATE INDEX idx_company_pickup_locations_flagged ON company_pickup_locations(flagged_for_review) WHERE flagged_for_review = true;
