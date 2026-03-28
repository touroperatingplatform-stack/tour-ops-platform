-- Incident Comments Table
CREATE TABLE IF NOT EXISTS incident_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incident_comments_incident ON incident_comments(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_comments_author ON incident_comments(author_id);

-- Add resolution fields to incidents (if not exist)
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS resolution_notes TEXT;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS resolution_category TEXT; -- 'repaired', 'replaced', 'refunded', 'apologized', 'other'
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- RLS for incident_comments
ALTER TABLE incident_comments ENABLE ROW LEVEL SECURITY;

-- Everyone involved can view comments
CREATE POLICY "View incident comments"
  ON incident_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM incidents i
      WHERE i.id = incident_comments.incident_id
      AND (
        i.guide_id = auth.uid() OR
        i.assigned_to = auth.uid() OR
        i.reported_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
          AND p.role IN ('operations', 'supervisor', 'manager', 'company_admin', 'super_admin')
        )
      )
    )
  );

-- Guides, ops, supervisors can insert comments
CREATE POLICY "Insert incident comments"
  ON incident_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('guide', 'driver', 'operations', 'supervisor', 'manager', 'company_admin', 'super_admin')
    )
  );

-- Authors can update their own comments
CREATE POLICY "Update own comments"
  ON incident_comments FOR UPDATE
  USING (author_id = auth.uid());

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_incident_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER incident_comments_updated_at
  BEFORE UPDATE ON incident_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_incident_comments_updated_at();
