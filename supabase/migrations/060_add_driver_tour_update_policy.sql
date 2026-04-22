-- Allow drivers to update their assigned tours
-- This is needed for the driver workflow (acknowledge, complete, etc.)

CREATE POLICY "Drivers can update assigned tours"
  ON tours FOR UPDATE
  USING (driver_id = auth.uid());
