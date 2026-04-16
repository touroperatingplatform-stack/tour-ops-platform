-- Migration 053: Add checklist_assignments to tour_products
-- Stores all stage checklists per tour product

ALTER TABLE tour_products
ADD COLUMN IF NOT EXISTS checklist_assignments JSONB DEFAULT '{
  "pre_departure": [],
  "pre_pickup": {
    "enabled": false,
    "checklists": []
  },
  "activity": {},
  "dropoff": [],
  "finish": []
}';

-- Validate JSON structure
CREATE OR REPLACE FUNCTION validate_tour_product_checklists()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure pre_pickup has required structure
  IF NEW.checklist_assignments->'pre_pickup' IS NULL THEN
    NEW.checklist_assignments := jsonb_set(
      NEW.checklist_assignments,
      '{pre_pickup}',
      '{"enabled": false, "checklists": []}'::jsonb
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_validate_checklists ON tour_products;
CREATE TRIGGER tr_validate_checklists
  BEFORE INSERT OR UPDATE ON tour_products
  FOR EACH ROW
  EXECUTE FUNCTION validate_tour_product_checklists();

COMMENT ON COLUMN tour_products.checklist_assignments IS 
'JSON structure for all stage checklists:
{
  "pre_departure": ["checklist_id", ...],
  "pre_pickup": {"enabled": boolean, "checklists": ["checklist_id", ...]},
  "activity": {"activity_id": ["checklist_id", ...], ...},
  "dropoff": ["checklist_id", ...],
  "finish": ["checklist_id", ...]
}';
