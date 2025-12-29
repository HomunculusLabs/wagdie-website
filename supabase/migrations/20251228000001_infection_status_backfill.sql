-- Placeholder for infection_status backfill migration
-- WAGDIE Simplified Database Schema
-- Migration: Infection status backfill and index
-- Date: 2025-12-28

-- ============================================================================
-- INFECTION_STATUS COLUMN
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'wagdie_characters'
      AND column_name = 'infection_status'
  ) THEN
    ALTER TABLE wagdie_characters
      ADD COLUMN infection_status TEXT
      CHECK (infection_status IN ('healthy', 'infected', 'cured'));
  END IF;
END $$;

-- Ensure default for new records
ALTER TABLE wagdie_characters
  ALTER COLUMN infection_status SET DEFAULT 'healthy';

-- Ensure the check constraint exists even if the column predated this migration
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY (c.conkey)
    WHERE t.relname = 'wagdie_characters'
      AND c.contype = 'c'
      AND a.attname = 'infection_status'
  ) THEN
    ALTER TABLE wagdie_characters
      ADD CONSTRAINT wagdie_characters_infection_status_check
      CHECK (infection_status IN ('healthy', 'infected', 'cured'));
  END IF;
END $$;

-- ============================================================================
-- BACKFILL INFECTION_STATUS
-- ============================================================================

UPDATE wagdie_characters
SET infection_status = CASE
  WHEN infected IS TRUE THEN 'infected'
  ELSE 'healthy'
END
WHERE infection_status IS NULL;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_wagdie_characters_infection_status
  ON wagdie_characters (infection_status);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON MIGRATION IS 'Backfill infection_status from legacy infected flag and add index';
