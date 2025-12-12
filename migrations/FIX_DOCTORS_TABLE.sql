-- ============================================
-- FIX DOCTORS TABLE - Run this in Supabase SQL Editor
-- ============================================
-- This script ensures all required columns exist in the doctors table
-- Run this if you're getting "column not found" errors

-- Step 1: Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 2: Add all missing columns
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS bio TEXT;

ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS qualifications TEXT;

ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS years_of_experience INTEGER;

ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS consultation_fee DECIMAL(10, 2);

ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS mental_health_specialties JSONB DEFAULT '[]'::jsonb;

ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 3: Ensure required columns are NOT NULL
ALTER TABLE doctors 
ALTER COLUMN full_name SET NOT NULL;

ALTER TABLE doctors 
ALTER COLUMN email_address SET NOT NULL;

ALTER TABLE doctors 
ALTER COLUMN specialization SET NOT NULL;

-- Step 4: Add unique constraints if they don't exist
DO $$ 
BEGIN
    -- Email unique constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'doctors_email_address_key'
    ) THEN
        ALTER TABLE doctors ADD CONSTRAINT doctors_email_address_key UNIQUE (email_address);
    END IF;
    
    -- License number unique constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'doctors_license_number_key'
    ) THEN
        ALTER TABLE doctors ADD CONSTRAINT doctors_license_number_key UNIQUE (license_number);
    END IF;
END $$;

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_doctors_email ON doctors(email_address);
CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization);
CREATE INDEX IF NOT EXISTS idx_doctors_license ON doctors(license_number);
CREATE INDEX IF NOT EXISTS idx_doctors_active ON doctors(is_active);
CREATE INDEX IF NOT EXISTS idx_doctors_mental_health_specialties ON doctors USING GIN (mental_health_specialties);

-- Step 6: Create or replace the trigger for updated_at
DROP TRIGGER IF EXISTS update_doctors_updated_at ON doctors;
CREATE TRIGGER update_doctors_updated_at 
    BEFORE UPDATE ON doctors
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Add column comments
COMMENT ON COLUMN doctors.bio IS 'Professional biography and background';
COMMENT ON COLUMN doctors.qualifications IS 'Educational qualifications and certifications';
COMMENT ON COLUMN doctors.phone_number IS 'Contact phone number';
COMMENT ON COLUMN doctors.years_of_experience IS 'Years of professional experience';
COMMENT ON COLUMN doctors.consultation_fee IS 'Fee per consultation session';
COMMENT ON COLUMN doctors.profile_image_url IS 'URL to doctor profile image';
COMMENT ON COLUMN doctors.is_active IS 'Whether the doctor is currently accepting new patients';
COMMENT ON COLUMN doctors.is_verified IS 'Whether the doctor credentials have been verified by admin';
COMMENT ON COLUMN doctors.mental_health_specialties IS 'Array of specific mental health issues/problems the doctor specializes in';

-- Verification: Check the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'doctors'
ORDER BY ordinal_position;

