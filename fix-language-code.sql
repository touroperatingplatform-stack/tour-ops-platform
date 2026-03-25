-- Fix: nationality_code should be language_code

-- Rename column
ALTER TABLE reservation_manifest RENAME COLUMN nationality_code TO language_code;

-- Verify
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'reservation_manifest' AND column_name = 'language_code';
