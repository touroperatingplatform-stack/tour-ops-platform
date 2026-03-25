-- Fix expenses RLS policy

-- Drop existing policy
DROP POLICY IF EXISTS guides_expenses ON expenses;

-- Create new policy that allows inserts
CREATE POLICY guides_expenses ON expenses
FOR ALL TO authenticated
USING (
  guide_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM tours 
    WHERE tours.id = expenses.tour_id 
    AND tours.guide_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('supervisor', 'manager', 'admin')
  )
)
WITH CHECK (
  -- For INSERT: allow if user is the guide or it's their tour
  guide_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM tours 
    WHERE tours.id = expenses.tour_id 
    AND tours.guide_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('supervisor', 'manager', 'admin')
  )
);

-- Also need INSERT policy specifically
DROP POLICY IF EXISTS guides_expenses_insert ON expenses;

CREATE POLICY guides_expenses_insert ON expenses
FOR INSERT TO authenticated
WITH CHECK (
  guide_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM tours 
    WHERE tours.id = expenses.tour_id 
    AND tours.guide_id = auth.uid()
  )
);

-- Verify policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'expenses';
