-- Offline sync queue - stores actions when offline
CREATE TABLE offline_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- What to sync
  action_type TEXT NOT NULL, -- 'checklist_update', 'expense_create', 'incident_create', 'tour_status_update'
  table_name TEXT NOT NULL, -- 'tour_expenses', 'checklists', 'incidents'
  record_id TEXT, -- Optional - for updates
  
  -- The data
  payload JSONB NOT NULL, -- Full record data
  
  -- Sync status
  status TEXT DEFAULT 'pending', -- 'pending', 'syncing', 'synced', 'failed'
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ
);

CREATE INDEX idx_offline_sync_user ON offline_sync_queue(user_id);
CREATE INDEX idx_offline_sync_status ON offline_sync_queue(status) WHERE status != 'synced';

-- RLS
ALTER TABLE offline_sync_queue ENABLE ROW LEVEL SECURITY;

-- Users can only see own queue
CREATE POLICY "Users can view own queue"
  ON offline_sync_queue FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert own queue items
CREATE POLICY "Users can insert queue items"
  ON offline_sync_queue FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update own queue items
CREATE POLICY "Users can update queue items"
  ON offline_sync_queue FOR UPDATE
  USING (user_id = auth.uid());

-- Function to process sync queue (called by client or cron)
CREATE OR REPLACE FUNCTION process_sync_queue(p_user_id UUID)
RETURNS TABLE(processed INTEGER, failed INTEGER) AS $$
DECLARE
  v_record RECORD;
  v_result INTEGER := 0;
  v_failed INTEGER := 0;
BEGIN
  FOR v_record IN 
    SELECT * FROM offline_sync_queue 
    WHERE user_id = p_user_id AND status = 'pending'
    ORDER BY created_at
  LOOP
    BEGIN
      -- Mark as syncing
      UPDATE offline_sync_queue 
      SET status = 'syncing' 
      WHERE id = v_record.id;
      
      -- Process based on action type
      CASE v_record.action_type
        WHEN 'expense_create' THEN
          INSERT INTO tour_expenses (tour_id, guide_id, company_id, category, description, amount, currency, receipt_url, has_receipt, status, notes, created_at, updated_at)
          VALUES (
            (v_record.payload->>'tour_id')::uuid,
            (v_record.payload->>'guide_id')::uuid,
            (v_record.payload->>'company_id')::uuid,
            v_record.payload->>'category',
            v_record.payload->>'description',
            (v_record.payload->>'amount')::decimal,
            v_record.payload->>'currency',
            v_record.payload->>'receipt_url',
            (v_record.payload->>'has_receipt')::boolean,
            v_record.payload->>'status',
            v_record.payload->>'notes',
            NOW(),
            NOW()
          );
        WHEN 'checklist_update' THEN
          -- Handle checklist updates
          NULL;
        WHEN 'incident_create' THEN
          INSERT INTO incidents (tour_id, reported_by, type, severity, description, status, created_at, updated_at)
          VALUES (
            (v_record.payload->>'tour_id')::uuid,
            (v_record.payload->>'reported_by')::uuid,
            v_record.payload->>'type',
            v_record.payload->>'severity',
            v_record.payload->>'description',
            v_record.payload->>'status',
            NOW(),
            NOW()
          );
        WHEN 'tour_status_update' THEN
          UPDATE tours SET status = v_record.payload->>'status' WHERE id = (v_record.payload->>'id')::uuid;
      END CASE;
      
      -- Mark as synced
      UPDATE offline_sync_queue 
      SET status = 'synced', synced_at = NOW()
      WHERE id = v_record.id;
      
      v_result := v_result + 1;
      
    EXCEPTION WHEN OTHERS THEN
      -- Mark as failed
      UPDATE offline_sync_queue 
      SET status = 'failed', error_message = SQLERRM, retry_count = retry_count + 1
      WHERE id = v_record.id;
      
      v_failed := v_failed + 1;
    END;
  END LOOP;
  
  RETURN QUERY SELECT v_result, v_failed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
