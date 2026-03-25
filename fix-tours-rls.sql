-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Guides can view their assigned tours" ON tours;

-- Create policy allowing guides to view their tours
CREATE POLICY "Guides can view their assigned tours"
ON tours
FOR SELECT
TO authenticated
USING (guide_id = auth.uid());

-- Also allow guides to update their tours (for check-ins, status changes)
DROP POLICY IF EXISTS "Guides can update their assigned tours" ON tours;

CREATE POLICY "Guides can update their assigned tours"
ON tours
FOR UPDATE
TO authenticated
USING (guide_id = auth.uid())
WITH CHECK (guide_id = auth.uid());

-- Verify
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'tours';
