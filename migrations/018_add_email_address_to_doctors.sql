-- ============================================
-- Add email_address column to doctors table
-- ============================================
-- This migration adds the email_address column that is required for doctor registration

-- Add email_address column if it doesn't exist
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS email_address VARCHAR(255);

-- Make email_address NOT NULL (after adding, we'll update existing records if needed)
-- First, set a default for any existing NULL values
UPDATE doctors 
SET email_address = 'doctor_' || id::text || '@example.com'
WHERE email_address IS NULL;

-- Now make it NOT NULL
ALTER TABLE doctors 
ALTER COLUMN email_address SET NOT NULL;

-- Add unique constraint on email_address if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'doctors_email_address_key'
    ) THEN
        ALTER TABLE doctors 
        ADD CONSTRAINT doctors_email_address_key UNIQUE (email_address);
    END IF;
END $$;

-- Create index on email_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_doctors_email_address ON doctors(email_address);

-- Add comment
COMMENT ON COLUMN doctors.email_address IS 'Unique email address for doctor login and communication';

-- ============================================
-- Verification
-- ============================================
-- Check that the column was added successfully
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'doctors' AND column_name = 'email_address'
    ) THEN
        RAISE NOTICE 'email_address column added successfully to doctors table';
    ELSE
        RAISE EXCEPTION 'Failed to add email_address column';
    END IF;
END $$;

