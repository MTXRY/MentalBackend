-- ============================================
-- QUICK FIX: Add email_address to doctors table
-- ============================================
-- Run this in Supabase SQL Editor if email_address column is missing

-- Step 1: Add email_address column
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS email_address VARCHAR(255);

-- Step 2: Set default values for any existing NULL records
UPDATE doctors 
SET email_address = 'doctor_' || id::text || '@example.com'
WHERE email_address IS NULL;

-- Step 3: Make email_address NOT NULL
ALTER TABLE doctors 
ALTER COLUMN email_address SET NOT NULL;

-- Step 4: Add unique constraint
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

-- Step 5: Create index for performance
CREATE INDEX IF NOT EXISTS idx_doctors_email_address ON doctors(email_address);

-- Step 6: Add comment
COMMENT ON COLUMN doctors.email_address IS 'Unique email address for doctor login and communication';

-- Verification: Check the column exists
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'doctors' 
    AND column_name = 'email_address';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'email_address column added successfully to doctors table!';
END $$;

