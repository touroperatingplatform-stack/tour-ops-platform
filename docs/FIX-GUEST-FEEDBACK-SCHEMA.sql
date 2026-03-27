-- ============================================================
-- FIX GUEST_FEEDBACK TABLE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================================

-- First, check what columns currently exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'guest_feedback'
ORDER BY ordinal_position;

-- ============================================================
-- ADD MISSING COLUMNS (if they don't exist)
-- ============================================================

-- Add review_title if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'guest_feedback' 
    AND column_name = 'review_title'
  ) THEN
    ALTER TABLE guest_feedback ADD COLUMN review_title TEXT;
    RAISE NOTICE 'Added review_title column';
  END IF;
END $$;

-- Add review_text if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'guest_feedback' 
    AND column_name = 'review_text'
  ) THEN
    ALTER TABLE guest_feedback ADD COLUMN review_text TEXT;
    RAISE NOTICE 'Added review_text column';
  END IF;
END $$;

-- Add review_date if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'guest_feedback' 
    AND column_name = 'review_date'
  ) THEN
    ALTER TABLE guest_feedback ADD COLUMN review_date TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Added review_date column';
  END IF;
END $$;

-- Add responded if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'guest_feedback' 
    AND column_name = 'responded'
  ) THEN
    ALTER TABLE guest_feedback ADD COLUMN responded BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added responded column';
  END IF;
END $$;

-- Add guest_id if missing (optional, for future use)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'guest_feedback' 
    AND column_name = 'guest_id'
  ) THEN
    ALTER TABLE guest_feedback ADD COLUMN guest_id UUID REFERENCES guests(id);
    RAISE NOTICE 'Added guest_id column';
  END IF;
END $$;

-- ============================================================
-- VERIFY FINAL SCHEMA
-- ============================================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'guest_feedback'
ORDER BY ordinal_position;

-- ============================================================
-- EXPECTED RESULT:
-- column_name    | data_type   | is_nullable | column_default
-- ---------------|-------------|-------------|---------------
-- id             | uuid        | NO          | gen_random_uuid()
-- tour_id        | uuid        | NO          | 
-- rating         | integer     | NO          | 
-- review_title   | text        | YES         | 
-- review_text    | text        | YES         | 
-- review_date    | timestamptz | YES         | now()
-- responded      | boolean     | YES         | false
-- guest_id       | uuid        | YES         | 
-- created_at     | timestamptz | YES         | now()
-- ============================================================
