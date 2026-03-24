-- Activity feed (replaces WhatsApp group)
CREATE TABLE activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Who did it
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_name TEXT, -- Denormalized for display
  actor_role TEXT,
  
  -- What happened
  activity_type TEXT NOT NULL, -- 'tour_started', 'tour_completed', 'incident_reported', 'expense_submitted', 'guest_no_show', 'vehicle_issue'
  
  -- Target (what tour/guest/etc)
  target_type TEXT, -- 'tour', 'guest', 'vehicle', 'expense'
  target_id UUID,
  target_name TEXT, -- e.g., "Chichen Itza Classic"
  
  -- Content
  message TEXT NOT NULL,
  data JSONB, -- Extra details
  
  -- Location (optional - for field updates)
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  
  -- Photos
  photo_urls TEXT[], -- Array of photo URLs
  
  -- Visibility
  is_public BOOLEAN DEFAULT true, -- false = only admins see
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_feed_company ON activity_feed(company_id);
CREATE INDEX idx_activity_feed_created ON activity_feed(created_at DESC);
CREATE INDEX idx_activity_feed_target ON activity_feed(target_type, target_id);

-- Push notifications queue
CREATE TABLE push_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Notification content
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB, -- Extra payload for deep linking
  
  -- Delivery
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  
  -- Retry
  retry_count INTEGER DEFAULT 0,
  last_error TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_push_notifications_user ON push_notifications(user_id);
CREATE INDEX idx_push_notifications_sent ON push_notifications(sent_at) WHERE sent_at IS NULL;
CREATE INDEX idx_push_notifications_read ON push_notifications(read_at) WHERE read_at IS NULL;

-- RLS
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notifications ENABLE ROW LEVEL SECURITY;

-- Everyone in company can see activity feed
CREATE POLICY "Staff can view activity feed"
  ON activity_feed FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.company_id = activity_feed.company_id
    )
  );

-- Users can create activity in their company
CREATE POLICY "Staff can create activity"
  ON activity_feed FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.company_id = activity_feed.company_id
    )
  );

-- Users can only see own notifications
CREATE POLICY "Users can view own notifications"
  ON push_notifications FOR SELECT
  USING (user_id = auth.uid());

-- System can manage notifications
CREATE POLICY "System can manage notifications"
  ON push_notifications FOR ALL
  USING (true);

-- Function to auto-create activity when tour starts
CREATE OR REPLACE FUNCTION create_tour_started_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_guide_name TEXT;
  v_company_id UUID;
  v_tour_name TEXT;
BEGIN
  -- Get guide name
  SELECT first_name || ' ' || last_name, company_id
  INTO v_guide_name, v_company_id
  FROM profiles 
  WHERE id = NEW.guide_id;
  
  -- Get tour name
  SELECT name INTO v_tour_name
  FROM tours WHERE id = NEW.id;
  
  INSERT INTO activity_feed (
    company_id, actor_id, actor_name, actor_role,
    activity_type, target_type, target_id, target_name,
    message, data
  ) VALUES (
    v_company_id, NEW.guide_id, v_guide_name, 'guide',
    'tour_started', 'tour', NEW.id, v_tour_name,
    v_guide_name || ' started ' || v_tour_name,
    jsonb_build_object('tour_id', NEW.id, 'status', 'in_progress')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Real-time subscription helper
COMMENT ON TABLE activity_feed IS 'Real-time activity for team coordination';
