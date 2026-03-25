ALTER TABLE incidents ADD COLUMN IF NOT EXISTS guide_id uuid REFERENCES profiles(id);
