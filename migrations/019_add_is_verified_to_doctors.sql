-- ============================================
-- Add is_verified column to doctors table
-- ============================================
-- This migration adds the is_verified column for doctor verification status

-- Add is_verified column if it doesn't exist
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Update existing records to have is_verified = false if NULL
UPDATE doctors 
SET is_verified = false
WHERE is_verified IS NULL;

-- Ensure default value is set
ALTER TABLE doctors 
ALTER COLUMN is_verified SET DEFAULT false;

-- Create index on is_verified for faster filtering
CREATE INDEX IF NOT EXISTS idx_doctors_is_verified ON doctors(is_verified);

-- Add comment
COMMENT ON COLUMN doctors.is_verified IS 'Whether the doctor credentials have been verified by admin (default: false)';

-- ============================================
-- Verification
-- ============================================
-- Check that the column was added successfully
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'doctors' AND column_name = 'is_verified'
    ) THEN
        RAISE NOTICE 'is_verified column added successfully to doctors table';
    ELSE
        RAISE EXCEPTION 'Failed to add is_verified column';
    END IF;
END $$;

