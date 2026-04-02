-- RLS policies for checklist_completions table
ALTER TABLE checklist_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_checklist_completions"
  ON checklist_completions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "guide_select_checklist_completions"
  ON checklist_completions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'guide'
    )
  );

CREATE POLICY "guide_insert_checklist_completions"
  ON checklist_completions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'guide'
    )
  );

-- RLS policies for cash_confirmations table
ALTER TABLE cash_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_cash_confirmations"
  ON cash_confirmations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "guide_select_cash_confirmations"
  ON cash_confirmations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'guide'
    )
  );

CREATE POLICY "guide_insert_cash_confirmations"
  ON cash_confirmations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'guide'
    )
  );
