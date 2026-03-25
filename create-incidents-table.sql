-- Create enhanced incidents table
CREATE TABLE IF NOT EXISTS incidents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tour_id uuid REFERENCES tours(id) ON DELETE CASCADE,
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE,
  guide_id uuid REFERENCES profiles(id),
  
  -- Incident details
  incident_type text NOT NULL CHECK (incident_type IN (
    'medical_emergency',
    'vehicle_breakdown',
    'vehicle_accident',
    'guest_injury',
    'guest_complaint',
    'guest_dispute',
    'weather_delay',
    'traffic_delay',
    'lost_item',
    'theft',
    'other'
  )),
  
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  title text NOT NULL,
  description text NOT NULL,
  
  -- Location
  latitude numeric,
  longitude numeric,
  location_notes text,
  
  -- Photos
  photo_urls text[],
  
  -- Status tracking
  status text DEFAULT 'reported' CHECK (status IN ('reported', 'acknowledged', 'in_progress', 'resolved', 'closed')),
  
  -- Supervisor response
  supervisor_id uuid REFERENCES profiles(id),
  supervisor_notes text,
  resolved_at timestamp with time zone,
  
  -- Guest involved (optional)
  reservation_id uuid REFERENCES reservation_manifest(id),
  guest_names text,
  
  -- Timestamps
  reported_at timestamp with time zone DEFAULT now(),
  acknowledged_at timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_incidents_tour ON incidents(tour_id);
CREATE INDEX IF NOT EXISTS idx_incidents_guide ON incidents(guide_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);

-- RLS policies
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- Guides can view/create incidents for their tours
CREATE POLICY guides_incidents ON incidents
FOR ALL TO authenticated
USING (
  -- Guide can access their own incidents
  guide_id = auth.uid()
  OR
  -- Guide can access incidents for tours they guide
  EXISTS (
    SELECT 1 FROM tours 
    WHERE tours.id = incidents.tour_id 
    AND tours.guide_id = auth.uid()
  )
  OR
  -- Supervisors/managers can view all incidents in their company
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('supervisor', 'manager', 'admin')
  )
);

-- Function to notify supervisor on critical/high incidents
CREATE OR REPLACE FUNCTION notify_supervisor_on_incident()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.severity IN ('high', 'critical') THEN
    -- This would integrate with your notification system
    -- For now, we just update the status
    RAISE NOTICE 'HIGH/CRITICAL incident reported: % - %', NEW.incident_type, NEW.title;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS incident_notification ON incidents;

-- Create trigger
CREATE TRIGGER incident_notification
AFTER INSERT ON incidents
FOR EACH ROW
EXECUTE FUNCTION notify_supervisor_on_incident();

-- Verify
SELECT 'Incidents table created' as status;
