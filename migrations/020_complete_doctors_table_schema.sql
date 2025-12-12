-- ============================================
-- COMPLETE DOCTORS TABLE SCHEMA
-- ============================================
-- This migration ensures ALL columns needed for adding a doctor exist
-- Run this to fix any missing columns in the doctors table

-- ============================================
-- STEP 1: Ensure all required columns exist
-- ============================================

-- full_name (required)
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

-- Make full_name NOT NULL
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'doctors' 
        AND column_name = 'full_name' 
        AND is_nullable = 'YES'
    ) THEN
        -- Set default for any NULL values first
        UPDATE doctors 
        SET full_name = 'Doctor ' || id::text
        WHERE full_name IS NULL;
        
        ALTER TABLE doctors ALTER COLUMN full_name SET NOT NULL;
    END IF;
END $$;

-- email_address (required, unique)
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS email_address VARCHAR(255);

-- Set default emails for existing records if NULL
UPDATE doctors 
SET email_address = 'doctor_' || id::text || '@example.com'
WHERE email_address IS NULL;

-- Make email_address NOT NULL
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'doctors' 
        AND column_name = 'email_address' 
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE doctors ALTER COLUMN email_address SET NOT NULL;
    END IF;
END $$;

-- Add unique constraint on email_address
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

-- password_hash (optional - for authentication)
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- phone_number (optional)
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- specialization (required)
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS specialization VARCHAR(255);

-- Make specialization NOT NULL
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'doctors' 
        AND column_name = 'specialization' 
        AND is_nullable = 'YES'
    ) THEN
        UPDATE doctors 
        SET specialization = 'General Practice'
        WHERE specialization IS NULL;
        
        ALTER TABLE doctors ALTER COLUMN specialization SET NOT NULL;
    END IF;
END $$;

-- license_number (required, unique)
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS license_number VARCHAR(100);

-- Set default license numbers for existing records if NULL
UPDATE doctors 
SET license_number = 'LIC-' || id::text
WHERE license_number IS NULL;

-- Add unique constraint on license_number
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'doctors_license_number_key'
    ) THEN
        ALTER TABLE doctors 
        ADD CONSTRAINT doctors_license_number_key UNIQUE (license_number);
    END IF;
END $$;

-- qualifications (optional)
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS qualifications TEXT;

-- bio (optional)
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- years_of_experience (optional)
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS years_of_experience INTEGER;

-- consultation_fee (optional - legacy field)
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS consultation_fee DECIMAL(10, 2);

-- profile_image_url (optional)
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- is_active (required, default true)
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing records
UPDATE doctors 
SET is_active = true
WHERE is_active IS NULL;

ALTER TABLE doctors 
ALTER COLUMN is_active SET DEFAULT true;

-- is_verified (required, default false)
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Update existing records
UPDATE doctors 
SET is_verified = false
WHERE is_verified IS NULL;

ALTER TABLE doctors 
ALTER COLUMN is_verified SET DEFAULT false;

-- mental_health_specialties (optional, JSONB array)
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS mental_health_specialties JSONB DEFAULT '[]'::jsonb;

-- created_at (auto-generated)
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- updated_at (auto-generated)
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ============================================
-- STEP 2: Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_doctors_email_address ON doctors(email_address);
CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization);
CREATE INDEX IF NOT EXISTS idx_doctors_license_number ON doctors(license_number);
CREATE INDEX IF NOT EXISTS idx_doctors_is_active ON doctors(is_active);
CREATE INDEX IF NOT EXISTS idx_doctors_is_verified ON doctors(is_verified);
CREATE INDEX IF NOT EXISTS idx_doctors_mental_health_specialties ON doctors USING GIN (mental_health_specialties);

-- ============================================
-- STEP 3: Create/Update trigger function for updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_doctors_updated_at ON doctors;
CREATE TRIGGER update_doctors_updated_at 
    BEFORE UPDATE ON doctors
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 4: Add column comments
-- ============================================

COMMENT ON COLUMN doctors.full_name IS 'Full name of the doctor (required)';
COMMENT ON COLUMN doctors.email_address IS 'Unique email address for login and communication (required)';
COMMENT ON COLUMN doctors.password_hash IS 'Hashed password for doctor authentication (optional)';
COMMENT ON COLUMN doctors.phone_number IS 'Contact phone number (optional)';
COMMENT ON COLUMN doctors.specialization IS 'Medical specialty or area of expertise (required)';
COMMENT ON COLUMN doctors.license_number IS 'Medical license or registration number (required, unique)';
COMMENT ON COLUMN doctors.qualifications IS 'Educational qualifications and certifications (optional)';
COMMENT ON COLUMN doctors.bio IS 'Professional biography and background (optional)';
COMMENT ON COLUMN doctors.years_of_experience IS 'Years of professional experience (optional)';
COMMENT ON COLUMN doctors.consultation_fee IS 'Legacy field - use consultation_fees table for current fees (optional)';
COMMENT ON COLUMN doctors.profile_image_url IS 'URL to doctor profile image (optional)';
COMMENT ON COLUMN doctors.is_active IS 'Whether the doctor is currently accepting new patients (default: true)';
COMMENT ON COLUMN doctors.is_verified IS 'Whether the doctor credentials have been verified by admin (default: false)';
COMMENT ON COLUMN doctors.mental_health_specialties IS 'Array of specific mental health issues/problems the doctor specializes in (optional)';

-- ============================================
-- STEP 5: Verification
-- ============================================

-- Verify all required columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'doctors'
ORDER BY ordinal_position;

-- Success message
DO $$
DECLARE
    column_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_name = 'doctors';
    
    RAISE NOTICE 'Doctors table schema updated successfully!';
    RAISE NOTICE 'Total columns: %', column_count;
    RAISE NOTICE 'All required columns for adding doctors are now available.';
END $$;


