-- Convert guest_manifest to reservation_manifest
-- Tours use reservations with PAX, not individual guests

-- Drop existing table
DROP TABLE IF EXISTS guest_manifest CASCADE;

-- Create new reservation_manifest table
CREATE TABLE IF NOT EXISTS reservation_manifest (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tour_id uuid REFERENCES tours(id) ON DELETE CASCADE,
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE,
  
  -- Booking info
  booking_reference text NOT NULL, -- VIATOR-78234, GETYOURGUIDE-4521
  booking_platform text, -- viator, getyourguide, direct, etc.
  
  -- PAX (passengers)
  adult_pax integer DEFAULT 0,      -- Adults count
  child_pax integer DEFAULT 0,      -- Children count
  infant_pax integer DEFAULT 0,   -- Infants (0-2 yrs)
  total_pax integer GENERATED ALWAYS AS (adult_pax + child_pax + infant_pax) STORED,
  
  -- Primary contact (optional, for reference)
  primary_contact_name text,
  contact_phone text,
  contact_email text,
  
  -- Special requirements
  dietary_restrictions text[],
  accessibility_needs text[],
  special_requests text,
  
  -- Pickup
  pickup_location text,
  pickup_stop_id uuid REFERENCES pickup_stops(id),
  
  -- Check-in tracking
  checked_in boolean DEFAULT false,
  checked_in_at timestamp with time zone,
  actual_adult_pax integer,    -- What guide actually counts
  actual_child_pax integer,
  actual_infant_pax integer,
  
  no_show boolean DEFAULT false,
  notes text,
  
  -- Audit
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reservation_manifest_tour ON reservation_manifest(tour_id);
CREATE INDEX IF NOT EXISTS idx_reservation_manifest_booking ON reservation_manifest(booking_reference);

-- RLS policies
ALTER TABLE reservation_manifest ENABLE ROW LEVEL SECURITY;

-- Guides can view reservations for their tours
CREATE POLICY guides_view_reservations ON reservation_manifest
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM tours WHERE tours.id = reservation_manifest.tour_id AND tours.guide_id = auth.uid()
));

-- Guides can update check-in status
CREATE POLICY guides_update_reservations ON reservation_manifest
FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM tours WHERE tours.id = reservation_manifest.tour_id AND tours.guide_id = auth.uid()
));

-- Verify
SELECT 'Reservation manifest table created' as status;
