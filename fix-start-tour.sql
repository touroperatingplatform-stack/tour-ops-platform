-- Check if guides can update tours
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'tours';

-- Add update policy if missing
CREATE POLICY IF NOT EXISTS "guides_update_tours"
ON tours
FOR UPDATE
TO authenticated
USING (guide_id = auth.uid())
WITH CHECK (guide_id = auth.uid());

-- Check started_at column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tours' AND column_name = 'started_at';
