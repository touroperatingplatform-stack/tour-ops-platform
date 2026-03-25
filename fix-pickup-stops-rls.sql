-- Check RLS on pickup_stops
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'pickup_stops';

-- Check if RLS is enabled
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'pickup_stops';

-- Add policy if needed
CREATE POLICY "guides_view_pickup_stops"
ON pickup_stops
FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM tours t 
    WHERE t.id = pickup_stops.tour_id 
    AND t.guide_id = auth.uid()
));
