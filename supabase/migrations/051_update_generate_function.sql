-- Update generate_tour_equipment_checklist to use activity_checklist_links

CREATE OR REPLACE FUNCTION generate_tour_equipment_checklist(p_tour_id UUID)
RETURNS UUID AS $$
DECLARE
  v_company_id UUID;
  v_tour_equipment_id UUID;
  v_checklist_items JSONB := '[]';
  v_activity RECORD;
  v_checklist_items_data JSONB;
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
  
  -- Aggregate checklist items from activities' linked checklists
  FOR v_activity IN
    SELECT 
      ta.activity_id,
      a.name AS activity_name,
      c.id AS checklist_id,
      c.items AS checklist_items,
      acl.is_system
    FROM tour_activities ta
    JOIN activities a ON a.id = ta.activity_id
    JOIN activity_checklist_links acl ON acl.activity_id = a.id
    JOIN checklists c ON c.id = acl.checklist_id
    WHERE ta.tour_id = p_tour_id
      AND c.items IS NOT NULL
    ORDER BY ta.sort_order
  LOOP
    -- Parse checklist items
    BEGIN
      v_checklist_items_data := v_activity.checklist_items::JSONB;
    EXCEPTION WHEN OTHERS THEN
      v_checklist_items_data := '[]'::JSONB;
    END;
    
    -- Add each item with activity context
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_checklist_items_data)
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
  
  -- Create tour_equipment_checklist record
  INSERT INTO tour_equipment_checklists (
    tour_id,
    company_id,
    items,
    completed_items,
    is_completed,
    created_at,
    updated_at
  ) VALUES (
    p_tour_id,
    v_company_id,
    v_checklist_items,
    '[]'::JSONB,
    false,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_tour_equipment_id;
  
  RETURN v_tour_equipment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update comments
COMMENT ON FUNCTION generate_tour_equipment_checklist(UUID) IS 
'Generates a combined equipment checklist for a tour based on its activities. 
Uses activity_checklist_links to find which equipment checklists are assigned to each activity.';
