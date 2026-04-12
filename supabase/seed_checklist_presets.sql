-- System Presets for Checklists
-- These will appear in super-admin and can be cloned by companies
-- Run in Supabase SQL Editor

-- Activity Equipment Presets
INSERT INTO checklists (name, description, items, is_active, company_id) VALUES
(
  'Cenote Swimming Equipment',
  'Standard equipment needed for cenote swimming activities',
  '[
    {"id": "1", "text": "Snorkel masks (per person)", "required": true, "photo_required": false},
    {"id": "2", "text": "Life jackets (per person)", "required": true, "photo_required": false},
    {"id": "3", "text": "Waterproof bags (for phones)", "required": true, "photo_required": false},
    {"id": "4", "text": "Towels (per person)", "required": true, "photo_required": false},
    {"id": "5", "text": "Fresh water rinse bottles", "required": true, "photo_required": false}
  ]'::jsonb,
  true,
  NULL
),
(
  'Ruins Visit Equipment',
  'Equipment and supplies for archaeological site visits',
  '[
    {"id": "1", "text": "Entry tickets (per person)", "required": true, "photo_required": true},
    {"id": "2", "text": "Sun hats (per person)", "required": true, "photo_required": false},
    {"id": "3", "text": "Water bottles (per person)", "required": true, "photo_required": false},
    {"id": "4", "text": "Sunscreen SPF 50+", "required": true, "photo_required": false},
    {"id": "5", "text": "Insect repellent", "required": true, "photo_required": false},
    {"id": "6", "text": "Umbrellas for shade", "required": false, "photo_required": false}
  ]'::jsonb,
  true,
  NULL
),
(
  'Snorkeling Boat Equipment',
  'Equipment for boat-based snorkeling activities',
  '[
    {"id": "1", "text": "Complete snorkel sets (per person)", "required": true, "photo_required": false},
    {"id": "2", "text": "Swim fins (per person)", "required": true, "photo_required": false},
    {"id": "3", "text": "Life jackets - marine grade (per person)", "required": true, "photo_required": true},
    {"id": "4", "text": "Waterproof camera", "required": false, "photo_required": false},
    {"id": "5", "text": "Fish ID cards", "required": false, "photo_required": false},
    {"id": "6", "text": "Marine safety flag", "required": true, "photo_required": false}
  ]'::jsonb,
  true,
  NULL
),
(
  'ATV Adventure Equipment',
  'Safety equipment for ATV/quad bike adventures',
  '[
    {"id": "1", "text": "DOT approved helmets (per person)", "required": true, "photo_required": true},
    {"id": "2", "text": "Goggles (per person)", "required": true, "photo_required": false},
    {"id": "3", "text": "Bandanas/dust masks (per person)", "required": true, "photo_required": false},
    {"id": "4", "text": "Gloves (per person)", "required": true, "photo_required": false},
    {"id": "5", "text": "ATV inspection checklist", "required": true, "photo_required": true}
  ]'::jsonb,
  true,
  NULL
),
(
  'Beach Day Equipment',
  'Comfort items for beach day activities',
  '[
    {"id": "1", "text": "Beach chairs (per person)", "required": false, "photo_required": false},
    {"id": "2", "text": "Beach umbrellas", "required": true, "photo_required": false},
    {"id": "3", "text": "Cooler with ice", "required": true, "photo_required": false},
    {"id": "4", "text": "Beach toys/frisbees", "required": false, "photo_required": false},
    {"id": "5", "text": "Biodegradable sunscreen", "required": true, "photo_required": false},
    {"id": "6", "text": "Trash bags (leave no trace)", "required": true, "photo_required": false}
  ]'::jsonb,
  true,
  NULL
),
(
  'Zip Line Equipment',
  'Safety gear for zip line canopy tours',
  '[
    {"id": "1", "text": "Harnesses - properly fitted (per person)", "required": true, "photo_required": true},
    {"id": "2", "text": "Helmets (per person)", "required": true, "photo_required": false},
    {"id": "3", "text": "Gloves (per person)", "required": true, "photo_required": false},
    {"id": "4", "text": "Safety cables/lanyards", "required": true, "photo_required": false},
    {"id": "5", "text": "Equipment inspection log", "required": true, "photo_required": true}
  ]'::jsonb,
  true,
  NULL
),
(
  'Horseback Riding Equipment',
  'Gear for horseback riding activities',
  '[
    {"id": "1", "text": "Riding helmets (per person)", "required": true, "photo_required": true},
    {"id": "2", "text": "Proper footwear (closed toe)", "required": true, "photo_required": false},
    {"id": "3", "text": "Horse tack inspection", "required": true, "photo_required": true},
    {"id": "4", "text": "Water for horses", "required": true, "photo_required": false},
    {"id": "5", "text": "First aid kit for animals", "required": true, "photo_required": false}
  ]'::jsonb,
  true,
  NULL
),
(
  'Catamaran Cruise Equipment',
  'Items for catamaran sailing activities',
  '[
    {"id": "1", "text": "Life jackets - coast guard approved", "required": true, "photo_required": true},
    {"id": "2", "text": "Snorkel equipment sets", "required": true, "photo_required": false},
    {"id": "3", "text": "Open bar supplies", "required": true, "photo_required": false},
    {"id": "4", "text": "Marine radio/VHF", "required": true, "photo_required": false},
    {"id": "5", "text": "Emergency flotation devices", "required": true, "photo_required": false},
    {"id": "6", "text": "Vessel safety inspection", "required": true, "photo_required": true}
  ]'::jsonb,
  true,
  NULL
),
(
  'Bike Tour Equipment',
  'Gear for bicycle tours',
  '[
    {"id": "1", "text": "Bikes - inspected and tuned", "required": true, "photo_required": true},
    {"id": "2", "text": "Helmets (per person)", "required": true, "photo_required": true},
    {"id": "3", "text": "Bike locks", "required": true, "photo_required": false},
    {"id": "4", "text": "Repair kit/pump", "required": true, "photo_required": false},
    {"id": "5", "text": "Water bottle holders", "required": true, "photo_required": false}
  ]'::jsonb,
  true,
  NULL
),
(
  'Fishing Charter Equipment',
  'Supplies for fishing trips',
  '[
    {"id": "1", "text": "Fishing rods and reels", "required": true, "photo_required": false},
    {"id": "2", "text": "Tackle box/bait", "required": true, "photo_required": false},
    {"id": "3", "text": "Life jackets", "required": true, "photo_required": true},
    {"id": "4", "text": "Fishing licenses (per person)", "required": true, "photo_required": true},
    {"id": "5", "text": "Cooler for catch", "required": true, "photo_required": false},
    {"id": "6", "text": "Fish cleaning supplies", "required": false, "photo_required": false}
  ]'::jsonb,
  true,
  NULL
);

-- Van/Transport Equipment Presets
INSERT INTO checklists (name, description, items, is_active, company_id) VALUES
(
  'Van Standard Equipment',
  'Standard items every tour van should have',
  '[
    {"id": "1", "text": "First aid kit - fully stocked", "required": true, "photo_required": true},
    {"id": "2", "text": "Emergency contact sheet", "required": true, "photo_required": false},
    {"id": "3", "text": "Trash bags", "required": true, "photo_required": false},
    {"id": "4", "text": "Cooler with ice and waters", "required": true, "photo_required": false},
    {"id": "5", "text": "Phone chargers", "required": true, "photo_required": false},
    {"id": "6", "text": "Umbrellas (for rain)", "required": true, "photo_required": false},
    {"id": "7", "text": "Wet wipes/tissues", "required": true, "photo_required": false}
  ]'::jsonb,
  true,
  NULL
);

-- Policy/Procedure Checklists
INSERT INTO checklists (name, description, items, is_active, company_id) VALUES
(
  'Pre-Departure Checklist',
  'Standard items to verify before departing on any tour',
  '[
    {"id": "1", "text": "Van inspection completed", "required": true, "photo_required": true},
    {"id": "2", "text": "First aid kit present and stocked", "required": true, "photo_required": false},
    {"id": "3", "text": "Emergency contacts verified", "required": true, "photo_required": false},
    {"id": "4", "text": "Guest manifest reviewed", "required": true, "photo_required": false},
    {"id": "5", "text": "Cooler box with drinks", "required": true, "photo_required": false},
    {"id": "6", "text": "Equipment checklist complete", "required": true, "photo_required": false},
    {"id": "7", "text": "Petty cash verified", "required": true, "photo_required": false},
    {"id": "8", "text": "Arrived at pickup 20 min early", "required": true, "photo_required": false}
  ]'::jsonb,
  true,
  NULL
),
(
  'Pre-Pickup Checklist',
  'Items to verify before picking up guests',
  '[
    {"id": "1", "text": "Vehicle cleanliness check", "required": true, "photo_required": true},
    {"id": "2", "text": "Temperature comfortable", "required": true, "photo_required": false},
    {"id": "3", "text": "Music system working", "required": true, "photo_required": false},
    {"id": "4", "text": "Guest count confirmed", "required": true, "photo_required": false},
    {"id": "5", "text": "Special needs noted", "required": true, "photo_required": false}
  ]'::jsonb,
  true,
  NULL
),
(
  'Dropoff Checklist',
  'Items to verify during dropoff phase',
  '[
    {"id": "1", "text": "All guests accounted for", "required": true, "photo_required": false},
    {"id": "2", "text": "Guest belongings check", "required": true, "photo_required": false},
    {"id": "3", "text": "Next day reminder given", "required": false, "photo_required": false},
    {"id": "4", "text": "Feedback request made", "required": false, "photo_required": false}
  ]'::jsonb,
  true,
  NULL
),
(
  'Tour Completion Checklist',
  'End of tour wrap-up items',
  '[
    {"id": "1", "text": "Equipment returned and counted", "required": true, "photo_required": false},
    {"id": "2", "text": "Incident report if needed", "required": false, "photo_required": false},
    {"id": "3", "text": "Vehicle cleanup completed", "required": true, "photo_required": true},
    {"id": "4", "text": "Fuel level checked", "required": true, "photo_required": false},
    {"id": "5", "text": "Photos uploaded to cloud", "required": true, "photo_required": false}
  ]'::jsonb,
  true,
  NULL
);

-- Verify inserts
SELECT 
  name,
  description,
  jsonb_array_length(items) as item_count,
  CASE 
    WHEN company_id IS NULL THEN 'System Preset'
    ELSE 'Company Checklist'
  END as type
FROM checklists 
WHERE company_id IS NULL
ORDER BY name;
