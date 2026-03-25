-- Create guest_manifest table for tour guests
CREATE TABLE IF NOT EXISTS guest_manifest (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tour_id uuid REFERENCES tours(id) ON DELETE CASCADE,
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE,
  
  -- Guest info (from booking import)
  booking_reference text, -- e.g., VIATOR-12345
  guest_name text NOT NULL,
  email text,
  phone text,
  
  -- Special requirements
  dietary_restrictions text[], -- ['vegetarian', 'gluten_free']
  accessibility_needs text[], -- ['wheelchair', 'mobility_aid']
  special_requests text, -- "Allergic to peanuts", "Celebrating anniversary"
  
  -- Pickup info
  pickup_location text,
  pickup_stop_id uuid REFERENCES pickup_stops(id),
  
  -- Check-in tracking
  checked_in boolean DEFAULT false,
  checked_in_at timestamp with time zone,
  no_show boolean DEFAULT false,
  notes text, -- Guide notes about this guest
  
  -- Audit
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_guest_manifest_tour ON guest_manifest(tour_id);
CREATE INDEX IF NOT EXISTS idx_guest_manifest_booking ON guest_manifest(booking_reference);

-- RLS policies
ALTER TABLE guest_manifest ENABLE ROW LEVEL SECURITY;

-- Guides can view guests for their tours
CREATE POLICY guides_view_manifest ON guest_manifest
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM tours WHERE tours.id = guest_manifest.tour_id AND tours.guide_id = auth.uid()
));

-- Guides can update check-in status for their tours
CREATE POLICY guides_update_manifest ON guest_manifest
FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM tours WHERE tours.id = guest_manifest.tour_id AND tours.guide_id = auth.uid()
));

-- Verify table created
SELECT 'Table created' as status;
