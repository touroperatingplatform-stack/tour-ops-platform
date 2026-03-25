-- Fix RLS for expenses to allow inserts

-- Drop and recreate with proper WITH CHECK
DROP POLICY IF EXISTS guides_expenses ON expenses;

CREATE POLICY guides_expenses ON expenses
FOR ALL TO authenticated
USING (
  guide_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM tours 
    WHERE tours.id = expenses.tour_id 
    AND tours.guide_id = auth.uid()
  )
)
WITH CHECK (
  guide_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM tours 
    WHERE tours.id = expenses.tour_id 
    AND tours.guide_id = auth.uid()
  )
);
