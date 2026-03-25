-- Update reservation_manifest to match real PDF format from tour companies

-- Add missing fields
ALTER TABLE reservation_manifest 
ADD COLUMN IF NOT EXISTS hotel_name text,
ADD COLUMN IF NOT EXISTS room_number text,
ADD COLUMN IF NOT EXISTS nationality_code text, -- ES, FR, MX, etc.
ADD COLUMN IF NOT EXISTS pickup_time time,
ADD COLUMN IF NOT EXISTS rep_name text,
ADD COLUMN IF NOT EXISTS agency_name text;

-- Create sub-table for multiple guests per reservation
-- (CLIENTE: "FRANCESCA Y ADRIANA" = 2 people, 1 reservation)
CREATE TABLE IF NOT EXISTS reservation_guests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id uuid REFERENCES reservation_manifest(id) ON DELETE CASCADE,
  guest_name text NOT NULL,
  is_primary_contact boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS for guests table
ALTER TABLE reservation_guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY guides_view_reservation_guests ON reservation_guests
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM reservation_manifest rm
  JOIN tours t ON t.id = rm.tour_id
  WHERE rm.id = reservation_guests.reservation_id AND t.guide_id = auth.uid()
));

-- Index
CREATE INDEX IF NOT EXISTS idx_reservation_guests_reservation ON reservation_guests(reservation_id);

-- Verify
SELECT 'Schema updated' as status;
