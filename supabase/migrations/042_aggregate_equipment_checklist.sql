-- Migration 042: Function to aggregate equipment checklist from activities

-- Function to generate tour equipment checklist from activities
CREATE OR REPLACE FUNCTION generate_tour_equipment_checklist(p_tour_id UUID)
RETURNS UUID AS $$
DECLARE
  v_company_id UUID;
  v_tour_equipment_id UUID;
  v_checklist_items JSONB := '[]';
  v_activity RECORD;
  v_template_items JSONB;
  v_item JSONB;
  v_item_text TEXT;
  v_seen_items TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Get company_id from tour
  SELECT company_id INTO v_company_id
  FROM tours WHERE id = p_tour_id;
  
  IF v_company_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Aggregate checklist items from all activity-linked checklists
  FOR v_activity IN
    SELECT 
      ta.activity_id,
      a.name AS activity_name,
      a.checklist_template_id,
      ct.items AS template_items
    FROM tour_activities ta
    JOIN activities a ON a.id = ta.activity_id
    LEFT JOIN checklist_templates ct ON ct.id = a.checklist_template_id
    WHERE ta.tour_id = p_tour_id
      AND a.checklist_template_id IS NOT NULL
      AND ct.items IS NOT NULL
    ORDER BY ta.sort_order
  LOOP
    -- Parse template items
    BEGIN
      v_template_items := v_activity.template_items::JSONB;
    EXCEPTION WHEN OTHERS THEN
      v_template_items := '[]'::JSONB;
    END;
    
    -- Add each item with activity context
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_template_items)
    LOOP
      v_item_text := v_item->>'text';
      
      -- Skip duplicates
      IF v_item_text IS NOT NULL AND NOT (v_item_text = ANY(v_seen_items)) THEN
        v_seen_items := array_append(v_seen_items, v_item_text);
        
        -- Add item with activity label
        v_checklist_items := v_checklist_items || jsonb_build_object(
          'id', gen_random_uuid(),
          'text', v_activity.activity_name || ': ' || v_item_text,
          'original_text', v_item_text,
          'activity', v_activity.activity_name,
          'required', COALESCE((v_item->>'required')::boolean, true),
          'photo_required', COALESCE((v_item->>'photo_required')::boolean, false),
          'completed', false,
          'photo_url', null
        );
      END IF;
    END LOOP;
  END LOOP;
  
  -- Add standard pre-tour items
  v_checklist_items := v_checklist_items || jsonb_build_object(
    'id', gen_random_uuid(),
    'text', 'Standard: Van inspection completed',
    'original_text', 'Van inspection completed',
    'activity', 'Pre-Departure',
    'required', true,
    'photo_required', true,
    'completed', false,
    'photo_url', null
  );
  
  v_checklist_items := v_checklist_items || jsonb_build_object(
    'id', gen_random_uuid(),
    'text', 'Standard: First aid kit present',
    'original_text', 'First aid kit present',
    'activity', 'Pre-Departure',
    'required', true,
    'photo_required', false,
    'completed', false,
    'photo_url', null
  );
  
  v_checklist_items := v_checklist_items || jsonb_build_object(
    'id', gen_random_uuid(),
    'text', 'Standard: Emergency contacts verified',
    'original_text', 'Emergency contacts verified',
    'activity', 'Pre-Departure',
    'required', true,
    'photo_required', false,
    'completed', false,
    'photo_url', null
  );
  
  -- Insert or update tour equipment checklist
  INSERT INTO tour_equipment_checklists (
    tour_id,
    company_id,
    activity_id,
    checklist_template_id,
    items,
    completed_items,
    is_completed
  )
  VALUES (
    p_tour_id,
    v_company_id,
    NULL, -- Combined checklist
    NULL,
    v_checklist_items,
    '[]'::JSONB,
    false
  )
  ON CONFLICT (tour_id, activity_id) DO UPDATE
  SET items = EXCLUDED.items,
      updated_at = NOW()
  WHERE tour_equipment_checklists.activity_id IS NULL
  RETURNING id INTO v_tour_equipment_id;
  
  RETURN v_tour_equipment_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate equipment checklist when tour is created
CREATE OR REPLACE FUNCTION auto_generate_tour_equipment()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate equipment checklist after activities are added
  PERFORM generate_tour_equipment_checklist(NEW.tour_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: Application code will call generate_tour_equipment_checklist after activities are created
