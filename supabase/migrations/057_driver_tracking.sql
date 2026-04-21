-- Driver tracking for transfer/tour workflow
-- Tracks status updates with GPS location

CREATE TABLE driver_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  status TEXT NOT NULL, -- 'vehicle_checked', 'en_route_pickup', 'picked_up', 'en_route_dropoff', 'completed'
  current_step INTEGER DEFAULT 1,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_driver_tracking_driver ON driver_tracking(driver_id);
CREATE INDEX idx_driver_tracking_tour ON driver_tracking(tour_id);
CREATE INDEX idx_driver_tracking_recorded ON driver_tracking(recorded_at);

-- RLS
ALTER TABLE driver_tracking ENABLE ROW LEVEL SECURITY;

-- Drivers can manage their own tracking
CREATE POLICY "Drivers can manage own tracking"
  ON driver_tracking FOR ALL
  USING (driver_id = auth.uid());

-- Admins can view all tracking
CREATE POLICY "Admins can view driver tracking"
  ON driver_tracking FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'company_admin', 'manager', 'supervisor', 'operations')
    )
  );
