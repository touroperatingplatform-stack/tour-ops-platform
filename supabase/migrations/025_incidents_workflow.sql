-- Incidents Workflow Enhancement
-- Proper status workflow: reported → acknowledged → in_progress → resolved
-- Adds acknowledgment tracking and assignment fields

-- Add acknowledged_at timestamp if not exists
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS acknowledged_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Add in_progress status tracking
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS started_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Ensure guide_id exists (for associating incident with tour guide)
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS guide_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Assignment fields (for assigning incidents to specific staff)
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Escalation tracking
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS escalation_level INTEGER DEFAULT 0;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS escalated_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS escalation_reason TEXT;

-- SLA tracking
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS sla_breached BOOLEAN DEFAULT FALSE;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS sla_breached_at TIMESTAMPTZ;

-- Photo URLs (array to support multiple photos)
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS photo_urls TEXT[];

-- Create index for acknowledgment queries
CREATE INDEX IF NOT EXISTS idx_incidents_acknowledged ON incidents(acknowledged_at DESC) WHERE acknowledged_at IS NULL;

-- Create index for assignment queries
CREATE INDEX IF NOT EXISTS idx_incidents_assigned ON incidents(assigned_to) WHERE assigned_to IS NOT NULL;

-- Update status comment to document valid values
COMMENT ON COLUMN incidents.status IS 'Valid values: reported, acknowledged, in_progress, resolved, closed';

-- RLS: Guides can view incidents from their assigned tours
DROP POLICY IF EXISTS "Guides can view incidents from their tours" ON incidents;
CREATE POLICY "Guides can view incidents from their tours"
  ON incidents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tours
      WHERE tours.id = incidents.tour_id
      AND tours.guide_id = auth.uid()
    )
  );

-- RLS: Supervisors can update all incident fields
DROP POLICY IF EXISTS "Supervisors can update all incidents" ON incidents;
CREATE POLICY "Supervisors can update all incidents"
  ON incidents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('supervisor', 'manager', 'company_admin', 'super_admin')
    )
  );

-- Simple trigger to update updated_at only (avoid auth.uid() issues)
DROP TRIGGER IF EXISTS incidents_status_tracker ON incidents;
DROP FUNCTION IF EXISTS incidents_set_acknowledged_at() CASCADE;
