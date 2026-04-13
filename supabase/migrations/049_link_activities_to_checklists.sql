-- Create system presets in checklist_templates (for activities FK)
-- These are the same as checklists but in the template table

INSERT INTO checklist_templates (company_id, stage, label, is_mandatory, sort_order, is_active) VALUES
  (NULL, 'activity', 'Snorkel masks (per person)', true, 1, true),
  (NULL, 'activity', 'Snorkels (per person)', true, 2, true),
  (NULL, 'activity', 'Fins (per person)', true, 3, true),
  (NULL, 'activity', 'Life jackets (per person)', true, 4, true),
  (NULL, 'activity', 'Waterproof bags', true, 5, true);

-- But actually we need GROUPED templates, not individual items
-- Let me create proper checklist_templates for activities

-- First, let's see what's in checklist_templates vs what we need
-- checklist_templates has: id, company_id, stage, label, is_mandatory, sort_order
-- This is for INDIVIDUAL checklist items, not grouped presets

-- The issue is the architecture mismatch
-- checklists = grouped presets with items JSON
-- checklist_templates = individual items per stage

-- For activities, we need a way to link to a GROUP of equipment
-- Options:
-- 1. Add checklist_group_id to activities
-- 2. Use checklists.id in activities.default_checklist_template_id
-- 3. Create a new linking table

-- The cleanest fix: Change activities.default_checklist_template_id to reference checklists
-- But that's a schema change

-- Alternative: Create a checklist_groups table

-- For now, let's add checklist_group_id to activities
ALTER TABLE activities ADD COLUMN IF NOT EXISTS checklist_group_id UUID REFERENCES checklists(id);

-- Now update the presets to have group IDs
-- This requires knowing the checklist IDs

-- Actually, let's just query what we have and link manually
