-- ============================================
-- QUICK FIX: Add is_verified column to doctors table
-- ============================================
-- Run this in Supabase SQL Editor if is_verified column is missing

-- Step 1: Add is_verified column
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Step 2: Update existing records (set to false if NULL)
UPDATE doctors 
SET is_verified = false
WHERE is_verified IS NULL;

-- Step 3: Ensure default value
ALTER TABLE doctors 
ALTER COLUMN is_verified SET DEFAULT false;

-- Step 4: Create index for performance
CREATE INDEX IF NOT EXISTS idx_doctors_is_verified ON doctors(is_verified);

-- Step 5: Add comment
COMMENT ON COLUMN doctors.is_verified IS 'Whether the doctor credentials have been verified by admin (default: false)';

-- Verification: Check the column exists
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'doctors' 
    AND column_name = 'is_verified';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'is_verified column added successfully to doctors table!';
    RAISE NOTICE 'All existing doctors have been set to is_verified = false';
END $$;

